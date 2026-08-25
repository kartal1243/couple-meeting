const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.status(200).send('🚀 Couple Meeting Backend Aktif!');
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Odaların şifrelerini tutan bellek hafızası
const roomPasswords = {};

io.on('connection', (socket) => {
  socket.on('join_room', ({ roomId, password }) => {
    // Oda ilk defa kuruluyorsa verilen şifreyi kaydet
    if (!roomPasswords[roomId]) {
      roomPasswords[roomId] = password || '';
    }

    // Şifre kontrolü
    if (roomPasswords[roomId] !== (password || '')) {
      socket.emit('room_error', '🔒 Hatalı Oda Şifresi!');
      return;
    }

    socket.join(roomId);
    socket.emit('room_joined', { roomId });
  });

  socket.on('room_action', ({ roomId, type, payload }) => {
    socket.to(roomId).emit('room_action', { type, payload });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sunucu ${PORT} portunda aktif!`);
});