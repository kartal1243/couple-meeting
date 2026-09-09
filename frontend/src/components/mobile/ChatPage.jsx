import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';

const ChatPage = () => {
  const {
    globalMessages, globalChatInput, setGlobalChatInput, sendGlobalMessage,
    authUser, openAuth
  } = useApp();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [globalMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!globalChatInput.trim()) return;
    sendGlobalMessage();
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
          value={globalChatInput}
          onChange={(e) => setGlobalChatInput(e.target.value)}
          placeholder={authUser ? "Mesajini yaz..." : "Giris yaparak mesaj gonder"}
          disabled={!authUser}
        />
        <button type="submit" disabled={!authUser || !globalChatInput.trim()}>
          📤
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
