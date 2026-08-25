const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.status(200).send('🚀 Couple Meeting Backend Active!');
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

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

function updateRoomUsers(roomId) {
  if (rooms[roomId]) {
    io.to(roomId).emit('room_user_count_update', {
      userCount: rooms[roomId].users.length,
      maxUsers: rooms[roomId].maxUsers
    });
  }
}

io.on('connection', (socket) => {
  socket.emit('public_rooms_update', getPublicRoomsList());

  socket.on('join_room', ({ roomId, password, maxUsers, isCreating }) => {
    if (socket.currentRoom && rooms[socket.currentRoom]) {
      const oldRoomId = socket.currentRoom;
      rooms[oldRoomId].users = rooms[oldRoomId].users.filter(id => id !== socket.id);
      updateRoomUsers(oldRoomId);
      if (rooms[oldRoomId].users.length === 0) {
        delete rooms[oldRoomId];
      }
    }

    let room = rooms[roomId];

    if (!room) {
      rooms[roomId] = {
        name: roomId,
        password: password || '',
        maxUsers: parseInt(maxUsers) || 2,
        users: []
      };
      room = rooms[roomId];
    } else {
      if (room.password && room.password !== (password || '')) {
        socket.emit('room_error', '🔒 Hatalı Şifre! Lütfen oda şifresini girin.');
        return;
      }
      if (room.users.length >= room.maxUsers) {
        socket.emit('room_error', `⚠️ Oda Kontenjanı Dolu! (${room.users.length}/${room.maxUsers})`);
        return;
      }
    }

    room.users.push(socket.id);
    socket.currentRoom = roomId;
    socket.join(roomId);

    socket.emit('room_joined', {
      roomId,
      userCount: room.users.length,
      maxUsers: room.maxUsers,
      hasPassword: !!room.password,
      socketId: socket.id
    });

    updateRoomUsers(roomId);
    broadcastRooms();
  });

  socket.on('room_action', ({ roomId, type, payload }) => {
    socket.to(roomId).emit('room_action', { type, payload });
  });

  socket.on('leave_room', () => {
    if (socket.currentRoom && rooms[socket.currentRoom]) {
      const rId = socket.currentRoom;
      rooms[rId].users = rooms[rId].users.filter(id => id !== socket.id);
      socket.leave(rId);
      updateRoomUsers(rId);
      if (rooms[rId].users.length === 0) {
        delete rooms[rId];
      }
      socket.currentRoom = null;
      broadcastRooms();
    }
  });

  socket.on('disconnect', () => {
    if (socket.currentRoom && rooms[socket.currentRoom]) {
      const rId = socket.currentRoom;
      rooms[rId].users = rooms[rId].users.filter(id => id !== socket.id);
      updateRoomUsers(rId);
      if (rooms[rId].users.length === 0) {
        delete rooms[rId];
      }
      broadcastRooms();
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sunucu ${PORT} portunda aktif!`);
});