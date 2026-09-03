import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { VariableSizeList } from 'react-window';

const AVATAR_COLORS = ['#7c3aed', '#2563eb', '#00a884', '#f59e0b', '#ec4899', '#ef4444', '#06b6d4', '#8b5cf6'];
function getAvatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const ROW_PADDING = 6;

function VirtualizedChat({
  messages, mySocketId, username, chatInput, setChatInput,
  handleSendMessage, currentTheme, replyTo, setReplyTo,
  messagesSearch, setMessagesSearch, filteredMessages
}) {
  const listRef = useRef(null);
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const primary = currentTheme?.primary || '#00a884';
  const displayMessages = filteredMessages || messages;

  useEffect(() => {
    if (listRef.current && displayMessages.length > 0) {
      listRef.current.scrollToItem(displayMessages.length - 1, 'end');
    }
  }, [displayMessages.length]);

  const handleTouchReply = useCallback((msg, idx) => {
    if (hoveredMsg === idx) {
      setReplyTo(msg);
      setHoveredMsg(null);
    } else {
      setHoveredMsg(idx);
      setTimeout(() => setHoveredMsg(null), 3000);
    }
  }, [hoveredMsg, setReplyTo]);

  const getItemSize = useCallback((index) => {
    const msg = displayMessages[index];
    if (!msg) return 50;
    const isMe = msg.senderId === mySocketId || msg.sender === username;
    let height = 28; // base bubble padding + text
    if (msg.text) height += Math.ceil(msg.text.length / 40) * 16;
    if (msg.replyTo) height += 38;
    if (!isMe) height += 16; // sender name
    if (msg.time) height += 14;
    return Math.max(height + ROW_PADDING * 2, 50);
  }, [displayMessages, mySocketId, username]);

  const Row = useCallback(({ index, style }) => {
    const msg = displayMessages[index];
    if (!msg) return null;
    const isMe = msg.senderId === mySocketId || msg.sender === username;
    const senderName = msg.sender || 'Bilinmeyen';
    const avatarColor = getAvatarColor(senderName);
    const showAvatar = index === 0 || displayMessages[index - 1]?.sender !== msg.sender;

    return (
      <div style={{ ...style, paddingLeft: 10, paddingRight: 10 }}>
        <div
          onMouseEnter={() => setHoveredMsg(index)}
          onMouseLeave={() => setHoveredMsg(null)}
          style={{
            display: 'flex',
            flexDirection: isMe ? 'row-reverse' : 'row',
            alignItems: 'flex-end', gap: 6,
            alignSelf: isMe ? 'flex-end' : 'flex-start',
            position: 'relative',
            width: '100%'
          }}
        >
          {!isMe && (
            showAvatar ? (
              <div style={{
                width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}bb)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14
              }}>
                {msg.avatar || '🐱'}
              </div>
            ) : <div style={{ width: 30, flexShrink: 0 }} />
          )}

          <div style={{
            maxWidth: isMe ? '75%' : '70%',
            cursor: 'pointer'
          }}>
            {!isMe && showAvatar && (
              <div style={{
                fontSize: 10, fontWeight: 800, color: avatarColor,
                marginBottom: 2, paddingLeft: 2
              }}>
                {senderName}
              </div>
            )}

            <div
              onClick={() => handleTouchReply(msg, index)}
              onTouchStart={(e) => { e.stopPropagation(); handleTouchReply(msg, index); }}
              style={{
                background: isMe
                  ? `linear-gradient(135deg, ${primary}, ${primary}bb)`
                  : 'rgba(255,255,255,.06)',
                color: isMe ? '#fff' : '#e2e8f0',
                padding: '7px 10px',
                borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                boxShadow: isMe ? `0 2px 8px ${primary}33` : '0 1px 4px rgba(0,0,0,.15)',
                border: isMe ? 'none' : '1px solid rgba(255,255,255,.04)',
                fontSize: 12, lineHeight: 1.4,
                wordBreak: 'break-word', overflowWrap: 'break-word',
                maxWidth: '100%', boxSizing: 'border-box'
              }}>
              {msg.replyTo && (
                <div style={{
                  borderLeft: `3px solid ${isMe ? 'rgba(255,255,255,.35)' : primary}`,
                  paddingLeft: 6, marginBottom: 4,
                  background: isMe ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.03)',
                  borderRadius: 4, padding: '4px 6px', marginBottom: 5,
                  fontSize: 10, lineHeight: 1.3
                }}>
                  <div style={{ fontWeight: 800, color: isMe ? '#fff' : primary, fontSize: 9 }}>
                    ↩ {msg.replyToSender}
                  </div>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                    {msg.replyToText}
                  </div>
                </div>
              )}
              {msg.text}
            </div>

            {(!isMe && !showAvatar) || isMe ? (
              <div style={{
                fontSize: 8, color: '#475569',
                textAlign: isMe ? 'right' : 'left',
                marginTop: 2, paddingLeft: isMe ? 0 : 2, paddingRight: isMe ? 2 : 0
              }}>
                {msg.time}
              </div>
            ) : null}
          </div>

          {(hoveredMsg === index) && (
            <button
              onClick={(e) => { e.stopPropagation(); setReplyTo(msg); setHoveredMsg(null); }}
              onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); setReplyTo(msg); setHoveredMsg(null); }}
              style={{
                position: 'absolute', top: 0,
                [isMe ? 'left' : 'right']: -2,
                background: primary, color: '#fff', border: 'none',
                borderRadius: 6, padding: '2px 6px', fontSize: 9, fontWeight: 800,
                cursor: 'pointer', whiteSpace: 'nowrap', zIndex: 10,
                boxShadow: `0 4px 12px ${primary}66`
              }}
            >
              ↩
            </button>
          )}
        </div>
      </div>
    );
  }, [displayMessages, mySocketId, username, hoveredMsg, primary, handleTouchReply, setReplyTo]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', minHeight: 0 }}>
      {/* Search Bar */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(0,0,0,.2)', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Mesajlarda ara..."
            value={messagesSearch}
            onChange={(e) => setMessagesSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              borderRadius: 10, border: '1px solid rgba(255,255,255,.08)',
              background: 'rgba(255,255,255,.05)', color: '#e2e8f0',
              padding: '7px 10px 7px 30px', fontSize: 11, outline: 'none'
            }}
          />
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, opacity: 0.5 }}>🔍</span>
          {messagesSearch && (
            <button
              onClick={() => setMessagesSearch('')}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,.08)', border: 'none', color: '#64748b',
                width: 18, height: 18, borderRadius: 5, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10
              }}
            >✕</button>
          )}
        </div>
        {messagesSearch && (
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontWeight: 800 }}>
            {displayMessages.length} sonuç bulundu
          </div>
        )}
      </div>

      {/* Virtualized Messages */}
      <div onClick={() => setHoveredMsg(null)} style={{ flex: 1, minHeight: 0 }}>
        {displayMessages.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
            color: '#475569', padding: 30, height: '100%'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: `linear-gradient(135deg, ${primary}22, ${primary}11)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              border: `1px solid ${primary}22`
            }}>{messagesSearch ? '🔍' : '💬'}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#64748b' }}>
              {messagesSearch ? 'Sonuç bulunamadı' : 'Henüz mesaj yok'}
            </div>
            <div style={{ fontSize: 11, textAlign: 'center', lineHeight: 1.4 }}>
              {messagesSearch ? 'Farklı bir arama yap' : 'Sohbete ilk sen başla!'}
            </div>
          </div>
        ) : (
          <VariableSizeList
            ref={listRef}
            height={400}
            itemCount={displayMessages.length}
            itemSize={getItemSize}
            width="100%"
            overscanCount={8}
          >
            {Row}
          </VariableSizeList>
        )}
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px',
          background: `${primary}0d`,
          borderTop: '1px solid rgba(255,255,255,.06)',
          borderLeft: `3px solid ${primary}`
        }}>
          <span style={{ color: primary, fontWeight: 900, fontSize: 11 }}>↩</span>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: primary }}>{replyTo.sender}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {replyTo.text}
            </div>
          </div>
          <button onClick={() => setReplyTo(null)} style={{
            background: 'rgba(239,68,68,.15)', border: 'none', color: '#ef4444',
            width: 20, height: 20, borderRadius: 6, cursor: 'pointer', fontSize: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900
          }}>✕</button>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,.06)',
          display: 'flex', gap: 6, background: 'rgba(0,0,0,.3)'
        }}
      >
        <input
          type="text"
          placeholder={replyTo ? `${replyTo.sender} yanıtla...` : 'Mesaj yaz...'}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          style={{
            flex: 1, borderRadius: 12, minWidth: 0,
            background: 'rgba(255,255,255,.06)',
            border: `1px solid ${chatInput ? primary + '44' : 'rgba(255,255,255,.08)'}`,
            color: '#e9edef', padding: '8px 12px', fontSize: 12, outline: 'none',
            transition: 'border-color 0.2s'
          }}
        />
        <button type="submit" style={{
          background: `linear-gradient(135deg, ${primary}, ${primary}bb)`,
          color: '#fff', border: 'none', borderRadius: 10, width: 36, height: 36, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, cursor: 'pointer'
        }}>➤</button>
      </form>
    </div>
  );
}

export default memo(VirtualizedChat);
