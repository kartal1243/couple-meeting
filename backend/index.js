const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const ytSearch = require('yt-search');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.status(200).send('🚀 Couple Meeting Backend Server Active!');
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const rooms = {};

const DEFAULT_MUSIC_LIBRARY = [
  { id: 'tp-1', title: 'Tarkan - Yolla', type: 'youtube', src: 'aJOTlE1K90k', category: 'Türk Pop', addedBy: 'Sistem' },
  { id: 'tp-2', title: 'EDIS - Martılar', type: 'youtube', src: '7W1r-V8U1N4', category: 'Türk Pop', addedBy: 'Sistem' },
  { id: 'tp-3', title: 'Mabel Matiz - Antidepresan', type: 'youtube', src: 'bZ_Bo0Rp5w8', category: 'Türk Pop', addedBy: 'Sistem' },
  { id: 'p90-1', title: 'Mustafa Sandal - Araba', type: 'youtube', src: '9bZkp7q19f0', category: "90'lar Pop", addedBy: 'Sistem' },
  { id: 'p90-2', title: 'Tarkan - Kıl Oldum', type: 'youtube', src: 'J5aQ5aO4i9A', category: "90'lar Pop", addedBy: 'Sistem' },
  { id: 'lf-1', title: 'Lofi Hip Hop Radio - Beats to Relax/Study', type: 'youtube', src: 'jfKfPfyJRdk', category: 'Lo-Fi & Relax', addedBy: 'Sistem' }
];

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

  // YouTube Şarkı Arama Motoru Dinleyicisi
  socket.on('search_music', async ({ query }) => {
    try {
      const r = await ytSearch(query);
      const results = r.videos.slice(0, 5).map(v => ({
        id: v.videoId,
        title: v.title,
        timestamp: v.timestamp,
        thumbnail: v.thumbnail,
        type: 'youtube',
        src: v.videoId
      }));
      socket.emit('search_results', results);
    } catch (err) {
      console.error("Arama hatası:", err);
      socket.emit('search_results', []);
    }
  });

  socket.on('join_room', ({ roomId, password, maxUsers }) => {
    if (socket.currentRoom && rooms[socket.currentRoom]) {
      const oldRoomId = socket.currentRoom;
      rooms[oldRoomId].users = rooms[oldRoomId].users.filter(id => id !== socket.id);
      updateRoomUsers(oldRoomId);
      if (rooms[oldRoomId].users.length === 0) delete rooms[oldRoomId];
    }

    let room = rooms[roomId];

    if (!room) {
      rooms[roomId] = {
        name: roomId,
        password: password || '',
        maxUsers: parseInt(maxUsers) || 2,
        users: [],
        playlist: [...DEFAULT_MUSIC_LIBRARY],
        currentMedia: { type: 'none', src: '', time: 0, isPlaying: false, lastUpdated: Date.now() }
      };
      room = rooms[roomId];
    } else {
      if (room.password && room.password !== (password || '')) {
        socket.emit('room_error', '🔒 Hatalı Şifre!');
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

    let calculatedTime = room.currentMedia.time;
    if (room.currentMedia.isPlaying) {
      calculatedTime += (Date.now() - room.currentMedia.lastUpdated) / 1000;
    }

    socket.emit('room_joined', {
      roomId,
      userCount: room.users.length,
      maxUsers: room.maxUsers,
      socketId: socket.id,
      playlist: room.playlist,
      currentMedia: {
        ...room.currentMedia,
        time: calculatedTime
      }
    });

    updateRoomUsers(roomId);
    broadcastRooms();
  });

  socket.on('add_to_playlist', ({ roomId, item }) => {
    const room = rooms[roomId];
    if (room) {
      room.playlist.push(item);
      io.to(roomId).emit('playlist_updated', room.playlist);
    }
  });

  socket.on('remove_from_playlist', ({ roomId, itemId }) => {
    const room = rooms[roomId];
    if (room) {
      room.playlist = room.playlist.filter(i => i.id !== itemId);
      io.to(roomId).emit('playlist_updated', room.playlist);
    }
  });

  socket.on('room_action', ({ roomId, type, payload }) => {
    const room = rooms[roomId];
    if (room) {
      if (type === 'CHANGE_MEDIA') {
        room.currentMedia = { type: payload.type, src: payload.src, time: 0, isPlaying: false, lastUpdated: Date.now() };
      } else if (type === 'PLAY') {
        room.currentMedia.isPlaying = true;
        room.currentMedia.time = payload.time || 0;
        room.currentMedia.lastUpdated = Date.now();
      } else if (type === 'PAUSE') {
        room.currentMedia.isPlaying = false;
        room.currentMedia.time = payload.time || 0;
        room.currentMedia.lastUpdated = Date.now();
      }
    }
    socket.to(roomId).emit('room_action', { type, payload });
  });

  socket.on('leave_room', () => {
    if (socket.currentRoom && rooms[socket.currentRoom]) {
      const rId = socket.currentRoom;
      rooms[rId].users = rooms[rId].users.filter(id => id !== socket.id);
      socket.leave(rId);
      updateRoomUsers(rId);
      if (rooms[rId].users.length === 0) delete rooms[rId];
      socket.currentRoom = null;
      broadcastRooms();
    }
  });

  socket.on('disconnect', () => {
    if (socket.currentRoom && rooms[socket.currentRoom]) {
      const rId = socket.currentRoom;
      rooms[rId].users = rooms[rId].users.filter(id => id !== socket.id);
      updateRoomUsers(rId);
      if (rooms[rId].users.length === 0) delete rooms[rId];
      broadcastRooms();
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sunucu ${PORT} portunda aktif!`);
});