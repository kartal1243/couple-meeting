import { useState, useRef, useEffect } from 'react';
import { VIP_LEVELS } from '../../constants';

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
        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px',
        background: open ? '#e2e8f0' : '#f8fafc',
        border: '1.5px solid #0f172a', borderRadius: 999, cursor: 'pointer',
        color: '#0f172a', transition: 'all 0.2s', fontWeight: 800, fontSize: 13
      }}>
        <span style={{ fontSize: 16 }}>{authUser.avatar || myAvatar}</span>
        <span style={{ fontWeight: 900, fontSize: 13, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{authUser.username}</span>
        {friendRequests.length > 0 && (
          <span style={{
            background: '#ea0038', color: '#fff', borderRadius: 10,
            padding: '1px 6px', fontSize: 10, fontWeight: 900, minWidth: 18, textAlign: 'center'
          }}>{friendRequests.length}</span>
        )}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 260,
          background: '#ffffff', border: '1.5px solid #0f172a', borderRadius: 16,
          boxShadow: '0 20px 50px rgba(0,0,0,.15)', overflow: 'hidden', zIndex: 9999
        }}>
          {/* User header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#e2e8f0', display: 'grid', placeItems: 'center', fontSize: 22 }}>{authUser.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#0f172a', fontWeight: 900, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{authUser.username}</div>
              <div style={{ color: '#64748b', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{authUser.email}</div>
            </div>
            {authUser.isVip && <span style={{ background: VIP_LEVELS[authUser.vipLevel || 0]?.gradient || 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff', padding: '3px 8px', borderRadius: 8, fontWeight: 900, fontSize: 10 }}>{VIP_LEVELS[authUser.vipLevel || 0]?.icon || '👑'} VIP</span>}
          </div>

          {/* Stats */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 16, background: '#ffffff' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#0f172a', fontWeight: 900, fontSize: 16 }}>{friends?.length || 0}</div>
              <div style={{ color: '#64748b', fontSize: 10 }}>Arkadaş</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#16a34a', fontWeight: 900, fontSize: 16 }}>{onlineCount}</div>
              <div style={{ color: '#64748b', fontSize: 10 }}>Çevrimiçi</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#d97706', fontWeight: 900, fontSize: 16 }}>{friendRequests.length}</div>
              <div style={{ color: '#64748b', fontSize: 10 }}>İstek</div>
            </div>
          </div>

          {/* Pending friend requests preview */}
          {friendRequests.length > 0 && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', background: '#fff1f2' }}>
              <div style={{ color: '#e11d48', fontSize: 10, fontWeight: 900, marginBottom: 6 }}>📩 BEKLEYEN İSTEKLER</div>
              {friendRequests.slice(0, 3).map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{r.avatar || '🐱'}</span>
                    <span style={{ color: '#0f172a', fontWeight: 800, fontSize: 12 }}>{r.fromUsername}</span>
                  </div>
                  <button onClick={() => { onOpenSocial('friends'); setOpen(false); }} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>Görüntüle</button>
                </div>
              ))}
              {friendRequests.length > 3 && <div style={{ color: '#64748b', fontSize: 10, textAlign: 'center', marginTop: 4 }}>+{friendRequests.length - 3} tane daha</div>}
            </div>
          )}

          {/* Menu items */}
          <div style={{ padding: '6px', background: '#ffffff' }}>
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
                color: '#0f172a', textAlign: 'left', transition: 'background 0.15s'
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 12.5, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {label}
                    {badge && <span style={{ background: '#ea0038', color: '#fff', borderRadius: 8, padding: '1px 5px', fontSize: 9 }}>{badge}</span>}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 10 }}>{desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Logout */}
          <div style={{ padding: '6px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <button onClick={() => { onLogout(); setOpen(false); }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
              background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer',
              color: '#ef4444', fontWeight: 800, fontSize: 12.5
            }}>
              <span>🚪</span>
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
