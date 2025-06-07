import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
};

// GET /api/posts - Get all published posts (public)
router.get('/', async (req, res) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      category, 
      tag, 
      search,
      featured 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause: any = {
      isPublished: true,
    };

    if (category) {
      whereClause.categories = {
        some: {
          category: {
            slug: category as string,
          },
        },
      };
    }

    if (tag) {
      whereClause.tags = {
        some: {
          tag: {
            slug: tag as string,
          },
        },
      };
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { excerpt: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limitNum,
    });

    const totalPosts = await prisma.post.count({ where: whereClause });

    res.json({
      posts: posts.map(post => ({
        ...post,
        categories: post.categories.map(pc => pc.category),
        tags: post.tags.map(pt => pt.tag),
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalPosts,
        totalPages: Math.ceil(totalPosts / limitNum),
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/posts/:slug - Get post by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await prisma.post.findUnique({
      where: { slug },
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Only show published posts to non-admin users
    if (!post.isPublished) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Increment view count
    await prisma.post.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });

    // Track analytics
    await prisma.postAnalytics.create({
      data: {
        postId: post.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referer'),
      },
    });

    res.json({
      ...post,
      categories: post.categories.map(pc => pc.category),
      tags: post.tags.map(pt => pt.tag),
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/posts/admin/all - Get all posts including drafts (admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = '1', limit = '10', status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {};
    
    if (status === 'published') {
      whereClause.isPublished = true;
    } else if (status === 'draft') {
      whereClause.isPublished = false;
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    const totalPosts = await prisma.post.count({ where: whereClause });

    res.json({
      posts: posts.map(post => ({
        ...post,
        categories: post.categories.map(pc => pc.category),
        tags: post.tags.map(pt => pt.tag),
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalPosts,
        totalPages: Math.ceil(totalPosts / limitNum),
      },
    });
  } catch (error) {
    console.error('Get admin posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/posts - Create new post (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      metaDescription,
      isPublished = false,
      categoryIds = [],
      tagIds = [],
      featuredImage,
      readingTime,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Generate slug
    let slug = generateSlug(title);
    
    // Ensure unique slug
    let slugExists = await prisma.post.findUnique({ where: { slug } });
    let counter = 1;
    while (slugExists) {
      slug = `${generateSlug(title)}-${counter}`;
      slugExists = await prisma.post.findUnique({ where: { slug } });
      counter++;
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        metaDescription,
        featuredImage,
        readingTime,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
        authorId: req.user.id,
        categories: categoryIds.length > 0 ? {
          create: categoryIds.map((categoryId: string) => ({
            categoryId,
          })),
        } : undefined,
        tags: tagIds.length > 0 ? {
          create: tagIds.map((tagId: string) => ({
            tagId,
          })),
        } : undefined,
      },
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    res.status(201).json({
      ...post,
      categories: post.categories.map(pc => pc.category),
      tags: post.tags.map(pt => pt.tag),
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/posts/:id - Update post (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      excerpt,
      metaDescription,
      isPublished,
      categoryIds = [],
      tagIds = [],
      featuredImage,
      readingTime,
    } = req.body;

    // Check if post exists
    const existingPost = await prisma.post.findUnique({ where: { id } });
    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Generate new slug if title changed
    let slug = existingPost.slug;
    if (title && title !== existingPost.title) {
      slug = generateSlug(title);
      
      // Ensure unique slug
      let slugExists = await prisma.post.findFirst({ 
        where: { 
          slug,
          id: { not: id }
        } 
      });
      let counter = 1;
      while (slugExists) {
        slug = `${generateSlug(title)}-${counter}`;
        slugExists = await prisma.post.findFirst({ 
          where: { 
            slug,
            id: { not: id }
          } 
        });
        counter++;
      }
    }

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title: title || existingPost.title,
        slug,
        content: content || existingPost.content,
        excerpt,
        metaDescription,
        featuredImage,
        readingTime,
        isPublished: isPublished !== undefined ? isPublished : existingPost.isPublished,
        publishedAt: isPublished && !existingPost.isPublished ? new Date() : existingPost.publishedAt,
        categories: {
          deleteMany: {},
          create: categoryIds.map((categoryId: string) => ({
            categoryId,
          })),
        },
        tags: {
          deleteMany: {},
          create: tagIds.map((tagId: string) => ({
            tagId,
          })),
        },
      },
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    res.json({
      ...updatedPost,
      categories: updatedPost.categories.map(pc => pc.category),
      tags: updatedPost.tags.map(pt => pt.tag),
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/posts/:id - Delete post (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await prisma.post.delete({ where: { id } });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;