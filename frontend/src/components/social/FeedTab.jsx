import { useState, memo } from 'react';

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'simdi';
  if (mins < 60) return `${mins}dk once`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}sa once`;
  const days = Math.floor(hrs / 24);
  return `${days}g once`;
}

const FeedTab = memo(function FeedTab({ authUser, feedItems, suggestedFollows, followUser, createFeedPost, likeFeedPost, commentFeedPost }) {
  const [postText, setPostText] = useState('');
  const [expandedComments, setExpandedComments] = useState({});
  const [commentTexts, setCommentTexts] = useState({});

  const handlePost = () => {
    if (!postText.trim() || !createFeedPost) return;
    createFeedPost(postText.trim());
    setPostText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {!authUser ? (
        <div style={{ padding: 30, textAlign: 'center', color: '#7f8c98' }}>Akisi gormek icin hesap acmalisin.</div>
      ) : (
        <div className="cm-feed-layout cm-social-feed-layout" style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="cm-feed-content" style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            <div className="cm-feed-title" style={{ color: '#fff', fontWeight: 900, fontSize: 16, marginBottom: 14 }}>Akis</div>

            {/* Post Creation */}
            <div style={{ background: '#111b21', borderRadius: 14, padding: 14, marginBottom: 16, border: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{authUser.avatar || '🐱'}</div>
                <div style={{ flex: 1 }}>
                  <textarea
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder="Bir seyler paylas..."
                    rows={2}
                    maxLength={500}
                    style={{ width: '100%', background: '#0b141a', border: '1px solid #25313a', borderRadius: 10, padding: '10px 12px', color: '#e9edef', fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: 10, color: '#64748b' }}>{postText.length}/500</span>
                    <button onClick={handlePost} disabled={!postText.trim()} style={{
                      background: postText.trim() ? 'linear-gradient(135deg, #00a884, #008f6f)' : 'rgba(0,168,132,.2)',
                      color: '#fff', border: 'none', padding: '7px 18px', borderRadius: 10,
                      fontWeight: 800, fontSize: 12, cursor: postText.trim() ? 'pointer' : 'not-allowed'
                    }}>Paylas</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed Items */}
            {feedItems.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#7f8c98', fontSize: 13 }}>
                Henuz akis yok. Takip ettigin kisilerin aktiviteleri burada gorunecek.
              </div>
            ) : feedItems.map((item) => {
              let data = {};
              try { data = JSON.parse(item.data); } catch {}
              const isLiked = item.liked_by?.includes(authUser.username);
              const comments = item.comments || [];
              const showComments = expandedComments[item.id];

              if (item.type === 'follow') {
                return (
                  <div key={item.id} style={{ background: '#111b21', borderRadius: 14, padding: '12px 14px', marginBottom: 10, border: '1px solid rgba(255,255,255,.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 24 }}>{item.avatar || '🐱'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: '#e9edef' }}>
                          <span style={{ fontWeight: 800, color: '#53e6bc' }}>{item.username}</span> birini takip etti → <span style={{ fontWeight: 700 }}>{data.following}</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>{timeAgo(item.created_at)}</div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (item.type === 'room_join') {
                return (
                  <div key={item.id} style={{ background: '#111b21', borderRadius: 14, padding: '12px 14px', marginBottom: 10, border: '1px solid rgba(255,255,255,.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 24 }}>{item.avatar || '🐱'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: '#e9edef' }}>
                          <span style={{ fontWeight: 800, color: '#53e6bc' }}>{item.username}</span> bir odaya katildi → <span style={{ fontWeight: 700 }}>{data.roomName || data.roomId}</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>{timeAgo(item.created_at)}</div>
                      </div>
                    </div>
                  </div>
                );
              }

              // Post type
              return (
                <div key={item.id} style={{ background: '#111b21', borderRadius: 14, padding: 0, marginBottom: 10, border: '1px solid rgba(255,255,255,.04)', overflow: 'hidden' }}>
                  {/* Post Header */}
                  <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 28 }}>{item.avatar || '🐱'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: '#e9edef', fontSize: 13 }}>{item.username}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{timeAgo(item.created_at)}</div>
                    </div>
                    {item.username === authUser.username && (
                      <button onClick={() => likeFeedPost && commentFeedPost && window.__feedDelete?.(item.id)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14 }}>🗑</button>
                    )}
                  </div>
                  {/* Post Content */}
                  <div style={{ padding: '0 14px 10px', fontSize: 13, color: '#e9edef', lineHeight: 1.5, wordBreak: 'break-word' }}>{data.text}</div>
                  {/* Actions */}
                  <div style={{ padding: '6px 14px', borderTop: '1px solid rgba(255,255,255,.04)', display: 'flex', gap: 16, alignItems: 'center' }}>
                    <button onClick={() => likeFeedPost?.(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 0' }}>
                      <span style={{ fontSize: 16, filter: isLiked ? 'none' : 'grayscale(1)', transition: 'all .2s' }}>{isLiked ? '❤️' : '🤍'}</span>
                      <span style={{ fontSize: 11, color: isLiked ? '#ef4444' : '#64748b', fontWeight: 700 }}>{item.like_count || 0}</span>
                    </button>
                    <button onClick={() => setExpandedComments(prev => ({ ...prev, [item.id]: !prev[item.id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 0' }}>
                      <span style={{ fontSize: 16 }}>💬</span>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{item.comment_count || 0}</span>
                    </button>
                  </div>
                  {/* Comments Section */}
                  {showComments && (
                    <div style={{ padding: '8px 14px 12px', borderTop: '1px solid rgba(255,255,255,.04)' }}>
                      {comments.map((c, ci) => (
                        <div key={c.id || ci} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: ci < comments.length - 1 ? '1px solid rgba(255,255,255,.03)' : 'none' }}>
                          <div style={{ fontSize: 16, flexShrink: 0 }}>{c.avatar || '🐱'}</div>
                          <div>
                            <span style={{ fontWeight: 800, color: '#53e6bc', fontSize: 11 }}>{c.username}</span>
                            <span style={{ color: '#e9edef', fontSize: 12, marginLeft: 6 }}>{c.text}</span>
                            <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>{timeAgo(c.created_at)}</div>
                          </div>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input
                          value={commentTexts[item.id] || ''}
                          onChange={(e) => setCommentTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && commentTexts[item.id]?.trim()) {
                              commentFeedPost?.(item.id, commentTexts[item.id].trim());
                              setCommentTexts(prev => ({ ...prev, [item.id]: '' }));
                            }
                          }}
                          placeholder="Yorum yaz..."
                          style={{ flex: 1, background: '#0b141a', border: '1px solid #25313a', borderRadius: 8, padding: '6px 10px', color: '#e9edef', fontSize: 11, outline: 'none' }}
                        />
                        <button onClick={() => {
                          if (commentTexts[item.id]?.trim()) {
                            commentFeedPost?.(item.id, commentTexts[item.id].trim());
                            setCommentTexts(prev => ({ ...prev, [item.id]: '' }));
                          }
                        }} style={{ background: '#00a884', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 8, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>Gonder</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar */}
          <div className="cm-feed-sidebar" style={{ width: 200, borderLeft: '1px solid #25313a', background: '#0b141a', padding: 14, overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 13, marginBottom: 12 }}>Onerilen</div>
            {suggestedFollows.map(s => (
              <div key={s.username} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #25313a' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{s.avatar}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 11 }}>{s.username}</div>
                  <div style={{ color: '#667781', fontSize: 10 }}>{s.follower_count || 0} takipci</div>
                </div>
                <button type="button" onClick={() => followUser(s.username)} style={{ background: '#00a884', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 10, flexShrink: 0 }}>Takip Et</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default FeedTab;
