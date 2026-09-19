// backend/src/middlewares/upload.middleware.js - Dosya yükleme ara katmanları
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `avatar_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  }
});

const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname)) && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir.'));
    }
  }
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { ok: false, message: 'Çok fazla dosya yükleme.' },
  validate: { xForwardedForHeader: false }
});

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `video_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  }
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(mp4|webm|ogg|mov)$/i;
    if (
      allowed.test(path.extname(file.originalname)) &&
      (file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Sadece video dosyaları yüklenebilir (mp4, webm, ogg, mov).'));
    }
  }
});

const uploadRoomFile = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = {
  uploadsDir,
  uploadAvatar,
  uploadVideo,
  uploadRoomFile,
  uploadLimiter
};
