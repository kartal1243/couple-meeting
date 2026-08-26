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

const DEFAULT_MUSIC_LIBRARY = [
  { id: 'tp-1', title: 'Tarkan - Yolla', type: 'youtube', src: 'aJOTlE1K90k', category: 'Türk Pop', addedBy: 'Sistem' },
  { id: 'tp-2', title: 'EDIS - Martılar', type: 'youtube', src: '7W1r-V8U1N4', category: 'Türk Pop', addedBy: 'Sistem' }
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

  // DOGRUDAN DENO API ARAMA MOTORU (/api/search VE /api/yt_search)
  socket.on('search_music', async ({ query }) => {
    try {
      if (!query) return;
      const encoded = encodeURIComponent(query);
      const baseUrl = 'https://verome-api-hq8s6wtb2v78.kartal1243.deno.net';
      
      // Önce YouTube Music /api/search, yanıt vermezse /api/yt_search dene
      let res = await fetch(`${baseUrl}/api/search?q=${encoded}`);
      if (!res.ok) {
        res = await fetch(`${baseUrl}/api/yt_search?q=${encoded}`);
      }

      const data = await res.json();
      const rawList = Array.isArray(data) ? data : (data.results || data.songs || data.content || []);

      const results = rawList.slice(0, 5).map(v => {
        const videoId = v.videoId || v.id || (typeof v.src === 'string' ? v.src : null);
        return {
          id: videoId,
          title: v.title || v.name || 'İsimsiz Şarkı',
          timestamp: v.duration || v.timestamp || 'Müzik',
          thumbnail: v.thumbnail || v.cover || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          type: 'youtube',
          src: videoId
        };
      }).filter(v => v.src);

      socket.emit('search_results', results);
    } catch (err) {
      console.error("Deno API Arama hatası:", err);
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
    }

    room.users.push(socket.id);
    socket.currentRoom = roomId;
    socket.join(roomId);

    socket.emit('room_joined', {
      roomId,
      userCount: room.users.length,
      maxUsers: room.maxUsers,
      socketId: socket.id,
      playlist: room.playlist,
      currentMedia: room.currentMedia
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
    socket.to(roomId).emit('room_action', { type, payload });
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