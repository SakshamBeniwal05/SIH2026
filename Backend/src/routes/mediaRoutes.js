import express from 'express';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads folder exists
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `field_report_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
  }
});
const upload = multer({ storage });

export function createMediaRouter() {
  const router = express.Router();

  // GET /api/media/sign-upload (Pre-signed HMAC for ImageKit / Cloud Storage)
  router.get('/sign-upload', (req, res) => {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || 'dummy_private_key_sih2026';
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || 'public_sih_demo_key';
    const expire = Math.floor(Date.now() / 1000) + 1800; // 30 mins
    const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

    const signature = crypto
      .createHmac('sha1', privateKey)
      .update(token + expire)
      .digest('hex');

    res.json({
      token,
      expire,
      signature,
      publicKey,
      uploadEndpoint: 'https://upload.imagekit.io/api/v1/files/upload'
    });
  });

  // POST /api/media/upload (Local direct binary upload fallback)
  router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const mediaUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.status(201).json({
      success: true,
      mediaUrl,
      fileId: req.file.filename,
      size: req.file.size
    });
  });

  return router;
}
