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

// GET /api/tags - Get all tags (public)
router.get('/', async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
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

    res.json(tags.map(tag => ({
      ...tag,
      postCount: tag._count.posts,
      _count: undefined,
    })));
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tags/:slug - Get tag by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const tag = await prisma.tag.findUnique({
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
                categories: {
                  include: {
                    category: true,
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

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json({
      ...tag,
      posts: tag.posts.map(tp => ({
        ...tp.post,
        categories: tp.post.categories.map(pc => pc.category),
      })),
    });
  } catch (error) {
    console.error('Get tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tags - Create new tag (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Generate slug
    let slug = generateSlug(name);
    
    // Ensure unique slug
    let slugExists = await prisma.tag.findUnique({ where: { slug } });
    let counter = 1;
    while (slugExists) {
      slug = `${generateSlug(name)}-${counter}`;
      slugExists = await prisma.tag.findUnique({ where: { slug } });
      counter++;
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        slug,
      },
    });

    res.status(201).json(tag);
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tags/:id - Update tag (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const existingTag = await prisma.tag.findUnique({ where: { id } });
    if (!existingTag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Generate new slug if name changed
    let slug = existingTag.slug;
    if (name !== existingTag.name) {
      slug = generateSlug(name);
      
      // Ensure unique slug
      let slugExists = await prisma.tag.findFirst({ 
        where: { 
          slug,
          id: { not: id }
        } 
      });
      let counter = 1;
      while (slugExists) {
        slug = `${generateSlug(name)}-${counter}`;
        slugExists = await prisma.tag.findFirst({ 
          where: { 
            slug,
            id: { not: id }
          } 
        });
        counter++;
      }
    }

    const updatedTag = await prisma.tag.update({
      where: { id },
      data: {
        name,
        slug,
      },
    });

    res.json(updatedTag);
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tags/:id - Delete tag (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await prisma.tag.findUnique({ 
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    if (tag._count.posts > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete tag with associated posts' 
      });
    }

    await prisma.tag.delete({ where: { id } });

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;