// backend/src/sockets/game.socket.js - Tombala mini oyunu
const { sanitize } = require('../utils/helpers');
const { rooms, tombalaGames } = require('../services/state');

function generateTombalaCard() {
  const card = [];
  const cols = [[1, 10], [11, 20], [21, 30], [31, 40], [41, 50]];
  for (let c = 0; c < 5; c++) {
    const colNums = [];
    while (colNums.length < 5) {
      const n = Math.floor(Math.random() * (cols[c][1] - cols[c][0] + 1)) + cols[c][0];
      if (!colNums.includes(n)) colNums.push(n);
    }
    colNums.sort((a, b) => a - b);
    card.push(...colNums);
  }
  return card;
}

module.exports = function registerGameSocket(io, socket, { requireAuth }) {
  // Tombala Başlat
  socket.on('tombala_start', ({ roomId, token }) => {
    const user = requireAuth(token);
    if (!user) return;
    const cleanRoomId = sanitize(roomId, 50);
    const room = rooms[cleanRoomId];
    if (!room || room.hostUserId !== user.username) return;

    const game = { active: true, calledNumbers: [], currentNumber: null, players: {}, winner: null };
    room.users.forEach(u => {
      game.players[u.socketId] = {
        userId: u.userId,
        username: u.username,
        card: generateTombalaCard(),
        lineDone: false
      };
    });
    tombalaGames[cleanRoomId] = game;
    io.to(roomId).emit('tombala_game_state', {
      active: true,
      calledNumbers: [],
      currentNumber: null,
      players: Object.values(game.players).map(p => ({ userId: p.userId, username: p.username }))
    });
    Object.entries(game.players).forEach(([sid, p]) => {
      io.to(sid).emit('tombala_your_card', { card: p.card });
    });
  });

  // Tombala Numara Çek
  socket.on('tombala_call', ({ roomId, token }) => {
    const user = requireAuth(token);
    if (!user) return;
    const cleanRoomId = sanitize(roomId, 50);
    const game = tombalaGames[cleanRoomId];
    if (!game || !game.active) return;
    const room = rooms[cleanRoomId];
    if (!room || room.hostUserId !== user.username) return;

    const available = [];
    for (let i = 1; i <= 50; i++) {
      if (!game.calledNumbers.includes(i)) available.push(i);
    }
    if (available.length === 0) return;
    const num = available[Math.floor(Math.random() * available.length)];
    game.calledNumbers.push(num);
    game.currentNumber = num;
    io.to(roomId).emit('tombala_number', { number: num, calledNumbers: game.calledNumbers });
  });

  // Tombala Çinko / Tombala Bildir
  socket.on('tombala_claim', ({ roomId, type, token }) => {
    const user = requireAuth(token);
    if (!user) return;
    const cleanRoomId = sanitize(roomId, 50);
    const game = tombalaGames[cleanRoomId];
    if (!game || !game.active) return;
    const player = game.players[socket.id];
    if (!player || game.winner) return;
    if (type === 'line' && player.lineDone) return;

    const hasLine = (() => {
      const rows = [
        [0, 5, 10, 15, 20],
        [1, 6, 11, 16, 21],
        [2, 7, 12, 17, 22],
        [3, 8, 13, 18, 23],
        [4, 9, 14, 19, 24]
      ];
      return rows.some(row => row.every(i => game.calledNumbers.includes(player.card[i])));
    })();

    const hasFull = player.card.every(n => game.calledNumbers.includes(n));
    if (type === 'line' && hasLine) {
      player.lineDone = true;
      io.to(roomId).emit('tombala_line', { username: player.username, socketId: socket.id });
    }
    if (type === 'full' && hasFull) {
      game.winner = player.username;
      io.to(roomId).emit('tombala_winner', { username: player.username, type: 'full' });
    }
  });

  // Tombala Bitir
  socket.on('tombala_end', ({ roomId, token }) => {
    const user = requireAuth(token);
    if (!user) return;
    const cleanRoomId = sanitize(roomId, 50);
    const room = rooms[cleanRoomId];
    if (!room || room.hostUserId !== user.username) return;
    delete tombalaGames[cleanRoomId];
    io.to(roomId).emit('tombala_end');
  });
};
