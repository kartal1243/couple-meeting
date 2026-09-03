import React, { useState, useEffect, memo } from 'react';

function Communities({ currentTheme, token, username, avatar, socket }) {
  const [communities, setCommunities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('👥');
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [members, setMembers] = useState([]);

  useEffect(() => {
    socket.emit('community_list', { token });
    socket.on('community_list_result', (data) => setCommunities(data.communities || []));
    socket.on('community_info_result', (data) => {
      setMembers(data.members || []);
      setSelected(data.community);
    });
    socket.on('community_posts_result', (data) => setPosts(data.posts || []));
    socket.on('community_created', () => {
      setShowCreate(false);
      socket.emit('community_list', { token });
    });
    return () => {
      socket.off('community_list_result');
      socket.off('community_info_result');
      socket.off('community_posts_result');
      socket.off('community_created');
    };
  }, [token]);

  const createCommunity = () => {
    if (!newName.trim()) return;
    socket.emit('community_create', { name: newName, description: newDesc, icon: newIcon, token });
  };

  const joinCommunity = (id) => {
    socket.emit('community_join', { communityId: id, token });
  };

  const leaveCommunity = (id) => {
    socket.emit('community_leave', { communityId: id, token });
    setSelected(null);
    socket.emit('community_list', { token });
  };

  const selectCommunity = (id) => {
    socket.emit('community_info', { communityId: id, token });
    socket.emit('community_posts', { communityId: id, token });
  };

  const sendPost = () => {
    if (!newPost.trim() || !selected) return;
    socket.emit('community_post', { communityId: selected.id, text: newPost, token });
    setNewPost('');
    setTimeout(() => socket.emit('community_posts', { communityId: selected.id, token }), 100);
  };

  const likePost = (postId) => {
    socket.emit('community_like', { postId, token });
  };

  const ICONS = ['👥', '🎮', '🎵', '💬', '🎨', '📚', '🎯', '🌟', '🔥', '❤️'];

  if (selected) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: 20 }}>
        <button onClick={() => { setSelected(null); setPosts([]); setMembers([]); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 16, fontSize: 14 }}>
          ← Geri
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 40 }}>{selected.icon}</span>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>{selected.name}</div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>{selected.member_count} üye · {selected.description}</div>
          </div>
        </div>

        {/* Create Post */}
        <div style={{ background: 'rgba(30,41,59,.8)', borderRadius: 14, padding: 16, marginBottom: 20, display: 'flex', gap: 8 }}>
          <input value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Bir gönderi yaz..." onKeyDown={e => e.key === 'Enter' && sendPost()} style={{ flex: 1, background: '#0f172a', border: '1px solid rgba(100,116,139,.3)', borderRadius: 10, padding: '8px 12px', color: '#e2e8f0', fontSize: 13 }} />
          <button onClick={sendPost} style={{ background: currentTheme.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>Gönder</button>
        </div>

        {/* Posts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {posts.map(post => (
            <div key={post.id} style={{ background: 'rgba(30,41,59,.8)', borderRadius: 14, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{post.avatar || '🐱'}</span>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{post.username}</div>
                  <div style={{ color: '#64748b', fontSize: 10 }}>{post.time}</div>
                </div>
              </div>
              <div style={{ color: '#e2e8f0', fontSize: 13, marginBottom: 8, lineHeight: 1.4 }}>{post.text}</div>
              <button onClick={() => likePost(post.id)} style={{ background: 'none', border: 'none', color: post.liked ? '#ef4444' : '#64748b', cursor: 'pointer', fontSize: 12 }}>
                ❤️ {post.likes}
              </button>
            </div>
          ))}
          {posts.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>Henüz gönderi yok</div>}
        </div>

        {/* Members */}
        <div style={{ background: 'rgba(30,41,59,.8)', borderRadius: 14, padding: 14 }}>
          <div style={{ color: '#fff', fontWeight: 800, marginBottom: 10 }}>Üyeler ({members.length})</div>
          {members.map(m => (
            <div key={m.username} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <span style={{ fontSize: 16 }}>{m.avatar || '🐱'}</span>
              <span style={{ color: '#e2e8f0', fontSize: 12 }}>{m.username}</span>
              {m.role === 'admin' && <span style={{ color: currentTheme.primary, fontSize: 10, fontWeight: 700 }}>Yönetici</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 24 }}>🏘️ Topluluklar</div>
        <button onClick={() => setShowCreate(true)} style={{ background: currentTheme.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
          + Yeni Topluluk
        </button>
      </div>

      {showCreate && (
        <div style={{ background: 'rgba(30,41,59,.95)', borderRadius: 14, padding: 20, marginBottom: 20, border: `1px solid ${currentTheme.primary}33` }}>
          <div style={{ color: '#fff', fontWeight: 800, marginBottom: 12 }}>Yeni Topluluk Oluştur</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {ICONS.map(icon => (
              <button key={icon} onClick={() => setNewIcon(icon)} style={{ background: newIcon === icon ? currentTheme.primary : '#1f2c34', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', fontSize: 20 }}>{icon}</button>
            ))}
          </div>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Topluluk adı" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(100,116,139,.3)', borderRadius: 10, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
          <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Açıklama (isteğe bağlı)" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(100,116,139,.3)', borderRadius: 10, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, marginBottom: 12, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowCreate(false)} style={{ flex: 1, background: '#1f2c34', color: '#94a3b8', border: 'none', borderRadius: 10, padding: '10px 0', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
            <button onClick={createCommunity} style={{ flex: 1, background: currentTheme.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontWeight: 700, cursor: 'pointer' }}>Oluştur</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {communities.map(c => (
          <div key={c.id} onClick={() => selectCommunity(c.id)} style={{ background: 'rgba(30,41,59,.8)', borderRadius: 14, padding: 16, cursor: 'pointer', border: `1px solid ${currentTheme.primary}22`, transition: 'border-color .2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 32 }}>{c.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{c.name}</div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>{c.description || 'Açıklama yok'}</div>
                <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>👥 {c.member_count} üye</div>
              </div>
            </div>
          </div>
        ))}
        {communities.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Henüz topluluk yok. İlk topluluğu sen oluştur!</div>}
      </div>
    </div>
  );
}

export default memo(Communities);
