import { memo } from 'react';

const UsersTab = memo(function UsersTab({ users, userSearch, setUserSearch, filteredUsers, setSelectedUser, setShowUserModal, showUserModal, selectedUser, userDetail, fetchUserDetail, resetPassword, changeEmail, freezeAccount, setVip, toggleBan, deleteUser, showToast, vipPlan, setVipPlan, vipDays, setVipDays, formatTime }) {
  return (
    <div style={{ animation: 'fadeIn .4s ease-out' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input type="text" placeholder="🔍 Kullanıcı ara..." value={userSearch} onChange={e => setUserSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: '10px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
            color: '#e2e8f0', fontSize: 13, outline: 'none'
          }} />
        <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center' }}>
          {filteredUsers.length} / {users.length} kullanıcı
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredUsers.map((u, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,.02)', padding: '16px 20px', borderRadius: 14,
            border: u.isBanned ? '1px solid rgba(239,68,68,.2)' : '1px solid rgba(255,255,255,.05)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
            cursor: 'pointer'
          }} className="admin-card" onClick={() => { setSelectedUser(u); setShowUserModal(true); }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 26 }}>{u.avatar}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{u.username}</span>
                  {u.frozen && <span style={{ fontSize: 9, background: 'rgba(239,68,68,.12)', color: '#ef4444', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>❄️ Dondurulmuş</span>}
                  {u.isVip && <span style={{ fontSize: 9, background: 'rgba(234,179,8,.12)', color: '#eab308', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>👑 {u.vipPlan}</span>}
                  {u.isBanned && <span style={{ fontSize: 9, background: 'rgba(239,68,68,.12)', color: '#ef4444', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>🚫 BANNED</span>}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{u.email || 'Email yok'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={(e) => { e.stopPropagation(); setVip(u.username, !u.isVip); }} className="admin-action"
                style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: u.isVip ? 'rgba(234,179,8,.12)' : 'rgba(255,255,255,.05)', color: u.isVip ? '#eab308' : '#64748b', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>
                {u.isVip ? '👑 Kaldır' : '⭐ VIP Ver'}
              </button>
              <button onClick={(e) => { e.stopPropagation(); toggleBan(u.username, u.isBanned); }} className="admin-action"
                style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: u.isBanned ? 'rgba(0,168,132,.12)' : 'rgba(239,68,68,.12)', color: u.isBanned ? '#00a884' : '#ef4444', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>
                {u.isBanned ? '✅ Unban' : '🚫 Ban'}
              </button>
              <button onClick={(e) => { e.stopPropagation(); fetchUserDetail(u.username); }} className="admin-action"
                style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'rgba(59,130,246,.12)', color: '#3b82f6', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>
                📋 Detay
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
          onClick={() => setShowUserModal(false)}>
          <div style={{ background: 'rgba(15,23,42,.98)', borderRadius: 20, padding: 28, width: 'min(440px, 92%)', border: '1px solid rgba(255,255,255,.08)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 36 }}>{selectedUser.avatar}</span>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{selectedUser.username}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>{selectedUser.email}</div>
                </div>
              </div>
              <button onClick={() => setShowUserModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: 12 }}>
                <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>Kayıt</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{formatTime(selectedUser.createdAt)}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: 12 }}>
                <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>Son Görülme</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{formatTime(selectedUser.lastSeen)}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: 12 }}>
                <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>VIP</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{selectedUser.isVip ? `👑 ${selectedUser.vipPlan}` : 'Yok'}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: 12 }}>
                <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>Durum</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: selectedUser.isBanned ? '#ef4444' : '#00a884' }}>{selectedUser.isBanned ? '🚫 Banned' : '✅ Aktif'}</div>
              </div>
            </div>

            <div style={{ background: 'rgba(234,179,8,.04)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#eab308', marginBottom: 10 }}>👑 VIP Ayarları</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <select value={vipPlan} onChange={e => setVipPlan(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: '#0f172a', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', fontSize: 12 }}>
                  <option value="monthly">Aylık</option>
                  <option value="yearly">Yıllık</option>
                  <option value="lifetime">Ömür Boyu</option>
                </select>
                <input type="number" value={vipDays} onChange={e => setVipDays(e.target.value)}
                  style={{ width: 70, padding: '8px 10px', borderRadius: 8, background: '#0f172a', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', fontSize: 12 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setVip(selectedUser.username, true)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #eab308, #f59e0b)', color: '#000', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>👑 VIP Ver</button>
                <button onClick={() => setVip(selectedUser.username, false)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid rgba(234,179,8,.3)', background: 'transparent', color: '#eab308', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>Kaldır</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => toggleBan(selectedUser.username, selectedUser.isBanned)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: selectedUser.isBanned ? 'rgba(0,168,132,.15)' : 'rgba(239,68,68,.15)', color: selectedUser.isBanned ? '#00a884' : '#ef4444', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                {selectedUser.isBanned ? '✅ Unban' : '🚫 Ban'}
              </button>
              <button onClick={() => deleteUser(selectedUser.username)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: 'rgba(239,68,68,.2)', color: '#ef4444', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                🗑️ Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default UsersTab;
