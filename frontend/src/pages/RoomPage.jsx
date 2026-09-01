import { useApp } from '../contexts/AppContext';
import Header from '../Room/Header';
import SearchBar from '../Room/SearchBar';
import Player from '../Room/Player';
import Controls from '../Room/Controls';
import Chat from '../Room/Chat';
import Playlist from '../Room/Playlist';

export default function RoomPage() {
  const app = useApp();
  const {
    roomName, currentTheme, isConnected, currentRoomInfo, showInstallBtn,
    handleInstallApp, setShowSettingsModal, authUser, myAvatar, handleLeaveRoom,
    mediaType, mediaSrc, youtubeError, mediaMeta, ytPlayerRef, reactions,
    openYouTubeExternally, handleMediaEnd, handleYouTubeError, searchInput, setSearchInput,
    searchResults, isSearching, handleDirectPlay, handleOpenAddModal, handleSelectSearchResult,
    handlePlay, handlePause, sendReaction, messages, mySocketId, username, chatInput,
    setChatInput, handleSendMessage, replyTo, setReplyTo, sidebarTab, setSidebarTab,
    playlist, categories, selectedCategory, setSelectedCategory, newCategoryInput,
    setNewCategoryInput, handleCreateCategory, playMode, handleModeChange, filteredPlaylist,
    handleSelectPlaylistItem, handleRemovePlaylistItem, cssVars
  } = app;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, #0a0e14 0%, #0f172a 50%, #0a0e14 100%)',
      minHeight: '100vh', ...cssVars
    }}>
      <style>{`
        @keyframes cmSidebarGlow { 0%,100%{box-shadow:inset 0 0 30px rgba(124,58,237,.03)} 50%{box-shadow:inset 0 0 30px rgba(124,58,237,.08)} }
        .cm-sidebar-tab-active { background: linear-gradient(135deg, rgba(124,58,237,.12), rgba(236,72,153,.08)) !important; border-bottom: 2px solid #7c3aed !important; }
        @media (max-width: 768px) {
          .cm-room-layout { flex-direction: column !important; }
          .cm-sidebar { width: 100% !important; height: 50vh !important; border-left: none !important; border-top: 1px solid rgba(255,255,255,.06) !important; }
          .cm-player-column { height: 50vh !important; }
        }
      `}</style>

      <Header
        roomName={roomName} currentTheme={currentTheme} isConnected={isConnected}
        currentRoomInfo={currentRoomInfo} showInstallBtn={showInstallBtn}
        handleInstallApp={handleInstallApp} setShowSettingsModal={setShowSettingsModal}
        authUser={authUser} myAvatar={myAvatar} handleLeaveRoom={handleLeaveRoom}
      />

      <div className="cm-room-layout" style={{
        flex: 1, display: 'flex', width: '100%',
        height: 'calc(100dvh - 60px)', overflow: 'hidden'
      }}>
        {/* Main Player Column */}
        <div className="cm-player-column" style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: '#000', position: 'relative'
        }}>
          <SearchBar
            searchInput={searchInput} setSearchInput={setSearchInput}
            searchResults={searchResults} isSearching={isSearching}
            currentTheme={currentTheme} handleDirectPlay={handleDirectPlay}
            handleOpenAddModal={handleOpenAddModal} handleSelectSearchResult={handleSelectSearchResult}
          />
          <Player
            mediaType={mediaType} mediaSrc={mediaSrc} youtubeError={youtubeError} mediaMeta={mediaMeta}
            ytPlayerRef={ytPlayerRef} reactions={reactions}
            openYouTubeExternally={openYouTubeExternally}
            handleMediaEnd={handleMediaEnd} handleYouTubeError={handleYouTubeError}
          />
          <Controls currentTheme={currentTheme} handlePlay={handlePlay} handlePause={handlePause} sendReaction={sendReaction} />
        </div>

        {/* Sidebar */}
        <div className="cm-sidebar" style={{
          width: 380, maxWidth: '100%',
          background: 'linear-gradient(180deg, rgba(15,23,42,.98), rgba(15,20,30,.98))',
          borderLeft: '1px solid rgba(255,255,255,.06)',
          display: 'flex', flexDirection: 'column',
          backdropFilter: 'blur(20px)',
          animation: 'cmSidebarGlow 6s ease-in-out infinite',
          overflow: 'hidden'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', borderBottom: '1px solid rgba(255,255,255,.06)',
            background: 'rgba(0,0,0,.3)'
          }}>
            <button
              onClick={() => setSidebarTab('chat')}
              style={{
                flex: 1, padding: '13px 0', border: 'none',
                background: sidebarTab === 'chat' ? 'linear-gradient(135deg, rgba(124,58,237,.12), rgba(236,72,153,.08))' : 'transparent',
                color: sidebarTab === 'chat' ? '#a855f7' : '#64748b',
                fontWeight: 800, cursor: 'pointer', fontSize: 13,
                borderBottom: sidebarTab === 'chat' ? '2px solid #7c3aed' : '2px solid transparent',
                transition: 'all 0.25s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              💬 Sohbet
            </button>
            <button
              onClick={() => setSidebarTab('playlist')}
              style={{
                flex: 1, padding: '13px 0', border: 'none',
                background: sidebarTab === 'playlist' ? 'linear-gradient(135deg, rgba(124,58,237,.12), rgba(236,72,153,.08))' : 'transparent',
                color: sidebarTab === 'playlist' ? '#a855f7' : '#64748b',
                fontWeight: 800, cursor: 'pointer', fontSize: 13,
                borderBottom: sidebarTab === 'playlist' ? '2px solid #7c3aed' : '2px solid transparent',
                transition: 'all 0.25s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              📚 Kitaplık
              {playlist && playlist.length > 0 && (
                <span style={{
                  background: 'rgba(124,58,237,.2)', color: '#a855f7',
                  padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 900
                }}>
                  {playlist.length}
                </span>
              )}
            </button>
          </div>

          {sidebarTab === 'chat' ? (
            <Chat messages={messages} mySocketId={mySocketId} username={authUser?.username || username} chatInput={chatInput} setChatInput={setChatInput} handleSendMessage={handleSendMessage} currentTheme={currentTheme} replyTo={replyTo} setReplyTo={setReplyTo} />
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
