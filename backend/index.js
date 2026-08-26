const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const ytSearch = require('yt-search');

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
  { id: 'tp-2', title: 'EDIS - Martılar', type: 'youtube', src: '7W1r-V8U1N4', category: 'Türk Pop', addedBy: 'Sistem' },
  { id: 'tp-3', title: 'Mabel Matiz - Antidepresan', type: 'youtube', src: 'bZ_Bo0Rp5w8', category: 'Türk Pop', addedBy: 'Sistem' }
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

  // DENO API + AKILLI SANATÇI VE ŞARKI FİLTRELİ ARAMA MOTORU
  socket.on('search_music', async ({ query }) => {
    try {
      if (!query) return;
      const encoded = encodeURIComponent(query);
      const baseUrl = 'https://verome-api-hq8s6wtb2v78.kartal1243.deno.net';
      
      const candidateRoutes = [
        `${baseUrl}/search?q=${encoded}`,
        `${baseUrl}/api/search?q=${encoded}`,
        `${baseUrl}/search/songs?q=${encoded}`,
        `${baseUrl}/songs?q=${encoded}`
      ];

      let rawList = [];

      // 1. Deno API üzerindeki uç noktaları sırayla tara
      for (const routeUrl of candidateRoutes) {
        try {
          const res = await fetch(routeUrl, { signal: AbortSignal.timeout(2500) });
          if (res.ok) {
            const data = await res.json();
            const extracted = Array.isArray(data) ? data : (data.results || data.songs || data.data || []);
            if (extracted.length > 0) {
              rawList = extracted;
              break;
            }
          }
        } catch (e) {
          // Diğer rotayı dene
        }
      }

      // 2. Sanatçı/Kanal profillerini temizle, sadece 11 haneli geçerli Video ID'si olan şarkıları al
      let validResults = rawList
        .filter(v => v.type !== 'artist' && v.type !== 'album' && v.type !== 'channel')
        .map(v => {
          const videoId = v.videoId || (typeof v.id === 'string' && v.id.length === 11 ? v.id : null);
          return {
            id: videoId,
            title: v.title || v.name || v.songTitle || 'İsimsiz Şarkı',
            timestamp: v.duration || v.timestamp || 'Müzik',
            thumbnail: v.thumbnail || v.cover || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''),
            type: 'youtube',
            src: videoId
          };
        })
        .filter(v => v.src !== null && v.src !== undefined && v.src.length === 11);

      // 3. Eğer Deno API sadece sanatçı döndürdüyse veya video bulunamadıysa yedek arama motorunu devreye sok
      if (validResults.length === 0) {
        const r = await ytSearch(query);
        validResults = (r.videos || []).slice(0, 5).map(v => ({
          id: v.videoId,
          title: v.title,
          timestamp: v.timestamp,
          thumbnail: `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`,
          type: 'youtube',
          src: v.videoId
        }));
      }

      socket.emit('search_results', validResults.slice(0, 5));
    } catch (err) {
      console.error("Arama motoru hatası:", err);
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