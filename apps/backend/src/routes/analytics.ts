import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/analytics/dashboard - Get dashboard analytics (admin only)
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      totalViews,
      totalCategories,
      totalTags,
      recentViews,
      popularPosts,
    ] = await Promise.all([
      // Total posts count
      prisma.post.count(),
      
      // Published posts count
      prisma.post.count({ where: { isPublished: true } }),
      
      // Draft posts count
      prisma.post.count({ where: { isPublished: false } }),
      
      // Total views across all posts
      prisma.post.aggregate({
        _sum: { viewCount: true },
      }),
      
      // Total categories
      prisma.category.count(),
      
      // Total tags
      prisma.tag.count(),
      
      // Recent views (last 30 days)
      prisma.postAnalytics.count({
        where: {
          viewedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Most popular posts by view count
      prisma.post.findMany({
        where: { isPublished: true },
        orderBy: { viewCount: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          slug: true,
          viewCount: true,
          publishedAt: true,
        },
      }),
    ]);

    res.json({
      overview: {
        totalPosts,
        publishedPosts,
        draftPosts,
        totalViews: totalViews._sum.viewCount || 0,
        totalCategories,
        totalTags,
        recentViews,
      },
      popularPosts,
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/posts/:id - Get analytics for specific post (admin only)
router.get('/posts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { days = '30' } = req.query;

    const daysNum = parseInt(days as string);
    const startDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    const [post, analytics, dailyViews] = await Promise.all([
      // Get post details
      prisma.post.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          slug: true,
          viewCount: true,
          publishedAt: true,
          isPublished: true,
        },
      }),
      
      // Get analytics data
      prisma.postAnalytics.findMany({
        where: {
          postId: id,
          viewedAt: { gte: startDate },
        },
        orderBy: { viewedAt: 'desc' },
        take: 1000, // Limit for performance
      }),
      
      // Get daily view counts
      prisma.$queryRaw`
        SELECT 
          DATE(viewed_at) as date,
          COUNT(*) as views
        FROM post_analytics 
        WHERE post_id = ${id}
          AND viewed_at >= ${startDate}
        GROUP BY DATE(viewed_at)
        ORDER BY date DESC
      `,
    ]);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Process referrer data
    const referrers = analytics.reduce((acc: any, view: any) => {
      const referrer = view.referrer || 'Direct';
      acc[referrer] = (acc[referrer] || 0) + 1;
      return acc;
    }, {});

    // Process user agent data (browsers)
    const browsers = analytics.reduce((acc: any, view: any) => {
      if (view.userAgent) {
        let browser = 'Unknown';
        if (view.userAgent.includes('Chrome')) browser = 'Chrome';
        else if (view.userAgent.includes('Firefox')) browser = 'Firefox';
        else if (view.userAgent.includes('Safari')) browser = 'Safari';
        else if (view.userAgent.includes('Edge')) browser = 'Edge';
        
        acc[browser] = (acc[browser] || 0) + 1;
      }
      return acc;
    }, {});

    res.json({
      post,
      analytics: {
        totalViews: analytics.length,
        dailyViews,
        referrers: Object.entries(referrers).map(([source, count]) => ({
          source,
          count,
        })),
        browsers: Object.entries(browsers).map(([browser, count]) => ({
          browser,
          count,
        })),
      },
    });
  } catch (error) {
    console.error('Post analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/trends - Get trending analytics (admin only)
router.get('/trends', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = '7' } = req.query;
    const days = parseInt(period as string);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [dailyViews, topCategories, topTags, recentPosts] = await Promise.all([
      // Daily views trend
      prisma.$queryRaw`
        SELECT 
          DATE(viewed_at) as date,
          COUNT(*) as views
        FROM post_analytics 
        WHERE viewed_at >= ${startDate}
        GROUP BY DATE(viewed_at)
        ORDER BY date ASC
      `,
      
      // Top categories by post count
      prisma.category.findMany({
        include: {
          _count: {
            select: {
              posts: {
                where: {
                  post: { isPublished: true },
                },
              },
            },
          },
        },
        orderBy: {
          posts: {
            _count: 'desc',
          },
        },
        take: 5,
      }),
      
      // Top tags by post count
      prisma.tag.findMany({
        include: {
          _count: {
            select: {
              posts: {
                where: {
                  post: { isPublished: true },
                },
              },
            },
          },
        },
        orderBy: {
          posts: {
            _count: 'desc',
          },
        },
        take: 10,
      }),
      
      // Recent posts performance
      prisma.post.findMany({
        where: {
          isPublished: true,
          publishedAt: { gte: startDate },
        },
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          viewCount: true,
          publishedAt: true,
        },
      }),
    ]);

    res.json({
      dailyViews,
      topCategories: topCategories.map(cat => ({
        ...cat,
        postCount: cat._count.posts,
        _count: undefined,
      })),
      topTags: topTags.map(tag => ({
        ...tag,
        postCount: tag._count.posts,
        _count: undefined,
      })),
      recentPosts,
    });
  } catch (error) {
    console.error('Trends analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/analytics/track - Track page view (public)
router.post('/track', async (req, res) => {
  try {
    const { postId, referrer } = req.body;

    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    // Verify post exists and is published
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, isPublished: true },
    });

    if (!post || !post.isPublished) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Track the view
    await prisma.postAnalytics.create({
      data: {
        postId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        referrer: referrer || req.get('Referer'),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Track analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;