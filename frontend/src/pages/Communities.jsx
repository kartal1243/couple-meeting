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
    socket.on('community_list_result', (data) => setCommunities(Array.isArray(data?.communities) ? data.communities : []));
    socket.on('community_info_result', (data) => {
      setMembers(Array.isArray(data?.members) ? data.members : []);
      setSelected(data.community);
    });
    socket.on('community_posts_result', (data) => setPosts(Array.isArray(data?.posts) ? data.posts : []));
    socket.on('community_new_post', (data) => {
      if (data?.post && selected) {
        setPosts(prev => [data.post, ...(Array.isArray(prev) ? prev : [])]);
      }
    });
    socket.on('community_created', () => {
      setShowCreate(false);
      socket.emit('community_list', { token });
    });
    return () => {
      socket.off('community_list_result');
      socket.off('community_info_result');
      socket.off('community_posts_result');
      socket.off('community_new_post');
      socket.off('community_created');
    };
  }, [token]);

  const createCommunity = () => {
    if (!newName.trim()) return;
    socket.emit('community_create', { name: newName, description: newDesc, icon: newIcon, token });
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
      <div className="cm-comm-root" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: 16, paddingBottom: 40 }}>
        <button onClick={() => { setSelected(null); setPosts([]); setMembers([]); }} style={{ background: 'rgba(255,255,255,.06)', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: 14, fontSize: 13, padding: '8px 14px', borderRadius: 10, fontWeight: 700 }}>
          ← Geri
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <span className="cm-comm-detail-icon" style={{ fontSize: 40 }}>{selected.icon}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="cm-comm-detail-name" style={{ color: '#fff', fontWeight: 800, fontSize: 20, wordBreak: 'break-word' }}>{selected.name}</div>
            <div className="cm-comm-detail-meta" style={{ color: '#94a3b8', fontSize: 13, wordBreak: 'break-word' }}>{selected.member_count} üye · {selected.description}</div>
          </div>
        </div>

        <div className="cm-comm-post-row" style={{ background: 'rgba(30,41,59,.8)', borderRadius: 14, padding: 14, marginBottom: 18, display: 'flex', gap: 8 }}>
          <input className="cm-comm-post-input" value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Bir gönderi yaz..." onKeyDown={e => e.key === 'Enter' && sendPost()} style={{ flex: 1, background: '#0f172a', border: '1px solid rgba(100,116,139,.3)', borderRadius: 10, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, minWidth: 0 }} />
          <button className="cm-comm-post-btn" onClick={sendPost} style={{ background: currentTheme.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>Gönder</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {(Array.isArray(posts) ? posts : []).map(post => (
            <div key={post.id} className="cm-comm-post-card" style={{ background: 'rgba(30,41,59,.8)', borderRadius: 14, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{post.avatar || '🐱'}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{post.username}</div>
                  <div style={{ color: '#64748b', fontSize: 10 }}>{post.time}</div>
                </div>
              </div>
              <div className="cm-comm-post-text" style={{ color: '#e2e8f0', fontSize: 13, marginBottom: 8, lineHeight: 1.5, wordBreak: 'break-word' }}>{post.text}</div>
              <button onClick={() => likePost(post.id)} style={{ background: 'none', border: 'none', color: post.liked ? '#ef4444' : '#64748b', cursor: 'pointer', fontSize: 12, padding: 0 }}>
                ❤️ {post.likes}
              </button>
            </div>
          ))}
          {(Array.isArray(posts) ? posts : []).length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: 24, fontSize: 13 }}>Henüz gönderi yok</div>}
        </div>

        <div className="cm-comm-members-card" style={{ background: 'rgba(30,41,59,.8)', borderRadius: 14, padding: 14 }}>
          <div style={{ color: '#fff', fontWeight: 800, marginBottom: 10, fontSize: 14 }}>Üyeler ({(Array.isArray(members) ? members : []).length})</div>
          {(Array.isArray(members) ? members : []).map(m => (
            <div key={m.username} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
              <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 6, overflow: 'hidden', display: 'inline-grid', placeItems: 'center', background: '#1a2634' }}>
                {m.avatar?.startsWith('data:image') ? <img src={m.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 14 }}>{m.avatar || '🐱'}</span>}
              </span>
              <span style={{ color: '#e2e8f0', fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.username}</span>
              {m.role === 'admin' && <span style={{ color: currentTheme.primary, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>Yönetici</span>}
            </div>
          ))}
          <button onClick={() => leaveCommunity(selected.id)} style={{ width: '100%', marginTop: 12, background: 'rgba(239,68,68,.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '10px 0', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
            Topluluktan Ayrıl
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cm-comm-root" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: 16, paddingBottom: 40 }}>

      <div className="cm-comm-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div className="cm-comm-title" style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>🏘️ Topluluklar</div>
        <button onClick={() => setShowCreate(true)} style={{ background: currentTheme.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>
          + Yeni
        </button>
      </div>

      {showCreate && (
        <div className="cm-comm-create" style={{ background: 'rgba(30,41,59,.95)', borderRadius: 14, padding: 18, marginBottom: 18, border: `1px solid ${currentTheme.primary}33` }}>
          <div style={{ color: '#fff', fontWeight: 800, marginBottom: 12, fontSize: 15 }}>Yeni Topluluk Oluştur</div>
          <div className="cm-comm-icons" style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {ICONS.map(icon => (
              <button key={icon} onClick={() => setNewIcon(icon)} style={{ background: newIcon === icon ? currentTheme.primary : '#1f2c34', border: 'none', borderRadius: 8, width: 40, height: 40, cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</button>
            ))}
          </div>
          <input className="cm-comm-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Topluluk adı" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(100,116,139,.3)', borderRadius: 10, padding: '11px 12px', color: '#e2e8f0', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
          <input className="cm-comm-input" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Açıklama (isteğe bağlı)" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(100,116,139,.3)', borderRadius: 10, padding: '11px 12px', color: '#e2e8f0', fontSize: 13, marginBottom: 14, boxSizing: 'border-box' }} />
          <div className="cm-comm-btn-row" style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowCreate(false)} style={{ flex: 1, background: '#1f2c34', color: '#94a3b8', border: 'none', borderRadius: 10, padding: '11px 0', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>İptal</button>
            <button onClick={createCommunity} style={{ flex: 1, background: currentTheme.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Oluştur</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {communities.map(c => (
          <div key={c.id} onClick={() => selectCommunity(c.id)} className="cm-comm-card" style={{ background: 'rgba(30,41,59,.8)', borderRadius: 14, padding: 14, cursor: 'pointer', border: `1px solid ${currentTheme.primary}22`, transition: 'border-color .2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="cm-comm-card-icon" style={{ fontSize: 32, flexShrink: 0 }}>{c.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="cm-comm-card-name" style={{ color: '#fff', fontWeight: 800, fontSize: 15, wordBreak: 'break-word' }}>{c.name}</div>
                <div className="cm-comm-card-desc" style={{ color: '#94a3b8', fontSize: 12, wordBreak: 'break-word' }}>{c.description || 'Açıklama yok'}</div>
                <div className="cm-comm-card-members" style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>👥 {c.member_count} üye</div>
              </div>
            </div>
          </div>
        ))}
        {communities.length === 0 && <div className="cm-comm-empty" style={{ color: '#64748b', textAlign: 'center', padding: 40, fontSize: 14 }}>Henüz topluluk yok. İlk topluluğu sen oluştur!</div>}
      </div>
    </div>
  );
}

export default memo(Communities);
