import { memo } from 'react';

const FEED_MOBILE_CSS = `
@media (max-width: 768px) {
  .cm-feed-layout { flex-direction: column !important; }
  .cm-feed-content { padding: 10px !important; }
  .cm-feed-title { font-size: 14px !important; margin-bottom: 10px !important; }
  .cm-feed-item { padding: 8px 10px !important; margin-bottom: 6px !important; border-radius: 10px !important; }
  .cm-feed-item-text { font-size: 12px !important; }
  .cm-feed-sidebar { width: 100% !important; border-left: none !important; border-top: 1px solid #25313a !important; padding: 10px !important; max-height: 200px !important; overflow-y: auto !important; }
  .cm-feed-sidebar-title { font-size: 12px !important; margin-bottom: 8px !important; }
  .cm-feed-follow-item { padding: 6px 0 !important; }
  .cm-feed-follow-name { font-size: 11px !important; }
  .cm-feed-follow-count { font-size: 9px !important; }
  .cm-feed-follow-btn { padding: 4px 8px !important; font-size: 9px !important; border-radius: 6px !important; }
}
`;

const FeedTab = memo(function FeedTab({ authUser, feedItems, suggestedFollows, followUser }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <style>{FEED_MOBILE_CSS}</style>
      {!authUser ? (
        <div style={{ padding: 30, textAlign: 'center', color: '#7f8c98' }}>Akisi gormek icin hesap acmalisin.</div>
      ) : (
        <div className="cm-feed-layout cm-social-feed-layout" style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="cm-feed-content" style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            <div className="cm-feed-title cm-social-content-title" style={{ color: '#fff', fontWeight: 900, fontSize: 16, marginBottom: 14 }}>Akis</div>
            {feedItems.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#7f8c98' }}>Henuz akis yok. Takip ettigin kisilerin aktiviteleri burada gorunecek.</div>
            ) : feedItems.map((item, i) => {
              let content = '';
              try {
                const data = JSON.parse(item.data);
                if (item.type === 'follow') content = `${item.username} birini takip etti → ${data.following}`;
                else if (item.type === 'message') content = `${item.username} birine mesaj gonderdi`;
                else if (item.type === 'room') content = `${item.username} bir odaya katildi`;
                else content = `${item.username}: ${item.type}`;
              } catch { content = `${item.username}: ${item.type}`; }
              return (
                <div key={item.id || i} className="cm-feed-item" style={{ padding: '10px 14px', background: '#111b21', borderRadius: 12, marginBottom: 7 }}>
                  <div className="cm-feed-item-text" style={{ fontSize: 12, color: '#e9edef' }}>{content}</div>
                </div>
              );
            })}
          </div>
          <div className="cm-feed-sidebar cm-social-feed-sidebar" style={{ width: 200, borderLeft: '1px solid #25313a', background: '#0b141a', padding: 14, overflowY: 'auto', flexShrink: 0 }}>
            <div className="cm-feed-sidebar-title" style={{ color: '#fff', fontWeight: 900, fontSize: 13, marginBottom: 12 }}>Onerilen</div>
            {suggestedFollows.map(s => (
              <div key={s.username} className="cm-feed-follow-item" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #25313a' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{s.avatar}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cm-feed-follow-name" style={{ color: '#fff', fontWeight: 800, fontSize: 11 }}>{s.username}</div>
                  <div className="cm-feed-follow-count" style={{ color: '#667781', fontSize: 10 }}>{s.follower_count || 0} takipci</div>
                </div>
                <button type="button" onClick={() => followUser(s.username)} className="cm-feed-follow-btn" style={{ background: '#00a884', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 10, flexShrink: 0 }}>Takip Et</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default FeedTab;
