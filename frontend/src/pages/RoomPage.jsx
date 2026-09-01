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
    <div style={{ display: 'contents', ...cssVars }}>
      <style>{`
        .cm-room-root {
          display: grid;
          grid-template-rows: 60px 1fr;
          grid-template-columns: 1fr 380px;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background: linear-gradient(180deg, #0a0e14 0%, #0f172a 50%, #0a0e14 100%);
        }
        .cm-room-header { grid-row: 1; grid-column: 1 / -1; }
        .cm-player-col {
          grid-row: 2; grid-column: 1;
          display: flex; flex-direction: column;
          min-height: 0; overflow: hidden;
          background: #000;
        }
        .cm-sidebar {
          grid-row: 2; grid-column: 2;
          display: flex; flex-direction: column;
          min-height: 0; overflow: hidden;
          border-left: 1px solid rgba(255,255,255,.06);
          background: linear-gradient(180deg, rgba(15,23,42,.98), rgba(15,20,30,.98));
        }
        .cm-player-col > * { min-height: 0; }
        .cm-sidebar > * { min-height: 0; }
        @media (max-width: 900px) {
          .cm-room-root {
            grid-template-columns: 1fr;
            grid-template-rows: 60px 1fr 1fr;
          }
          .cm-sidebar { grid-row: 3; grid-column: 1; border-left: none; border-top: 1px solid rgba(255,255,255,.06); }
        }
      `}</style>

      <div className="cm-room-root">
        <div className="cm-room-header">
          <Header
            roomName={roomName} currentTheme={currentTheme} isConnected={isConnected}
            currentRoomInfo={currentRoomInfo} showInstallBtn={showInstallBtn}
            handleInstallApp={handleInstallApp} setShowSettingsModal={setShowSettingsModal}
            authUser={authUser} myAvatar={myAvatar} handleLeaveRoom={handleLeaveRoom}
          />
        </div>

        <div className="cm-player-col">
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

        <div className="cm-sidebar">
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(0,0,0,.3)', flexShrink: 0 }}>
            <button
              onClick={() => setSidebarTab('chat')}
              style={{
                flex: 1, padding: '12px 0', border: 'none',
                background: sidebarTab === 'chat' ? 'linear-gradient(135deg, rgba(124,58,237,.12), rgba(236,72,153,.08))' : 'transparent',
                color: sidebarTab === 'chat' ? '#a855f7' : '#64748b',
                fontWeight: 800, cursor: 'pointer', fontSize: 13,
                borderBottom: sidebarTab === 'chat' ? '2px solid #7c3aed' : '2px solid transparent',
                transition: 'all 0.25s ease'
              }}
            >
              💬 Sohbet
            </button>
            <button
              onClick={() => setSidebarTab('playlist')}
              style={{
                flex: 1, padding: '12px 0', border: 'none',
                background: sidebarTab === 'playlist' ? 'linear-gradient(135deg, rgba(124,58,237,.12), rgba(236,72,153,.08))' : 'transparent',
                color: sidebarTab === 'playlist' ? '#a855f7' : '#64748b',
                fontWeight: 800, cursor: 'pointer', fontSize: 13,
                borderBottom: sidebarTab === 'playlist' ? '2px solid #7c3aed' : '2px solid transparent',
                transition: 'all 0.25s ease'
              }}
            >
              📚 Kitaplık {playlist && playlist.length > 0 && <span style={{ background: 'rgba(124,58,237,.2)', color: '#a855f7', padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 900, marginLeft: 4 }}>{playlist.length}</span>}
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
