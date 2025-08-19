import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { db } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow images and common asset types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/json', // For custom fonts or configs
    'font/ttf',
    'font/otf',
    'font/woff',
    'font/woff2'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and fonts are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  }
});

// Upload asset
router.post('/upload/:projectId', upload.single('asset'), async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { projectId } = req.params;

    // Verify project ownership
    const project = await db('projects')
      .where({ id: projectId, user_id: req.userId })
      .first();

    if (!project) {
      // Clean up uploaded file if project doesn't exist
      await fs.unlink(req.file.path);
      return res.status(404).json({ error: 'Project not found' });
    }

    // Save asset record to database
    const [asset] = await db('assets').insert({
      project_id: projectId,
      filename: req.file.filename,
      original_filename: req.file.originalname,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      storage_path: req.file.path,
      public_url: `/uploads/${req.file.filename}`,
    }).returning('*');

    res.status(201).json({
      message: 'Asset uploaded successfully',
      asset: {
        id: asset.id,
        filename: asset.filename,
        originalFilename: asset.original_filename,
        mimeType: asset.mime_type,
        fileSize: asset.file_size,
        publicUrl: asset.public_url,
        createdAt: asset.created_at,
      }
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up uploaded file:', unlinkError);
      }
    }
    next(error);
  }
});

// Get assets for project
router.get('/project/:projectId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project ownership
    const project = await db('projects')
      .where({ id: projectId, user_id: req.userId })
      .first();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const assets = await db('assets')
      .where({ project_id: projectId })
      .orderBy('created_at', 'desc')
      .select('id', 'filename', 'original_filename', 'mime_type', 'file_size', 'public_url', 'created_at');

    res.json({
      assets: assets.map(asset => ({
        id: asset.id,
        filename: asset.filename,
        originalFilename: asset.original_filename,
        mimeType: asset.mime_type,
        fileSize: asset.file_size,
        publicUrl: asset.public_url,
        createdAt: asset.created_at,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Delete asset
router.delete('/:assetId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { assetId } = req.params;

    // Get asset with project ownership check
    const asset = await db('assets')
      .join('projects', 'assets.project_id', 'projects.id')
      .where({ 'assets.id': assetId, 'projects.user_id': req.userId })
      .select('assets.*')
      .first();

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(asset.storage_path);
    } catch (unlinkError) {
      console.error('Failed to delete file from filesystem:', unlinkError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await db('assets').where({ id: assetId }).del();

    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get specific asset info
router.get('/:assetId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { assetId } = req.params;

    const asset = await db('assets')
      .join('projects', 'assets.project_id', 'projects.id')
      .where({ 'assets.id': assetId, 'projects.user_id': req.userId })
      .select('assets.*')
      .first();

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({
      asset: {
        id: asset.id,
        filename: asset.filename,
        originalFilename: asset.original_filename,
        mimeType: asset.mime_type,
        fileSize: asset.file_size,
        publicUrl: asset.public_url,
        createdAt: asset.created_at,
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;