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

// Türkiye Şehir Koordinatları (Mesafe Hesaplama İçin)
const CITY_COORDS = {
  'Zonguldak': { lat: 41.4564, lon: 31.7987 },
  'Tokat': { lat: 40.3167, lon: 36.5500 },
  'İstanbul': { lat: 41.0082, lon: 28.9784 },
  'Ankara': { lat: 39.9334, lon: 32.8597 },
  'İzmir': { lat: 38.4237, lon: 27.1428 },
  'Antalya': { lat: 36.8969, lon: 30.7133 },
  'Bursa': { lat: 40.1885, lon: 29.0610 },
  'Trabzon': { lat: 41.0027, lon: 39.7168 },
  'Sivas': { lat: 39.7477, lon: 37.0179 },
  'Adana': { lat: 37.0000, lon: 35.3213 },
  'Eskişehir': { lat: 39.7767, lon: 30.5206 },
  'Samsun': { lat: 41.2928, lon: 36.3313 },
  'Kayseri': { lat: 38.7312, lon: 35.4787 },
  'Konya': { lat: 37.8746, lon: 32.4932 },
  'Diyarbakır': { lat: 37.9144, lon: 40.2306 }
};

function calculateDistanceKm(city1, city2) {
  if (!CITY_COORDS[city1] || !CITY_COORDS[city2]) return null;
  const lat1 = CITY_COORDS[city1].lat, lon1 = CITY_COORDS[city1].lon;
  const lat2 = CITY_COORDS[city2].lat, lon2 = CITY_COORDS[city2].lon;
  const R = 6371; // Dünya yarıçapı (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

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

  socket.on('search_music', async ({ query }) => {
    try {
      if (!query || query.trim().length < 2) {
        socket.emit('search_results', []);
        return;
      }
      
      const encoded = encodeURIComponent(query.trim());
      const baseUrl = 'https://verome-api-hq8s6wtb2v78.kartal1243.deno.net';
      let rawList = [];

      try {
        const res = await fetch(`${baseUrl}/api/yt_search?q=${encoded}`, { signal: AbortSignal.timeout(1800) });
        if (res.ok) {
          const data = await res.json();
          rawList = Array.isArray(data) ? data : (data.results || data.songs || data.content || []);
        }
      } catch (e) {}

      if (!rawList || rawList.length === 0) {
        const r = await ytSearch(query);
        rawList = r.videos || [];
      }

      const results = rawList.slice(0, 6).map(v => {
        const videoId = v.videoId || v.id || (typeof v.src === 'string' ? v.src : null);
        return {
          id: videoId,
          title: v.title || v.name || 'YouTube Videosu',
          timestamp: v.duration || v.timestamp || 'Müzik',
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          type: 'youtube',
          src: videoId
        };
      }).filter(v => v.src && v.src.length === 11);

      socket.emit('search_results', results);
    } catch (err) {
      console.error("Arama hatası:", err);
      socket.emit('search_results', []);
    }
  });

  socket.on('join_room', ({ roomId, password, maxUsers, userId, userCity }) => {
    let room = rooms[roomId];

    if (!room) {
      rooms[roomId] = {
        name: roomId,
        password: password || '',
        maxUsers: parseInt(maxUsers) || 2,
        users: [],
        playlist: [], // Boş kalıcı liste
        categories: ['Genel', 'Türk Pop', 'Rap', 'Arabesk'], // Klasörler
        playMode: 'sequence',
        userLocations: {},
        stats: { totalMinutes: 12, lastActiveDate: 'Bugün' },
        currentMedia: { type: 'none', src: '', time: 0, isPlaying: false, lastUpdated: Date.now() }
      };
      room = rooms[roomId];
    } else {
      if (room.password && room.password !== (password || '')) {
        socket.emit('room_error', '🔒 Hatalı Oda Şifresi!');
        return;
      }
      const existingUser = room.users.find(u => u.userId === userId);
      if (!existingUser && room.users.length >= room.maxUsers) {
        socket.emit('room_error', `⚠️ Oda Kontenjanı Dolu! (${room.users.length}/${room.maxUsers})`);
        return;
      }
    }

    if (userCity) {
      room.userLocations[userId] = userCity;
    }

    const existingUserIndex = room.users.findIndex(u => u.userId === userId);
    if (existingUserIndex !== -1) {
      room.users[existingUserIndex].socketId = socket.id;
    } else {
      room.users.push({ socketId: socket.id, userId, city: userCity || 'Zonguldak' });
    }

    socket.currentRoom = roomId;
    socket.userId = userId;
    socket.join(roomId);

    // Mesafe Hesaplama
    const cities = Object.values(room.userLocations);
    let distanceKm = null;
    if (cities.length >= 2) {
      distanceKm = calculateDistanceKm(cities[0], cities[1]);
    }

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
      categories: room.categories,
      playMode: room.playMode,
      distanceKm,
      stats: room.stats,
      currentMedia: {
        ...room.currentMedia,
        time: calculatedTime
      }
    });

    io.to(roomId).emit('location_updated', { distanceKm, cities: room.userLocations });

    updateRoomUsers(roomId);
    broadcastRooms();
  });

  socket.on('create_category', ({ roomId, categoryName }) => {
    const room = rooms[roomId];
    if (room && categoryName && !room.categories.includes(categoryName)) {
      room.categories.push(categoryName);
      io.to(roomId).emit('categories_updated', room.categories);
    }
  });

  socket.on('add_to_playlist', ({ roomId, item }) => {
    const room = rooms[roomId];
    if (room && item) {
      room.playlist.push(item);
      io.to(roomId).emit('playlist_updated', { playlist: room.playlist, playMode: room.playMode });
    }
  });

  socket.on('remove_from_playlist', ({ roomId, itemId }) => {
    const room = rooms[roomId];
    if (room) {
      room.playlist = room.playlist.filter(i => i.id !== itemId);
      io.to(roomId).emit('playlist_updated', { playlist: room.playlist, playMode: room.playMode });
    }
  });

  socket.on('change_play_mode', ({ roomId, mode }) => {
    const room = rooms[roomId];
    if (room) {
      room.playMode = mode;
      io.to(roomId).emit('play_mode_changed', mode);
    }
  });

  socket.on('room_action', ({ roomId, type, payload }) => {
    const room = rooms[roomId];
    if (room) {
      if (type === 'CHANGE_MEDIA') {
        room.currentMedia = { type: payload.type, src: payload.src, time: 0, isPlaying: true, lastUpdated: Date.now() };
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
      rooms[rId].users = rooms[rId].users.filter(u => u.socketId !== socket.id);
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
      const socketIdToRemove = socket.id;
      setTimeout(() => {
        if (rooms[rId]) {
          rooms[rId].users = rooms[rId].users.filter(u => u.socketId !== socketIdToRemove);
          updateRoomUsers(rId);
          if (rooms[rId].users.length === 0) delete rooms[rId];
          broadcastRooms();
        }
      }, 3000);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sunucu ${PORT} portunda aktif!`);
});