import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import YouTube from 'react-youtube';

const BACKEND_URL = 'http://localhost:3001';
let socket;

try {
  socket = io(BACKEND_URL, { transports: ['polling', 'websocket'], autoConnect: true });
} catch (err) {
  console.error("Socket hatası:", err);
}

const AVATARS = ['🐱', '🐶', '🦊', '🐼', '👑', '👸', '🦁', '🐻'];

function App() {
  const [inRoom, setInRoom] = useState(false);
  const [tab, setTab] = useState('create');
  const [sidebarTab, setSidebarTab] = useState('chat');

  const [myAvatar, setMyAvatar] = useState('🐱');
  const [username, setUsername] = useState('Ben');
  const [mySocketId, setMySocketId] = useState('');

  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [maxUsers, setMaxUsers] = useState('2');
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const [joinPassInput, setJoinPassInput] = useState('');

  const [publicRooms, setPublicRooms] = useState([]);
  const [currentRoomInfo, setCurrentRoomInfo] = useState({ userCount: 1, maxUsers: 2 });

  const [mediaType, setMediaType] = useState('none'); 
  const [mediaSrc, setMediaSrc] = useState('');
  const [playlist, setPlaylist] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');

  // ANLIK ARAMA STATE'LERİ
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const ytPlayerRef = useRef(null);

  // YAZILDIĞI ANDA OTOMATİK ARAMA (DEBOUNCE 300ms)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      if (socket) {
        socket.emit('search_music', { query: searchQuery.trim() });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('public_rooms_update', (roomsList) => {
      setPublicRooms(roomsList);
    });

    socket.on('search_results', (results) => {
      setSearchResults(results);
      setIsSearching(false);
    });

    socket.on('room_joined', (data) => {
      setInRoom(true);
      setRoomId(data.roomId);
      setMySocketId(data.socketId);
      setCurrentRoomInfo({ userCount: data.userCount, maxUsers: data.maxUsers });
      if (data.playlist) setPlaylist(data.playlist);

      if (data.currentMedia && data.currentMedia.type !== 'none') {
        setMediaType(data.currentMedia.type);
        setMediaSrc(data.currentMedia.src);
      }
    });

    socket.on('room_user_count_update', (data) => {
      setCurrentRoomInfo({ userCount: data.userCount, maxUsers: data.maxUsers });
    });

    socket.on('playlist_updated', (updatedPlaylist) => {
      setPlaylist(updatedPlaylist);
    });

    socket.on('room_action', ({ type, payload }) => {
      if (type === 'PLAY') {
        ytPlayerRef.current?.playVideo();
      } else if (type === 'PAUSE') {
        ytPlayerRef.current?.pauseVideo();
      } else if (type === 'CHANGE_MEDIA') {
        setMediaType(payload.type);
        setMediaSrc(payload.src);
      } else if (type === 'CHAT_MESSAGE') {
        setMessages((prev) => [...prev, payload]);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('public_rooms_update');
      socket.off('search_results');
      socket.off('room_joined');
      socket.off('room_user_count_update');
      socket.off('playlist_updated');
      socket.off('room_action');
    };
  }, []);

  const handleCreateRoomSubmit = (e) => {
    e.preventDefault();
    const finalRoomId = roomId.trim().toLowerCase() || 'oda-' + Math.floor(1000 + Math.random() * 9000);
    socket.emit('join_room', { roomId: finalRoomId, password: roomPassword.trim(), maxUsers });
  };

  const handleLeaveRoom = () => {
    socket.emit('leave_room');
    setInRoom(false);
    setMediaType('none');
    setMediaSrc('');
  };

  const sendAction = (type, payload) => {
    if (socket) {
      socket.emit('room_action', { roomId, type, payload: { ...payload, mediaType } });
    }
  };

  const handleSelectSearchResult = (song, playImmediately = true) => {
    const trackItem = {
      id: Date.now() + Math.random().toString(),
      title: song.title,
      type: 'youtube',
      src: song.src,
      category: 'Arama Sonuçları',
      addedBy: username
    };
    socket.emit('add_to_playlist', { roomId, item: trackItem });
    
    if (playImmediately) {
      setMediaType('youtube');
      setMediaSrc(song.src);
      sendAction('CHANGE_MEDIA', { type: 'youtube', src: song.src });
    }

    setSearchResults([]);
    setSearchQuery('');
  };

  if (!inRoom) {
    return (
      <div style={{ backgroundColor: '#0b0e14', color: '#e0e6ed', minHeight: '100vh', width: '100vw', margin: 0, padding: '40px', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", textAlign: 'center' }}>
        <h2>Couple Meeting 🚀</h2>
        <div style={{ maxWidth: '400px', margin: '20px auto', background: '#141a23', padding: '20px', borderRadius: '12px' }}>
          <form onSubmit={handleCreateRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" placeholder="Takma Adın" value={username} onChange={(e) => setUsername(e.target.value)} style={{ padding: '10px', borderRadius: '6px' }} />
            <input type="text" placeholder="Oda İsmi" value={roomId} onChange={(e) => setRoomId(e.target.value)} style={{ padding: '10px', borderRadius: '6px' }} />
            <button type="submit" style={{ padding: '12px', background: '#f5b041', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Odayı Başlat</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#06080c', color: '#e0e6ed', height: '100vh', width: '100vw', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
      <header style={{ height: '50px', padding: '0 20px', background: '#0e121a', borderBottom: '1px solid #1a202c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#f5b041' }}>Couple Meeting ❤️ ({roomId})</h3>
        <button onClick={handleLeaveRoom} style={{ background: '#1a202c', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Ayrıl 🚪</button>
      </header>

      <div style={{ flex: 1, display: 'flex', width: '100vw', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000', position: 'relative' }}>
          
          {/* ANLIK ARAMA BARI VE AÇILIR LİSTE */}
          <div style={{ padding: '10px 16px', background: '#0e121a', borderBottom: '1px solid #1a202c', position: 'relative', zIndex: 999 }}>
            <input 
              type="text" 
              placeholder="⚡ Şarkı veya Sanatçı Adı Yaz (Yazdığın An Aşağıda Çıkar)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #2d3748', background: '#06080c', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />

            {/* AŞAĞIDA ANINDA BELİREN ARAMA SONUÇLARI */}
            {(searchResults.length > 0 || isSearching) && (
              <div style={{ position: 'absolute', top: '56px', left: '16px', right: '16px', background: '#141a23', border: '1px solid #f5b041', borderRadius: '10px', padding: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 9999 }}>
                {isSearching && <div style={{ color: '#f5b041', fontSize: '12px', padding: '6px' }}>⚡ Aranıyor...</div>}
                {searchResults.map((song) => (
                  <div key={song.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#0b0e14', padding: '8px 12px', borderRadius: '8px', border: '1px solid #2d3748' }}>
                    <img src={song.thumbnail} alt={song.title} style={{ width: '60px', height: '35px', borderRadius: '4px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                      <div style={{ fontSize: '11px', color: '#718096' }}>Süre: {song.timestamp}</div>
                    </div>
                    <button onClick={() => handleSelectSearchResult(song, true)} style={{ background: '#2ed573', color: '#06080c', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>▶ Çal</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {mediaType === 'youtube' ? (
              <YouTube videoId={mediaSrc} opts={{ height: '100%', width: '100%', playerVars: { autoplay: 1 } }} style={{ width: '100%', height: '100%' }} onReady={(e) => { ytPlayerRef.current = e.target; }} />
            ) : (
              <div style={{ color: '#718096' }}>🎵 Yukarıdan şarkı yazarak anında çalın!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;