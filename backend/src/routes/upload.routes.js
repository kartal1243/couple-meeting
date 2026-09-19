// backend/src/routes/upload.routes.js - Dosya yükleme rotaları
const express = require('express');
const router = express.Router();
const db = require('../../utils/database');
const { uploadAvatar, uploadVideo, uploadRoomFile, uploadLimiter } = require('../middlewares/upload.middleware');

router.post('/api/upload-avatar', uploadLimiter, (req, res) => {
  uploadAvatar.single('avatar')(req, res, (err) => {
    if (err) return res.status(400).json({ ok: false, message: err.message });
    if (!req.file) return res.status(400).json({ ok: false, message: 'Dosya bulunamadı.' });
    const token = req.body.token;
    if (!token) return res.status(401).json({ ok: false, message: 'Token gerekli.' });
    const user = db.getUserByToken(token);
    if (!user) return res.status(401).json({ ok: false, message: 'Geçersiz token.' });
    const avatarUrl = `/uploads/${req.file.filename}`;
    db.updateUser(user.username, { avatar: avatarUrl });
    res.json({ ok: true, avatar: avatarUrl });
  });
});

router.post('/api/upload-video', uploadLimiter, (req, res) => {
  uploadVideo.single('video')(req, res, (err) => {
    if (err) return res.status(400).json({ ok: false, message: err.message });
    if (!req.file) return res.status(400).json({ ok: false, message: 'Dosya bulunamadı.' });
    const token = req.body.token;
    const user = token ? db.getUserByToken(token) : null;
    const uploader = user ? user.username : 'Misafir';
    const videoUrl = `/uploads/${req.file.filename}`;
    res.json({ ok: true, url: videoUrl, filename: req.file.originalname, size: req.file.size, uploader });
  });
});

router.post('/api/upload-room-file', uploadLimiter, (req, res) => {
  uploadRoomFile.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ ok: false, message: err.message });
    if (!req.file) return res.status(400).json({ ok: false, message: 'Dosya bulunamadi.' });
    const token = req.body.token;
    if (!token) return res.status(401).json({ ok: false, message: 'Token gerekli.' });
    const user = db.getUserByToken(token);
    if (!user) return res.status(401).json({ ok: false, message: 'Gecersiz token.' });
    const fileUrl = `/uploads/${req.file.filename}`;
    const isImage = req.file.mimetype.startsWith('image/');
    const isVideo = req.file.mimetype.startsWith('video/');
    res.json({
      ok: true,
      url: fileUrl,
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      isImage,
      isVideo
    });
  });
});

module.exports = router;
