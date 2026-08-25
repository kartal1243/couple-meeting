const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.status(200).send('🚀 Couple Meeting Backend Server Active!');
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Aktif odaları ve bilgilerini tutan hafıza
const rooms = {};

function getPublicRoomsList() {
  const list = [];
  for (const [id, room] of Object.entries(rooms)) {
    list.push({
      id,
      name: room.name || id,
      userCount: room.users.length,
      maxUsers: room.maxUsers,
      hasPassword: !!room.password
    });
  }
  return list;
}

function broadcastRooms() {
  io.emit('public_rooms_update', getPublicRoomsList());
}

io.on('connection', (socket) => {
  // Kullanıcı bağlandığında mevcut canlı odaları gönder
  socket.emit('public_rooms_update', getPublicRoomsList());

  socket.on('join_room', ({ roomId, password, maxUsers }) => {
    // Önceki odadan ayrılma kontrolü
    if (socket.currentRoom && rooms[socket.currentRoom]) {
      rooms[socket.currentRoom].users = rooms[socket.currentRoom].users.filter(id => id !== socket.id);
      if (rooms[socket.currentRoom].users.length === 0) {
        delete rooms[socket.currentRoom];
      }
    }

    // Oda yoksa yeni oda oluştur
    if (!rooms[roomId]) {
      rooms[roomId] = {
        name: roomId,
        password: password || '',
        maxUsers: parseInt(maxUsers) || 10,
        users: []
      };
    } else {
      // Şifre kontrolü
      if (rooms[roomId].password && rooms[roomId].password !== (password || '')) {
        socket.emit('room_error', '🔒 Hatalı Oda Şifresi!');
        return;
      }
      // Kontenjan / Doluluk kontrolü
      if (rooms[roomId].users.length >= rooms[roomId].maxUsers) {
        socket.emit('room_error', `⚠️ Oda Kontenjanı Dolu! (${rooms[roomId].users.length}/${rooms[roomId].maxUsers})`);
        return;
      }
    }

    rooms[roomId].users.push(socket.id);
    socket.currentRoom = roomId;
    socket.join(roomId);

    socket.emit('room_joined', {
      roomId,
      userCount: rooms[roomId].users.length,
      maxUsers: rooms[roomId].maxUsers
    });

    broadcastRooms();
  });

  socket.on('room_action', ({ roomId, type, payload }) => {
    socket.to(roomId).emit('room_action', { type, payload });
  });

  socket.on('disconnect', () => {
    if (socket.currentRoom && rooms[socket.currentRoom]) {
      rooms[socket.currentRoom].users = rooms[socket.currentRoom].users.filter(id => id !== socket.id);
      if (rooms[socket.currentRoom].users.length === 0) {
        delete rooms[socket.currentRoom];
      }
      broadcastRooms();
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sunucu ${PORT} portunda aktif!`);
});