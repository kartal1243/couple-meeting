import { useState, useEffect, useCallback } from 'react';

function generateCard() {
  const nums = [];
  const cols = [[1,10],[11,20],[21,30],[31,40],[41,50]];
  for (let c = 0; c < 5; c++) {
    const colNums = [];
    while (colNums.length < 5) {
      const n = Math.floor(Math.random() * (cols[c][1] - cols[c][0] + 1)) + cols[c][0];
      if (!colNums.includes(n)) colNums.push(n);
    }
    colNums.sort((a, b) => a - b);
    nums.push(...colNums);
  }
  return nums;
}

function checkLine(card, called) {
  const rows = [[0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24]];
  for (const row of rows) {
    if (row.every(i => called.includes(card[i]))) return true;
  }
  return false;
}

function checkFull(card, called) {
  return card.every(n => called.includes(n));
}

export default function Tombala({ socket, roomId, mySocketId, userId, hostUserId, roomUsersList }) {
  const isHost = hostUserId === userId;
  const [gameActive, setGameActive] = useState(false);
  const [myCard, setMyCard] = useState([]);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState(null);
  const [winnerType, setWinnerType] = useState('');
  const [lineDone, setLineDone] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const onGameState = (data) => {
      setGameActive(data.active);
      if (data.active) {
        setCalledNumbers(data.calledNumbers || []);
        setCurrentNumber(data.currentNumber);
        setPlayers(data.players || []);
        setWinner(null);
        setWinnerType('');
        setLineDone(false);
      }
    };
    const onYourCard = (data) => { if (data.card) setMyCard(data.card); };
    const onTombalaNumber = (data) => { setCurrentNumber(data.number); setCalledNumbers(data.calledNumbers || []); };
    const onTombalaWinner = (data) => { setWinner(data.username); setWinnerType(data.type); };
    const onTombalaLine = (data) => { if (data.socketId === mySocketId) setLineDone(true); };
    const onTombalaEnd = () => { setGameActive(false); setWinner(null); setCalledNumbers([]); setCurrentNumber(null); setPlayers([]); };

    socket.on('tombala_game_state', onGameState);
    socket.on('tombala_your_card', onYourCard);
    socket.on('tombala_number', onTombalaNumber);
    socket.on('tombala_winner', onTombalaWinner);
    socket.on('tombala_line', onTombalaLine);
    socket.on('tombala_end', onTombalaEnd);

    return () => {
      socket.off('tombala_game_state', onGameState);
      socket.off('tombala_your_card', onYourCard);
      socket.off('tombala_number', onTombalaNumber);
      socket.off('tombala_winner', onTombalaWinner);
      socket.off('tombala_line', onTombalaLine);
      socket.off('tombala_end', onTombalaEnd);
    };
  }, [socket, mySocketId]);

  const startGame = () => { if (socket) socket.emit('tombala_start', { roomId }); };
  const callNumber = () => { if (socket) socket.emit('tombala_call', { roomId }); };
  const claimLine = () => { if (socket) socket.emit('tombala_claim', { roomId, type: 'line' }); };
  const claimFull = () => { if (socket) socket.emit('tombala_claim', { roomId, type: 'full' }); };
  const endGame = () => { if (socket) socket.emit('tombala_end', { roomId }); };

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(15,23,42,.95), rgba(30,41,59,.95))',
      borderTop: '1px solid rgba(255,255,255,.06)', padding: '12px 16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🎰</span>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>TOMBALA</span>
        </div>
        {isHost && !gameActive && (
          <button onClick={startGame} style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff',
            border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 800,
            fontSize: 11, cursor: 'pointer'
          }}>🎲 Oyunu Başlat</button>
        )}
        {isHost && gameActive && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={callNumber} style={{
              background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff',
              border: 'none', padding: '6px 12px', borderRadius: 8, fontWeight: 800,
              fontSize: 11, cursor: 'pointer'
            }}>📞 Sayı Çek</button>
            <button onClick={endGame} style={{
              background: 'rgba(239,68,68,.15)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,.3)', padding: '6px 10px', borderRadius: 8,
              fontWeight: 800, fontSize: 11, cursor: 'pointer'
            }}>⏹ Bitir</button>
          </div>
        )}
      </div>

      {!gameActive && (
        <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12, padding: 20 }}>
          {isHost ? 'Oyunu başlatmak için "🎲 Oyunu Başlat" butonuna bas' : 'Yöneticinin oyunu başlatmasını bekle...'}
        </div>
      )}

      {gameActive && currentNumber && (
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, marginBottom: 4 }}>ÇEKİLEN SAYI</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 50, height: 50, borderRadius: 14,
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            color: '#fff', fontSize: 22, fontWeight: 950,
            boxShadow: '0 6px 20px rgba(245,158,11,.4)'
          }}>{currentNumber}</div>
        </div>
      )}

      {gameActive && winner && (
        <div style={{
          textAlign: 'center', padding: 12, borderRadius: 12, marginBottom: 10,
          background: 'linear-gradient(135deg, rgba(245,158,11,.12), rgba(234,179,8,.08))',
          border: '1px solid rgba(245,158,11,.2)'
        }}>
          <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 800 }}>🏆 KAZANAN</div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>{winner}</div>
          <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>{winnerType === 'line' ? 'SERİ SİRKEDİ!' : 'TOMBALA YAPTI!'}</div>
        </div>
      )}

      {gameActive && myCard.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, marginBottom: 10 }}>
            {['B', 'I', 'N', 'G', 'O'].map((letter, i) => (
              <div key={letter} style={{
                textAlign: 'center', fontSize: 10, fontWeight: 900, color: '#f59e0b',
                padding: 4, background: 'rgba(245,158,11,.08)', borderRadius: 6
              }}>{letter}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, marginBottom: 10 }}>
            {myCard.map((num, i) => {
              const isCalled = calledNumbers.includes(num);
              const isCenter = i === 12;
              return (
                <div key={i} style={{
                  textAlign: 'center', padding: '8px 2px', borderRadius: 8,
                  background: isCalled
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : isCenter ? 'rgba(245,158,11,.12)' : 'rgba(255,255,255,.04)',
                  color: isCalled ? '#fff' : '#e2e8f0',
                  fontSize: 13, fontWeight: 900,
                  border: isCalled ? '1px solid rgba(34,197,94,.3)' : '1px solid rgba(255,255,255,.06)',
                  transition: 'all 0.3s ease',
                  boxShadow: isCalled ? '0 2px 8px rgba(34,197,94,.3)' : 'none'
                }}>{isCenter ? '⭐' : num}</div>
              );
            })}
          </div>

          {!winner && (
            <div style={{ display: 'flex', gap: 6 }}>
              {!lineDone && (
                <button onClick={claimLine} style={{
                  flex: 1, padding: '8px 0', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer'
                }}>📏 Seri</button>
              )}
              <button onClick={claimFull} style={{
                flex: 1, padding: '8px 0', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer'
              }}>🎯 Tombala</button>
            </div>
          )}

          {lineDone && !winner && (
            <div style={{ textAlign: 'center', color: '#22c55e', fontSize: 11, fontWeight: 800, marginTop: 4 }}>✓ Seri yaptın!</div>
          )}
        </>
      )}

      {gameActive && (
        <div style={{ marginTop: 8, fontSize: 10, color: '#475569', textAlign: 'center' }}>
          Çekilen: {calledNumbers.length} sayı | {players.length} oyuncu
        </div>
      )}
    </div>
  );
}
