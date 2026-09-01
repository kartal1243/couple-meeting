import { useApp } from '../contexts/AppContext';
import { useEffect, useState, useMemo } from 'react';
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
    mediaType, mediaSrc, youtubeError, mediaMeta, ytPlayerRef, reactions, musicAudioRef,
    openYouTubeExternally, handleMediaEnd, handleYouTubeError, searchInput, setSearchInput,
    searchResults, isSearching, handleDirectPlay, handleOpenAddModal, handleSelectSearchResult,
    handlePlay, handlePause, sendReaction, messages, mySocketId, username, chatInput,
    setChatInput, handleSendMessage, replyTo, setReplyTo, sidebarTab, setSidebarTab,
    playlist, categories, selectedCategory, setSelectedCategory, newCategoryInput,
    setNewCategoryInput, handleCreateCategory, playMode, handleModeChange, filteredPlaylist,
    handleSelectPlaylistItem, handleRemovePlaylistItem, cssVars
  } = app;

  return (
    <div style={{ ...app.styles?.app, display: 'flex', flexDirection: 'column', background: '#0b141a', ...cssVars }}>
      <Header
        roomName={roomName} currentTheme={currentTheme} isConnected={isConnected}
        currentRoomInfo={currentRoomInfo} showInstallBtn={showInstallBtn}
        handleInstallApp={handleInstallApp} setShowSettingsModal={setShowSettingsModal}
        authUser={authUser} myAvatar={myAvatar} handleLeaveRoom={handleLeaveRoom}
      />

      <div className="cm-room-layout" style={{ flex: 1, display: 'flex', width: '100%', height: 'calc(100dvh - 60px)', overflow: 'hidden' }}>
        <div className="cm-player-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000', position: 'relative' }}>
          <SearchBar
            searchInput={searchInput} setSearchInput={setSearchInput}
            searchResults={searchResults} isSearching={isSearching}
            currentTheme={currentTheme} handleDirectPlay={handleDirectPlay}
            handleOpenAddModal={handleOpenAddModal} handleSelectSearchResult={handleSelectSearchResult}
          />
          <Player
            mediaType={mediaType} mediaSrc={mediaSrc} youtubeError={youtubeError} mediaMeta={mediaMeta}
            ytPlayerRef={ytPlayerRef} reactions={reactions} musicAudioRef={musicAudioRef}
            openYouTubeExternally={openYouTubeExternally}
            handleMediaEnd={handleMediaEnd} handleYouTubeError={handleYouTubeError}
          />
          <Controls currentTheme={currentTheme} handlePlay={handlePlay} handlePause={handlePause} sendReaction={sendReaction} />
        </div>

        <div className="cm-sidebar" style={{ width: '380px', maxWidth: '100%', background: currentTheme.cardBg, borderLeft: '1px solid #222d34', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #222d34', background: '#0b141a' }}>
            <button onClick={() => setSidebarTab('chat')} style={{ flex: 1, padding: '12px', border: 'none', background: sidebarTab === 'chat' ? currentTheme.cardBg : 'transparent', color: sidebarTab === 'chat' ? currentTheme.primary : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>💬 Sohbet</button>
            <button onClick={() => setSidebarTab('playlist')} style={{ flex: 1, padding: '12px', border: 'none', background: sidebarTab === 'playlist' ? currentTheme.cardBg : 'transparent', color: sidebarTab === 'playlist' ? currentTheme.primary : '#8696a0', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>📚 Kitaplik ({playlist ? playlist.length : 0})</button>
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
