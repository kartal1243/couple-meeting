// backend/src/middlewares/upload.middleware.js - Dosya yükleme ara katmanları
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Dosya adını güvenli hale getir (path traversal / özel karakter engeli)
function safeFilename(prefix, originalname, fallbackExt) {
  const rawExt = path.extname(originalname || '').toLowerCase();
  const ext = /^\.[a-z0-9]{1,5}$/.test(rawExt) ? rawExt : fallbackExt;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, safeFilename('avatar', file.originalname, '.jpg'))
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
  filename: (req, file, cb) => cb(null, safeFilename('video', file.originalname, '.mp4'))
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

// GÜVENLİK: Oda dosyaları için tür filtresi (tehlikeli dosya - örn. .exe/.html/.js - yüklemeyi engeller)
const ROOM_FILE_ALLOWED = /\.(jpg|jpeg|png|gif|webp|bmp|mp4|webm|ogg|mov|mp3|wav|m4a|pdf|txt|zip)$/i;
const uploadRoomFile = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const mime = file.mimetype || '';
    const mimeOk = mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/') ||
      mime === 'application/pdf' || mime === 'text/plain' || mime === 'application/zip' ||
      mime === 'application/x-zip-compressed' || mime === 'application/octet-stream';
    if (ROOM_FILE_ALLOWED.test(ext) && mimeOk) {
      cb(null, true);
    } else {
      cb(new Error('Bu dosya türüne izin verilmiyor.'));
    }
  }
});

module.exports = {
  uploadsDir,
  uploadAvatar,
  uploadVideo,
  uploadRoomFile,
  uploadLimiter
};
