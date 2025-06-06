import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to validate email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// POST /api/newsletter/subscribe - Subscribe to newsletter (public)
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email already exists
    const existingSubscriber = await prisma.newsletter.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return res.status(200).json({ 
          message: 'You are already subscribed to our newsletter' 
        });
      } else {
        // Reactivate subscription
        await prisma.newsletter.update({
          where: { email: email.toLowerCase() },
          data: { 
            isActive: true,
            unsubscribedAt: null,
          },
        });
        return res.status(200).json({ 
          message: 'Welcome back! Your subscription has been reactivated.' 
        });
      }
    }

    // Create new subscription
    await prisma.newsletter.create({
      data: {
        email: email.toLowerCase(),
      },
    });

    res.status(201).json({ 
      message: 'Successfully subscribed to our newsletter!' 
    });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/newsletter/unsubscribe - Unsubscribe from newsletter (public)
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const subscriber = await prisma.newsletter.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!subscriber) {
      return res.status(404).json({ error: 'Email not found in our newsletter list' });
    }

    if (!subscriber.isActive) {
      return res.status(200).json({ 
        message: 'You are already unsubscribed from our newsletter' 
      });
    }

    // Deactivate subscription
    await prisma.newsletter.update({
      where: { email: email.toLowerCase() },
      data: { 
        isActive: false,
        unsubscribedAt: new Date(),
      },
    });

    res.json({ 
      message: 'Successfully unsubscribed from our newsletter' 
    });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/newsletter/subscribers - Get all subscribers (admin only)
router.get('/subscribers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = '1', limit = '50', status = 'all' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause: any = {};
    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    const [subscribers, totalCount] = await Promise.all([
      prisma.newsletter.findMany({
        where: whereClause,
        orderBy: { subscribedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.newsletter.count({ where: whereClause }),
    ]);

    res.json({
      subscribers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/newsletter/stats - Get newsletter statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalSubscribers,
      activeSubscribers,
      inactiveSubscribers,
      recentSubscriptions,
      monthlyGrowth,
    ] = await Promise.all([
      // Total subscribers
      prisma.newsletter.count(),
      
      // Active subscribers
      prisma.newsletter.count({ where: { isActive: true } }),
      
      // Inactive subscribers
      prisma.newsletter.count({ where: { isActive: false } }),
      
      // Recent subscriptions (last 7 days)
      prisma.newsletter.count({
        where: {
          subscribedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Monthly growth (subscriptions per month for last 12 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', subscribed_at) as month,
          COUNT(*) as subscriptions
        FROM newsletter_subscribers 
        WHERE subscribed_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', subscribed_at)
        ORDER BY month DESC
      `,
    ]);

    res.json({
      overview: {
        totalSubscribers,
        activeSubscribers,
        inactiveSubscribers,
        recentSubscriptions,
        growthRate: totalSubscribers > 0 ? ((recentSubscriptions / totalSubscribers) * 100).toFixed(2) : '0',
      },
      monthlyGrowth,
    });
  } catch (error) {
    console.error('Newsletter stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/newsletter/subscribers/:id - Delete subscriber (admin only)
router.delete('/subscribers/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const subscriber = await prisma.newsletter.findUnique({ where: { id } });
    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    await prisma.newsletter.delete({ where: { id } });

    res.json({ message: 'Subscriber deleted successfully' });
  } catch (error) {
    console.error('Delete subscriber error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/newsletter/bulk-action - Bulk actions on subscribers (admin only)
router.post('/bulk-action', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { action, subscriberIds } = req.body;

    if (!action || !subscriberIds || !Array.isArray(subscriberIds)) {
      return res.status(400).json({ 
        error: 'Action and subscriberIds array are required' 
      });
    }

    let result;
    
    switch (action) {
      case 'activate':
        result = await prisma.newsletter.updateMany({
          where: { id: { in: subscriberIds } },
          data: { 
            isActive: true,
            unsubscribedAt: null,
          },
        });
        break;
        
      case 'deactivate':
        result = await prisma.newsletter.updateMany({
          where: { id: { in: subscriberIds } },
          data: { 
            isActive: false,
            unsubscribedAt: new Date(),
          },
        });
        break;
        
      case 'delete':
        result = await prisma.newsletter.deleteMany({
          where: { id: { in: subscriberIds } },
        });
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ 
      message: `Bulk ${action} completed successfully`,
      affected: result.count,
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;