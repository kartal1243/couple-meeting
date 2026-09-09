import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';

const ChatPage = () => {
  const {
    globalMessages, globalChatInput, setGlobalChatInput, sendGlobalMessage,
    authUser, openAuth, socket, authToken
  } = useApp();
  const messagesEndRef = useRef(null);
  const [localInput, setLocalInput] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [globalMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = localInput.trim();
    if (!text || !socket) return;
    socket.emit('global_chat_message', { text, token: authToken || '' });
    setLocalInput('');
  };

  return (
    <div className="mobile-page chat-page">
      <div className="chat-header">
        <h1>💬 Genel Sohbet</h1>
        <span className="chat-online">● Canli</span>
      </div>

      <div className="chat-messages">
        {globalMessages && globalMessages.length > 0 ? (
          globalMessages.map((msg, i) => (
            <div key={msg.id || i} className={`chat-msg ${msg.sender === authUser?.username ? 'mine' : ''}`}>
              <div className="chat-msg-avatar">{msg.avatar || '👤'}</div>
              <div className="chat-msg-content">
                <span className="chat-msg-sender">{msg.sender}</span>
                <p className="chat-msg-text">{msg.text}</p>
                <span className="chat-msg-time">{msg.time}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="chat-empty">
            <span>💬</span>
            <p>Henuz mesaj yok</p>
            <p>Ilk mesaji sen gonder!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSend}>
        <input
          type="text"
          value={localInput}
          onChange={(e) => setLocalInput(e.target.value)}
          placeholder={authUser ? "Mesajini yaz..." : "Giris yaparak mesaj gonder"}
          disabled={!authUser}
        />
        <button type="submit" disabled={!authUser || !localInput.trim()}>
          📤
        </button>
      </form>
    </div>
  );
};

export default ChatPage;

