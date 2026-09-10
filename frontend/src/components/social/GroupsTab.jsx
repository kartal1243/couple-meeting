import { memo } from 'react';

const GroupsTab = memo(function GroupsTab({ authUser, chatGroups, openGroup, setShowGroupCreate, showGroupCreate, groupNameInput, setGroupNameInput, groupMemberInput, setGroupMemberInput, friends, createGroup }) {
  return (
    <div style={{ padding: 14, overflowY: 'auto', flex: 1 }}>
      {!authUser ? (
        <div style={{ padding: 30, textAlign: 'center', color: '#7f8c98' }}>Grup sohbeti icin hesap acmalisin.</div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>Grup Sohbeti</div>
            <button onClick={() => setShowGroupCreate(true)} style={{ background: '#00a884', color: '#fff', border: 'none', padding: '7px 12px', borderRadius: 10, fontWeight: 900, cursor: 'pointer', fontSize: 11 }}>+ Yeni Grup</button>
          </div>
          {showGroupCreate && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 20000, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowGroupCreate(false)}>
              <div className="cm-social-group-create-box" style={{ width: '100%', maxWidth: 420, background: '#111827', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>Yeni Grup Olustur</h3>
                    <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>Arkadaslarini ekle, sohbete basla</p>
                  </div>
                  <button onClick={() => setShowGroupCreate(false)} style={{ background: 'rgba(255,255,255,.06)', border: 'none', color: '#94a3b8', fontSize: 16, width: 32, height: 32, borderRadius: 8, cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Grup Adi</label>
                    <input value={groupNameInput} onChange={(e) => setGroupNameInput(e.target.value)} placeholder="orn: Oyun Ekibi, Film Gecesi..." maxLength={30} style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '11px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                      Uye Ekle {groupMemberInput ? <span style={{ color: '#00a884' }}>({groupMemberInput.split(',').filter(m => m.trim()).length} secildi)</span> : ''}
                    </label>
                    <input value={groupMemberInput} onChange={(e) => setGroupMemberInput(e.target.value)} placeholder="Kullanici adlarini virgulle ayir" style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '11px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  {friends && friends.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>Arkadaslarindan Sec</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto', padding: '4px 0' }}>
                        {friends.map(f => {
                          const isSelected = groupMemberInput.split(',').map(s => s.trim().toLowerCase()).includes(f.username.toLowerCase());
                          return (
                            <button key={f.username} type="button" onClick={() => {
                              const current = groupMemberInput.split(',').map(s => s.trim()).filter(Boolean);
                              if (isSelected) setGroupMemberInput(current.filter(u => u.toLowerCase() !== f.username.toLowerCase()).join(', '));
                              else setGroupMemberInput([...current, f.username].join(', '));
                            }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: isSelected ? 'rgba(0,168,132,.15)' : 'rgba(255,255,255,.04)', border: `1px solid ${isSelected ? 'rgba(0,168,132,.4)' : 'rgba(255,255,255,.06)'}`, borderRadius: 20, cursor: 'pointer', color: isSelected ? '#00a884' : '#94a3b8', fontSize: 12, fontWeight: 700, transition: 'all .15s' }}>
                              <span style={{ fontSize: 16 }}>{f.avatar || '🐱'}</span>{f.username}{isSelected && <span style={{ fontSize: 10 }}>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button onClick={() => setShowGroupCreate(false)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 10, color: '#94a3b8', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Iptal</button>
                    <button onClick={() => { createGroup(); setShowGroupCreate(false); }} disabled={!groupNameInput.trim()} style={{ flex: 2, padding: '12px', background: groupNameInput.trim() ? 'linear-gradient(135deg, #00a884, #008f6f)' : 'rgba(0,168,132,.2)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 900, fontSize: 13, cursor: groupNameInput.trim() ? 'pointer' : 'not-allowed' }}>Grup Olustur</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {chatGroups.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#7f8c98' }}>Henuz grubun yok. Yeni bir grup olustur!</div>
          ) : chatGroups.map(g => (
            <div key={g.id} onClick={() => openGroup(g.id)} className="cm-social-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#111b21', borderRadius: 12, marginBottom: 7, cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#1a2634'} onMouseLeave={(e) => e.currentTarget.style.background = '#111b21'}>
              <div style={{ fontSize: 24 }}>👥</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>{g.name}</div>
                <div style={{ color: '#7f8c98', fontSize: 11 }}>{g.members?.length || 0} uye{g.lastMessage ? ` • ${g.lastMessage.text}` : ''}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
});

export default GroupsTab;
