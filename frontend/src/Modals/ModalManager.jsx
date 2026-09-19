import React from 'react';
import AuthModal from './AuthModal';
import SocialModal from './SocialModal';
import VipModal from './VipModal';
import ProfileModal from './ProfileModal';
import FolderModal from './FolderModal';
import SettingsModal from './SettingsModal';
import QuickCreateModal from './QuickCreateModal';
import JoinRoomModal from './JoinRoomModal';

function ModalManager(props) {
  const {
    showAuthModal,
    showSocialModal,
    showVipModal,
    showQuickCreate,
    showProfileModal,
    showFolderModal,
    showSettingsModal,
    showJoinModal,
    joinRoomTarget
  } = props;

  return (
    <>
      {showAuthModal && (
        <AuthModal
          authMode={props.authMode}
          setAuthMode={props.setAuthMode}
          authForm={props.authForm}
          setAuthForm={props.setAuthForm}
          authBusy={props.authBusy}
          submitAuth={props.submitAuth}
          setShowAuthModal={props.setShowAuthModal}
          errorMessage={props.errorMessage}
          setErrorMessage={props.setErrorMessage}
          styles={props.styles}
          socket={props.socket}
        />
      )}

      {showSocialModal && (
        <SocialModal
          authUser={props.authUser}
          socialTab={props.socialTab}
          setSocialTab={props.setSocialTab}
          globalMessages={props.globalMessages}
          globalChatInput={props.globalChatInput}
          setGlobalChatInput={props.setGlobalChatInput}
          sendGlobalMessage={props.sendGlobalMessage}
          friendSearch={props.friendSearch}
          setFriendSearch={props.setFriendSearch}
          searchFriends={props.searchFriends}
          friendSearchResults={props.friendSearchResults}
          sendFriendRequest={props.sendFriendRequest}
          friendRequests={props.friendRequests}
          respondFriendRequest={props.respondFriendRequest}
          friends={props.friends}
          friendOnlineStatuses={props.friendOnlineStatuses}
          unfriendUser={props.unfriendUser}
          profileBioInput={props.profileBioInput}
          setProfileBioInput={props.setProfileBioInput}
          profileStatusInput={props.profileStatusInput}
          setProfileStatusInput={props.setProfileStatusInput}
          myAvatar={props.myAvatar}
          setMyAvatar={props.setMyAvatar}
          saveProfile={props.saveProfile}
          openAuth={props.openAuth}
          handleLogout={props.handleLogout}
          setShowSocialModal={props.setShowSocialModal}
          showVipModal={props.showVipModal}
          setShowVipModal={props.setShowVipModal}
          styles={props.styles}
          dmConversations={props.dmConversations}
          dmActiveChat={props.dmActiveChat}
          setDmActiveChat={props.setDmActiveChat}
          dmMessages={props.dmMessages}
          dmInput={props.dmInput}
          setDmInput={props.setDmInput}
          sendDm={props.sendDm}
          openDm={props.openDm}
          loadDmList={props.loadDmList}
          chatGroups={props.chatGroups}
          activeGroup={props.activeGroup}
          setActiveGroup={props.setActiveGroup}
          groupMessages={props.groupMessages}
          groupInput={props.groupInput}
          setGroupInput={props.setGroupInput}
          showGroupCreate={props.showGroupCreate}
          setShowGroupCreate={props.setShowGroupCreate}
          groupNameInput={props.groupNameInput}
          setGroupNameInput={props.setGroupNameInput}
          groupMemberInput={props.groupMemberInput}
          setGroupMemberInput={props.setGroupMemberInput}
          createGroup={props.createGroup}
          openGroup={props.openGroup}
          sendGroupMessage={props.sendGroupMessage}
          loadGroups={props.loadGroups}
          typingUsers={props.typingUsers}
          sendDmTyping={props.sendDmTyping}
          sendDmStopTyping={props.sendDmStopTyping}
          followUser={props.followUser}
          unfollowUser={props.unfollowUser}
          loadFollowCounts={props.loadFollowCounts}
          loadFollowers={props.loadFollowers}
          loadFollowing={props.loadFollowing}
          followCounts={props.followCounts}
          isFollowingUser={props.isFollowingUser}
          followersList={props.followersList}
          followingList={props.followingList}
          showFollowersModal={props.showFollowersModal}
          setShowFollowersModal={props.setShowFollowersModal}
          showFollowingModal={props.showFollowingModal}
          setShowFollowingModal={props.setShowFollowingModal}
          feedItems={props.feedItems}
          loadFeed={props.loadFeed}
          showFeedModal={props.showFeedModal}
          setShowFeedModal={props.setShowFeedModal}
          suggestedFollows={props.suggestedFollows}
          loadSuggestedFollows={props.loadSuggestedFollows}
          createFeedPost={props.createFeedPost}
          likeFeedPost={props.likeFeedPost}
          commentFeedPost={props.commentFeedPost}
          notifications={props.notifications}
          unreadCount={props.unreadCount}
          loadNotifications={props.loadNotifications}
          markNotifsRead={props.markNotifsRead}
          showNotifPanel={props.showNotifPanel}
          setShowNotifPanel={props.setShowNotifPanel}
          myRole={props.myRole}
          reportUser={props.reportUser}
          showVerifyModal={props.showVerifyModal}
          setShowVerifyModal={props.setShowVerifyModal}
          verifyCode={props.verifyCode}
          setVerifyCode={props.setVerifyCode}
          verifySent={props.verifySent}
          setVerifySent={props.setVerifySent}
          sendVerificationEmail={props.sendVerificationEmail}
          verifyEmailCode={props.verifyEmailCode}
          show2FAModal={props.show2FAModal}
          setShow2FAModal={props.setShow2FAModal}
          twoFAEnabled={props.twoFAEnabled}
          setup2FA={props.setup2FA}
          disable2FA={props.disable2FA}
          twoFASecret={props.twoFASecret}
          twoFAQR={props.twoFAQR}
          twoFACode={props.twoFACode}
          setTwoFACode={props.setTwoFACode}
          verify2FASetup={props.verify2FASetup}
          showDeleteAccount={props.showDeleteAccount}
          setShowDeleteAccount={props.setShowDeleteAccount}
          deleteAccount={props.deleteAccount}
          deletePass={props.deletePass}
          setDeletePass={props.setDeletePass}
        />
      )}

      {showVipModal && (
        <VipModal
          authUser={props.authUser}
          setShowVipModal={props.setShowVipModal}
          setAuthUser={props.setAuthUser}
          styles={props.styles}
        />
      )}

      <QuickCreateModal
        showQuickCreate={showQuickCreate}
        setShowQuickCreate={props.setShowQuickCreate}
        quickRoomName={props.quickRoomName}
        setQuickRoomName={props.setQuickRoomName}
        quickRoomPass={props.quickRoomPass}
        setQuickRoomPass={props.setQuickRoomPass}
        quickMaxUsers={props.quickMaxUsers}
        setQuickMaxUsers={props.setQuickMaxUsers}
        handleQuickCreateSubmit={props.handleQuickCreateSubmit}
      />

      {showProfileModal && (
        <ProfileModal
          authUser={props.authUser}
          setShowProfileModal={props.setShowProfileModal}
          saveProfile={props.saveProfile}
          friendOnlineStatuses={props.friendOnlineStatuses}
          friends={props.friends}
        />
      )}

      {showFolderModal && (
        <FolderModal
          pendingMediaItem={props.pendingMediaItem}
          modalTargetCategory={props.modalTargetCategory}
          setModalTargetCategory={props.setModalTargetCategory}
          categories={props.categories}
          confirmAddToPlaylist={props.confirmAddToPlaylist}
          setShowFolderModal={props.setShowFolderModal}
          currentTheme={props.currentTheme}
          styles={props.styles}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          hostUserId={props.hostUserId}
          userId={props.userId}
          editRoomNameInput={props.editRoomNameInput}
          setEditRoomNameInput={props.setEditRoomNameInput}
          roomName={props.roomName}
          roomTheme={props.roomTheme}
          setRoomTheme={props.setRoomTheme}
          handleSaveSettings={props.handleSaveSettings}
          roomUsersList={props.roomUsersList}
          handleTransferAdmin={props.handleTransferAdmin}
          handleKickUser={props.handleKickUser}
          setShowSettingsModal={props.setShowSettingsModal}
          currentTheme={props.currentTheme}
          authUser={props.authUser}
          styles={props.styles}
          socket={props.socket}
          roomId={props.roomId}
          currentRoomInfo={props.currentRoomInfo}
          username={props.username}
        />
      )}

      <JoinRoomModal
        showJoinModal={showJoinModal}
        setShowJoinModal={props.setShowJoinModal}
        joinRoomTarget={joinRoomTarget}
        setJoinRoomTarget={props.setJoinRoomTarget}
        joinModalPass={props.joinModalPass}
        setJoinModalPass={props.setJoinModalPass}
        joinModalError={props.joinModalError}
        setJoinModalError={props.setJoinModalError}
        handleJoinRoomFromModal={props.handleJoinRoomFromModal}
      />
    </>
  );
}

export default React.memo(ModalManager);
