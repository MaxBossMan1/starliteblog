import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Allow only images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  },
});

// GET /api/media - Get all media files (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const media = await prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    const totalMedia = await prisma.media.count();

    res.json({
      media,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalMedia,
        totalPages: Math.ceil(totalMedia / limitNum),
      },
    });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/media/upload - Upload single file (admin only)
router.post('/upload', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { alt, caption, postId } = req.body;

    // Create media record in database
    const media = await prisma.media.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
        alt: alt || '',
        caption: caption || '',
        postId: postId || null,
      },
    });

    res.status(201).json(media);
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file if database insert fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/media/upload-multiple - Upload multiple files (admin only)
router.post('/upload-multiple', authenticateToken, requireAdmin, upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { postId } = req.body;

    const mediaRecords = await Promise.all(
      files.map(file => 
        prisma.media.create({
          data: {
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            url: `/uploads/${file.filename}`,
            alt: '',
            caption: '',
            postId: postId || null,
          },
        })
      )
    );

    res.status(201).json({ media: mediaRecords });
  } catch (error) {
    console.error('Multiple upload error:', error);
    
    // Clean up uploaded files if database insert fails
    const files = req.files as Express.Multer.File[];
    if (files) {
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/media/:id - Update media metadata (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { alt, caption, postId } = req.body;

    const existingMedia = await prisma.media.findUnique({ where: { id } });
    if (!existingMedia) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const updatedMedia = await prisma.media.update({
      where: { id },
      data: {
        alt: alt !== undefined ? alt : existingMedia.alt,
        caption: caption !== undefined ? caption : existingMedia.caption,
        postId: postId !== undefined ? postId : existingMedia.postId,
      },
    });

    res.json(updatedMedia);
  } catch (error) {
    console.error('Update media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/media/:id - Delete media file (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Delete file from filesystem
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const filePath = path.join(uploadPath, media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete record from database
    await prisma.media.delete({ where: { id } });

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/media/:id - Get single media file info (admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    res.json(media);
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve uploaded files (public)
router.use('/files', express.static(process.env.UPLOAD_PATH || './uploads'));

export default router;