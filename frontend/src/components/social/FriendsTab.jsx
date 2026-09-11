import { memo } from 'react';
import { formatLastSeen } from '../../utils/formatLastSeen';

const FRIENDS_MOBILE_CSS = `
@media (max-width: 768px) {
  .cm-friends-root { padding: 8px !important; }
  .cm-friends-search { flex-direction: column !important; gap: 6px !important; }
  .cm-friends-search input { width: 100% !important; font-size: 12px !important; padding: 9px 10px !important; }
  .cm-friends-search button { width: 100% !important; padding: 9px !important; font-size: 12px !important; }
  .cm-friends-section-title { font-size: 13px !important; margin: 12px 0 6px !important; }
  .cm-social-card { padding: 8px 10px !important; margin-bottom: 6px !important; border-radius: 10px !important; }
  .cm-social-card-avatar { font-size: 20px !important; }
  .cm-social-card-name { font-size: 12px !important; }
  .cm-social-card-sub { font-size: 10px !important; }
  .cm-social-card-btns { gap: 4px !important; }
  .cm-social-card-btns button { padding: 5px 8px !important; font-size: 9px !important; border-radius: 6px !important; }
  .cm-friends-card-row { flex-wrap: wrap !important; }
  .cm-friends-card-row > div { min-width: 0 !important; }
}
`;

const FriendsTab = memo(function FriendsTab({ authUser, friendSearch, setFriendSearch, searchFriends, friendSearchResults, sendFriendRequest, friendRequests, respondFriendRequest, friends, friendOnlineStatuses, openDm, unfriendUser, styles, openAuth }) {
  return (
    <div className="cm-friends-root" style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
      <style>{FRIENDS_MOBILE_CSS}</style>
      {!authUser ? (
        <div style={{ padding: 30, textAlign: 'center', color: '#7f8c98' }}>Arkadaslik sistemi icin hesap acmalisin.<br/><button type="button" onClick={() => openAuth('register')} style={{ ...styles.buttonPrimary, marginTop: 12 }}>Ucretsiz Hesap Ac</button></div>
      ) : (
        <div>
          <div className="cm-friends-search cm-social-msg-row" style={{ display: 'flex', gap: 7 }}>
            <input value={friendSearch} onChange={(e) => setFriendSearch(e.target.value)} placeholder="Kullanici adi ara..." style={{ ...styles.input, flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && searchFriends()} />
            <button type="button" onClick={searchFriends} style={{ ...styles.buttonPrimary, flexShrink: 0 }}>Ara</button>
          </div>
          {friendSearchResults.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ color: '#7f8c98', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Sonuclar</div>
              {friendSearchResults.map(u => (
                <div key={u.username} className="cm-social-card cm-friends-card-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 10, background: '#111b21', borderRadius: 12, marginBottom: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <span className="cm-social-card-avatar" style={{ fontSize: 24 }}>{u.avatar}</span>
                      <span style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: u.isOnline ? '#25d366' : '#63727d', border: '2px solid #111b21' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="cm-social-card-name" style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>{u.username}</div>
                      <div className="cm-social-card-sub" style={{ color: '#7f8c98', fontSize: 11 }}>{u.isOnline ? 'Cevrimici' : (u.lastSeen ? `Son gorunme: ${formatLastSeen(u.lastSeen)}` : 'Cevrimdisi')}</div>
                    </div>
                  </div>
                  <button type="button" onClick={() => sendFriendRequest(u.username)} style={{ ...styles.buttonPrimary, padding: '7px 10px', fontSize: 11, flexShrink: 0 }}>Ekle</button>
                </div>
              ))}
            </div>
          )}
          {friendRequests.length > 0 && (
            <div>
              <div className="cm-friends-section-title" style={{ color: '#fff', fontWeight: 900, margin: '18px 0 8px' }}>Gelen istekler</div>
              {friendRequests.map(r => (
                <div key={r.id} className="cm-social-card cm-friends-card-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 10, background: '#111b21', borderRadius: 12, marginBottom: 7, gap: 8 }}>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.avatar || '🐱'} {r.fromUsername}</span>
                  <div className="cm-social-card-btns" style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button type="button" onClick={() => respondFriendRequest(r.id, 'accept')} style={{ ...styles.buttonPrimary, padding: '7px 10px', fontSize: 11 }}>Kabul</button>
                    <button type="button" onClick={() => respondFriendRequest(r.id, 'reject')} style={{ background: '#202c33', color: '#fff', border: '1px solid #2d3b44', padding: '7px 10px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: 11 }}>Sil</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {friends.length > 0 && (
            <div>
              <div className="cm-friends-section-title" style={{ color: '#fff', fontWeight: 900, margin: '18px 0 8px' }}>Arkadaslarin ({friends.length})</div>
              {friends.map(f => {
                const onlineStatus = friendOnlineStatuses[f.username];
                const isOnline = f.isOnline || onlineStatus?.isOnline;
                return (
                  <div key={f.username} className="cm-social-card cm-friends-card-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#111b21', borderRadius: 12, marginBottom: 7, border: isOnline ? '1px solid rgba(37,211,102,0.25)' : '1px solid transparent', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <span className="cm-social-card-avatar" style={{ fontSize: 24 }}>{f.avatar}</span>
                        <span style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: isOnline ? '#25d366' : '#63727d', border: '2px solid #111b21' }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="cm-social-card-name" style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>{f.username}</div>
                        <div className="cm-social-card-sub" style={{ color: isOnline ? '#25d366' : '#7f8c98', fontSize: 11 }}>{isOnline ? 'Cevrimici' : (onlineStatus?.lastSeen ? `Son gorunme: ${formatLastSeen(onlineStatus.lastSeen)}` : 'Cevrimdisi')}</div>
                      </div>
                    </div>
                    <div className="cm-social-card-btns" style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button type="button" onClick={() => openDm(f)} style={{ background: '#00a884', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 8px', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>Mesaj</button>
                      <button type="button" onClick={() => { if (confirm(`${f.username} arkadasligini silmek istediginden emin misin?`)) unfriendUser(f.username); }} style={{ background: '#ea0038', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 8px', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>Sil</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default FriendsTab;
