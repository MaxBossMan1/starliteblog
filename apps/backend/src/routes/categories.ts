import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
};

// GET /api/categories - Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: {
                post: {
                  isPublished: true,
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(categories.map(category => ({
      ...category,
      postCount: category._count.posts,
      _count: undefined,
    })));
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/categories/:slug - Get category by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        posts: {
          where: {
            post: {
              isPublished: true,
            },
          },
          include: {
            post: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                tags: {
                  include: {
                    tag: true,
                  },
                },
              },
            },
          },
          orderBy: {
            post: {
              publishedAt: 'desc',
            },
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      ...category,
      posts: category.posts.map(cp => ({
        ...cp.post,
        tags: cp.post.tags.map(pt => pt.tag),
      })),
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/categories - Create new category (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Generate slug
    let slug = generateSlug(name);
    
    // Ensure unique slug
    let slugExists = await prisma.category.findUnique({ where: { slug } });
    let counter = 1;
    while (slugExists) {
      slug = `${generateSlug(name)}-${counter}`;
      slugExists = await prisma.category.findUnique({ where: { slug } });
      counter++;
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        color,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/categories/:id - Update category (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    const existingCategory = await prisma.category.findUnique({ where: { id } });
    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Generate new slug if name changed
    let slug = existingCategory.slug;
    if (name && name !== existingCategory.name) {
      slug = generateSlug(name);
      
      // Ensure unique slug
      let slugExists = await prisma.category.findFirst({ 
        where: { 
          slug,
          id: { not: id }
        } 
      });
      let counter = 1;
      while (slugExists) {
        slug = `${generateSlug(name)}-${counter}`;
        slugExists = await prisma.category.findFirst({ 
          where: { 
            slug,
            id: { not: id }
          } 
        });
        counter++;
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name || existingCategory.name,
        slug,
        description,
        color,
      },
    });

    res.json(updatedCategory);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/categories/:id - Delete category (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({ 
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category._count.posts > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with associated posts' 
      });
    }

    await prisma.category.delete({ where: { id } });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;