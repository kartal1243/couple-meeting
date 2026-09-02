import { useState, useRef, useEffect } from 'react';

export default function ProfileDropdown({ authUser, myAvatar, friendRequests, friends, friendOnlineStatuses, onOpenSocial, onOpenAuth, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const onlineCount = friends?.filter(f => friendOnlineStatuses?.[f.username]?.isOnline || f.isOnline).length || 0;

  if (!authUser) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
        background: open ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.05)',
        border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, cursor: 'pointer',
        color: '#fff', transition: 'all 0.2s'
      }}>
        <span style={{ fontSize: 22 }}>{authUser.avatar || myAvatar}</span>
        <span style={{ fontWeight: 800, fontSize: 13, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{authUser.username}</span>
        {friendRequests.length > 0 && (
          <span style={{
            background: '#ea0038', color: '#fff', borderRadius: 10,
            padding: '1px 6px', fontSize: 10, fontWeight: 900, minWidth: 18, textAlign: 'center'
          }}>{friendRequests.length}</span>
        )}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7f8c98" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 260,
          background: '#111b21', border: '1px solid #2a3942', borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,.6)', overflow: 'hidden', zIndex: 9999
        }}>
          {/* User header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #25313a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#1a2634', display: 'grid', placeItems: 'center', fontSize: 22 }}>{authUser.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{authUser.username}</div>
              <div style={{ color: '#7f8c98', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{authUser.email}</div>
            </div>
            {authUser.isVip && <span style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff', padding: '3px 8px', borderRadius: 8, fontWeight: 900, fontSize: 10 }}>👑 VIP</span>}
          </div>

          {/* Stats */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #25313a', display: 'flex', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>{friends?.length || 0}</div>
              <div style={{ color: '#7f8c98', fontSize: 10 }}>Arkadaş</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#25d366', fontWeight: 900, fontSize: 16 }}>{onlineCount}</div>
              <div style={{ color: '#7f8c98', fontSize: 10 }}>Çevrimiçi</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#f59e0b', fontWeight: 900, fontSize: 16 }}>{friendRequests.length}</div>
              <div style={{ color: '#7f8c98', fontSize: 10 }}>İstek</div>
            </div>
          </div>

          {/* Pending friend requests preview */}
          {friendRequests.length > 0 && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #25313a' }}>
              <div style={{ color: '#ea0038', fontSize: 10, fontWeight: 900, marginBottom: 6 }}>📩 BEKLEYEN İSTEKLER</div>
              {friendRequests.slice(0, 3).map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{r.avatar || '🐱'}</span>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>{r.fromUsername}</span>
                  </div>
                  <button onClick={() => { onOpenSocial('friends'); setOpen(false); }} style={{ background: '#00a884', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>Görüntüle</button>
                </div>
              ))}
              {friendRequests.length > 3 && <div style={{ color: '#7f8c98', fontSize: 10, textAlign: 'center', marginTop: 4 }}>+{friendRequests.length - 3} tane daha</div>}
            </div>
          )}

          {/* Menu items */}
          <div style={{ padding: '6px' }}>
            {[
              { icon: '🌍', label: 'Topluluk', desc: 'Global sohbet ve arkadaşlar', action: () => { onOpenSocial('global'); setOpen(false); } },
              { icon: '🤝', label: 'Arkadaşlar', desc: `${friends?.length || 0} arkadaş, ${onlineCount} online`, action: () => { onOpenSocial('friends'); setOpen(false); }, badge: friendRequests.length || null },
              { icon: '💬', label: 'Mesajlar', desc: 'Özel mesajlaşma', action: () => { onOpenSocial('dm'); setOpen(false); } },
              { icon: '👥', label: 'Gruplar', desc: 'Grup sohbeti', action: () => { onOpenSocial('groups'); setOpen(false); } },
              { icon: '👤', label: 'Profilim', desc: 'Düzenle ve özelleştir', action: () => { onOpenSocial('profile'); setOpen(false); } },
            ].map(({ icon, label, desc, action, badge }) => (
              <button key={label} onClick={action} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                background: 'transparent', border: 'none', borderRadius: 10, cursor: 'pointer',
                color: '#fff', textAlign: 'left', transition: 'background 0.15s'
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1a2634'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: 18, width: 32, height: 32, borderRadius: 10, background: '#1a2634', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {label}
                    {badge && <span style={{ background: '#ea0038', color: '#fff', borderRadius: 8, padding: '1px 5px', fontSize: 9, fontWeight: 900 }}>{badge}</span>}
                  </div>
                  <div style={{ color: '#7f8c98', fontSize: 11 }}>{desc}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>

          {/* Logout */}
          <div style={{ padding: '6px', borderTop: '1px solid #25313a' }}>
            <button onClick={() => { onLogout(); setOpen(false); }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              background: 'transparent', border: 'none', borderRadius: 10, cursor: 'pointer',
              color: '#ea0038', fontWeight: 800, fontSize: 13, transition: 'background 0.15s'
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(234,0,56,.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <span style={{ fontSize: 18, width: 32, height: 32, borderRadius: 10, background: 'rgba(234,0,56,.1)', display: 'grid', placeItems: 'center' }}>🚪</span>
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
