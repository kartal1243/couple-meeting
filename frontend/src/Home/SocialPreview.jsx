export default function SocialPreview({ globalMessages, setShowSocialModal }) {
  return (
    <section className="cm-section">
      <div style={{
        padding: '28px', borderRadius: 24,
        background: 'linear-gradient(160deg,rgba(30,40,55,.8),rgba(12,20,32,.95))',
        border: '1px solid rgba(167,139,250,.12)',
        boxShadow: '0 20px 60px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.04)'
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', gap:20, flexWrap:'wrap' }}>
          <div style={{ minWidth:260 }}>
            <div style={{ color:'#a78bfa', fontSize:10, fontWeight:900, letterSpacing:1.5, marginBottom:8 }}>🌐 GLOBAL TOPLULUK</div>
            <div style={{ fontSize:24, color:'#fff', fontWeight:950, letterSpacing:-0.5, lineHeight:1.2, marginBottom:8 }}>
              Dünyanın her yerinden<br />insanlarla bağlantı kur.
            </div>
            <div style={{ color:'#7d8b97', fontSize:13, lineHeight:1.6, marginBottom:16 }}>
              Global sohbette konuş, arkadaş ekle,<br />yeni insanlarla tanış.
            </div>
            <button
              onClick={() => setShowSocialModal(true)}
              style={{
                display:'inline-flex', alignItems:'center', gap:8,
                padding:'10px 20px', borderRadius:12, border:'none',
                background:'linear-gradient(135deg,#7c3aed,#a855f7)',
                color:'#fff', fontSize:13, fontWeight:800, cursor:'pointer',
                boxShadow:'0 8px 25px rgba(124,58,237,.25)',
                transition:'all .2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 35px rgba(124,58,237,.35)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 25px rgba(124,58,237,.25)'; }}
            >
              Sohbete Gir
              <span style={{ fontSize:16 }}>→</span>
            </button>
          </div>
          <div style={{
            flex:1, minWidth:280, maxWidth:400,
            display:'flex', flexDirection:'column', gap:4,
            maxHeight:260, overflow:'hidden',
            borderRadius:16, background:'rgba(0,0,0,.35)',
            padding:12, border:'1px solid rgba(255,255,255,.04)'
          }}>
            {globalMessages.length > 0 ? (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px rgba(34,197,94,.4)', animation:'cmLivePulse 2s ease-in-out infinite' }} />
                  <span style={{ color:'#94a3b8', fontSize:11, fontWeight:800, letterSpacing:0.5 }}>CANLI SOHBET</span>
                  <span style={{ marginLeft:'auto', color:'#475569', fontSize:10 }}>{globalMessages.length} mesaj</span>
                </div>
                {globalMessages.slice(-5).reverse().map((m, i) => (
                  <div key={m.id || i} style={{
                    display:'flex', gap:10, alignItems:'flex-start',
                    padding:'8px 10px', borderRadius:12,
                    background: i === 0 ? 'rgba(255,255,255,.04)' : 'transparent',
                    transition:'background .2s'
                  }}>
                    <div style={{
                      fontSize:18, width:30, height:30, display:'grid', placeItems:'center',
                      background:'rgba(255,255,255,.05)', borderRadius:9, flexShrink:0
                    }}>{m.avatar || '🐱'}</div>
                    <div style={{ overflow:'hidden', flex:1 }}>
                      <div style={{ fontSize:11, color:'#e2e8f0', fontWeight:800, marginBottom:1 }}>{m.username || 'Misafir'}</div>
                      <div style={{ fontSize:12, color:'#64748b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.text}</div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ textAlign:'center', padding:'24px 12px', color:'#475569' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>💬</div>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>Henüz mesaj yok</div>
                <div style={{ fontSize:11 }}>İlk mesajı sen yaz!</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
