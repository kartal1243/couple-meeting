import { useApp } from '../contexts/AppContext';
import Header from '../Room/Header';
import SearchBar from '../Room/SearchBar';
import Player from '../Room/Player';
import Controls from '../Room/Controls';
import Chat from '../Room/Chat';
import Playlist from '../Room/Playlist';
import VoiceChat from '../Room/VoiceChat';
import Tombala from '../Room/Tombala';
import { useState } from 'react';

export default function RoomPage() {
  const app = useApp();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const {
    roomName, roomId, currentTheme, isConnected, currentRoomInfo, showInstallBtn,
    handleInstallApp, setShowSettingsModal, setShowProfileModal, authUser, myAvatar, handleLeaveRoom,
    mediaType, mediaSrc, youtubeError, mediaMeta, ytPlayerRef, reactions,
    openYouTubeExternally, handleMediaEnd, handleYouTubeError, searchInput, setSearchInput,
    searchResults, isSearching, handleDirectPlay, handleOpenAddModal, handleSelectSearchResult,
    handlePlay, handlePause, sendReaction, sendAction, messages, mySocketId, username, chatInput,
    setChatInput, handleSendMessage, replyTo, setReplyTo, sidebarTab, setSidebarTab,
    playlist, categories, selectedCategory, setSelectedCategory, newCategoryInput,
    setNewCategoryInput, handleCreateCategory, playMode, handleModeChange, filteredPlaylist,
    handleSelectPlaylistItem, handleRemovePlaylistItem, cssVars, handleVideoUpload,
    toast, hostUserId, userId, roomTheme, socket, playbackSpeed, setPlaybackSpeed,
    messagesSearch, setMessagesSearch, filteredMessages, roomUsersList, pendingSyncRef
  } = app;

  const isHost = hostUserId === userId;

  const handleLeaveClick = () => {
    if (isHost) {
      setShowLeaveModal(true);
    } else {
      handleLeaveRoom();
    }
  };

  const handleCloseRoom = () => {
    if (socket) socket.emit('room_action', { roomId: app.roomId, type: 'ROOM_CLOSED', payload: { message: 'Oda yönetici tarafından kapatıldı.' } });
    handleLeaveRoom();
  };

  const themeColors = {
    default: { primary: '#00a884', bg: 'rgba(0,168,132,.04)' },
    purple: { primary: '#7c3aed', bg: 'rgba(124,58,237,.04)' },
    blue: { primary: '#2563eb', bg: 'rgba(37,99,235,.04)' },
    rose: { primary: '#e11d48', bg: 'rgba(225,29,72,.04)' },
    gold: { primary: '#d4a017', bg: 'rgba(212,160,23,.04)' },
    ocean: { primary: '#0891b2', bg: 'rgba(8,145,178,.04)' },
    emerald: { primary: '#059669', bg: 'rgba(5,150,105,.04)' },
    sunset: { primary: '#ea580c', bg: 'rgba(234,88,12,.04)' }
  };
  const chatTheme = themeColors[roomTheme] || themeColors.default;

  return (
    <div style={{ display: 'contents', ...cssVars }}>
      <style>{`
        .cm-room-root {
          display: grid;
          grid-template-rows: 60px 1fr;
          grid-template-columns: 1fr 380px;
          height: 100vh; width: 100vw; overflow: hidden;
          background: linear-gradient(180deg, #0a0e14 0%, #0f172a 50%, #0a0e14 100%);
        }
        .cm-room-header { grid-row: 1; grid-column: 1 / -1; }
        .cm-player-col {
          grid-row: 2; grid-column: 1;
          display: flex; flex-direction: column;
          min-height: 0; overflow: hidden; background: #000;
        }
        .cm-sidebar {
          grid-row: 2; grid-column: 2;
          display: flex; flex-direction: column;
          min-height: 0; overflow: hidden;
          border-left: 1px solid rgba(255,255,255,.06);
        }
        .cm-player-col > * { min-height: 0; }
        .cm-sidebar > * { min-height: 0; }
        @media (max-width: 900px) {
          .cm-room-root { grid-template-columns: 1fr; grid-template-rows: 52px 1fr auto; }
          .cm-sidebar { grid-row: 3; grid-column: 1; border-left: none; border-top: 1px solid rgba(255,255,255,.06); max-height: 45vh; overflow: hidden; }
        }
        @media (max-width: 480px) {
          .cm-room-root { grid-template-rows: 46px 1fr auto; }
        }
        @media (orientation: landscape) and (max-height: 500px) {
          .cm-room-root { grid-template-rows: 44px 1fr; grid-template-columns: 1fr 320px; }
          .cm-sidebar { grid-row: 2; grid-column: 2; }
        }
      `}</style>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(15,23,42,.95), rgba(30,41,59,.95))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,.1)',
          padding: '10px 20px', borderRadius: 14, zIndex: 99999,
          boxShadow: '0 10px 40px rgba(0,0,0,.5)',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'cmToastIn 0.3s ease'
        }}>
          <span style={{ fontSize: 16 }}>💬</span>
          <div>
            <span style={{ fontWeight: 800, color: chatTheme.primary, fontSize: 12 }}>{toast.sender}</span>
            <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 6 }}>{toast.msg}</span>
          </div>
          <style>{`@keyframes cmToastIn { from{opacity:0;transform:translateX(-50%) translateY(-20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }`}</style>
        </div>
      )}

      {/* Admin Leave Modal */}
      {showLeaveModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50000,
          background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14
        }}>
          <div style={{
            width: 'min(380px, 100%)',
            background: 'linear-gradient(180deg, rgba(15,23,42,.98), rgba(10,14,20,.98))',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 20, padding: 28, textAlign: 'center'
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚪</div>
            <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: 17, fontWeight: 900 }}>Odadan Ayrıl</h3>
            <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 20px' }}>Yönetici olarak odadan ayrılıyorsun. Ne yapmak istersin?</p>

            <button onClick={handleCloseRoom} style={{
              width: '100%', padding: '12px', marginBottom: 8, borderRadius: 12, border: 'none',
              background: 'rgba(239,68,68,.12)', color: '#ef4444',
              fontWeight: 800, fontSize: 13, cursor: 'pointer',
              border: '1px solid rgba(239,68,68,.2)'
            }}>
              🗑️ Odayı Kapat ve Çık
            </button>
            <button onClick={() => { setShowLeaveModal(false); handleLeaveRoom(); }} style={{
              width: '100%', padding: '12px', marginBottom: 8, borderRadius: 12, border: 'none',
              background: 'rgba(255,255,255,.05)', color: '#94a3b8',
              fontWeight: 800, fontSize: 13, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,.08)'
            }}>
              👋 Sadece Çık
            </button>
            <button onClick={() => setShowLeaveModal(false)} style={{
              width: '100%', padding: '10px', borderRadius: 12, border: 'none',
              background: 'transparent', color: '#475569',
              fontWeight: 700, fontSize: 12, cursor: 'pointer'
            }}>
              İptal
            </button>
          </div>
        </div>
      )}

      <div className="cm-room-root">
        <div className="cm-room-header">
          <Header
            roomName={roomName} currentTheme={currentTheme} isConnected={isConnected}
            currentRoomInfo={currentRoomInfo} showInstallBtn={showInstallBtn}
            handleInstallApp={handleInstallApp} setShowSettingsModal={setShowSettingsModal}
            setShowProfileModal={setShowProfileModal}
            authUser={authUser} myAvatar={myAvatar} handleLeaveRoom={handleLeaveClick}
          />
        </div>

        <div className="cm-player-col">
          <SearchBar
            searchInput={searchInput} setSearchInput={setSearchInput}
            searchResults={searchResults} isSearching={isSearching}
            currentTheme={currentTheme} handleDirectPlay={handleDirectPlay}
            handleOpenAddModal={handleOpenAddModal} handleSelectSearchResult={handleSelectSearchResult}
            handleVideoUpload={handleVideoUpload}
          />
          <Player
            mediaType={mediaType} mediaSrc={mediaSrc} youtubeError={youtubeError} mediaMeta={{ ...mediaMeta, roomId }}
            ytPlayerRef={ytPlayerRef} pendingSyncRef={pendingSyncRef} reactions={reactions}
            openYouTubeExternally={openYouTubeExternally}
            handleMediaEnd={handleMediaEnd} handleYouTubeError={handleYouTubeError}
            screenSharing={screenSharing} setScreenSharing={setScreenSharing}
            socket={socket} mySocketId={mySocketId} hostUserId={hostUserId} userId={userId}
          />
          <Controls currentTheme={currentTheme} handlePlay={handlePlay} handlePause={handlePause} sendReaction={sendReaction} sendAction={sendAction} playbackSpeed={playbackSpeed} setPlaybackSpeed={setPlaybackSpeed} ytPlayerRef={ytPlayerRef} voiceChat={<VoiceChat socket={socket} roomId={roomId} mySocketId={mySocketId} isMuted={isMuted} setIsMuted={setIsMuted} />}           />
        </div>

        <div className="cm-sidebar" style={{ background: chatTheme.bg }}>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(0,0,0,.3)', flexShrink: 0 }}>
            <button
              onClick={() => setSidebarTab('chat')}
              style={{
                flex: 1, padding: '12px 0', border: 'none',
                background: sidebarTab === 'chat' ? `${chatTheme.primary}18` : 'transparent',
                color: sidebarTab === 'chat' ? chatTheme.primary : '#64748b',
                fontWeight: 800, cursor: 'pointer', fontSize: 13,
                borderBottom: sidebarTab === 'chat' ? `2px solid ${chatTheme.primary}` : '2px solid transparent',
                transition: 'all 0.25s ease'
              }}
            >💬 Sohbet</button>
            <button
              onClick={() => setSidebarTab('playlist')}
              style={{
                flex: 1, padding: '12px 0', border: 'none',
                background: sidebarTab === 'playlist' ? `${chatTheme.primary}18` : 'transparent',
                color: sidebarTab === 'playlist' ? chatTheme.primary : '#64748b',
                fontWeight: 800, cursor: 'pointer', fontSize: 13,
                borderBottom: sidebarTab === 'playlist' ? `2px solid ${chatTheme.primary}` : '2px solid transparent',
                transition: 'all 0.25s ease'
              }}
            >📚 Kitaplık</button>
            <button
              onClick={() => setSidebarTab('tombala')}
              style={{
                padding: '12px 10px', border: 'none',
                background: sidebarTab === 'tombala' ? 'rgba(245,158,11,.12)' : 'transparent',
                color: sidebarTab === 'tombala' ? '#f59e0b' : '#64748b',
                fontWeight: 800, cursor: 'pointer', fontSize: 13,
                borderBottom: sidebarTab === 'tombala' ? '2px solid #f59e0b' : '2px solid transparent',
                transition: 'all 0.25s ease', whiteSpace: 'nowrap'
              }}
            >🎲</button>
          </div>

          {sidebarTab === 'chat' ? (
            <Chat messages={messages} mySocketId={mySocketId} username={authUser?.username || username} chatInput={chatInput} setChatInput={setChatInput} handleSendMessage={handleSendMessage} currentTheme={{ ...currentTheme, primary: chatTheme.primary }} replyTo={replyTo} setReplyTo={setReplyTo} messagesSearch={messagesSearch} setMessagesSearch={setMessagesSearch} filteredMessages={filteredMessages} />
          ) : sidebarTab === 'tombala' ? (
            <Tombala socket={socket} roomId={roomId} mySocketId={mySocketId} userId={userId} hostUserId={hostUserId} roomUsersList={roomUsersList} />
          ) : (
            <Playlist
              categories={categories} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
              newCategoryInput={newCategoryInput} setNewCategoryInput={setNewCategoryInput}
              handleCreateCategory={handleCreateCategory} playMode={playMode}
              handleModeChange={handleModeChange} filteredPlaylist={filteredPlaylist}
              mediaSrc={mediaSrc} handleSelectPlaylistItem={handleSelectPlaylistItem}
              handleRemovePlaylistItem={handleRemovePlaylistItem} currentTheme={currentTheme}
            />
          )}
        </div>
      </div>
    </div>
  );
}
