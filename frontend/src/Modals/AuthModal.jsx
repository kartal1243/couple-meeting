import { AVATARS } from '../constants';

export default function AuthModal({
  authMode, setAuthMode, authForm, setAuthForm, authBusy, submitAuth, setShowAuthModal, styles
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 20000, background: 'rgba(0,0,0,.78)',
      backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18
    }}>
      <div style={{
        width: 'min(460px, 100%)', background: '#111b21', border: '1px solid #2a3942',
        borderRadius: 24, padding: 22, boxShadow: '0 35px 100px rgba(0,0,0,.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#53e6bc', fontSize: 11, fontWeight: 900 }}>
              {authMode === 'register' ? 'HESAP OLUŞTUR' : 'TEKRAR HOŞ GELDİN'}
            </div>
            <h3 style={{ margin: '6px 0 0', color: '#fff', fontSize: 24 }}>
              {authMode === 'register' ? 'Profilini yanında taşı' : 'Hesabına giriş yap'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAuthModal(false)}
            style={{ background: '#202c33', border: 'none', color: '#fff', width: 34, height: 34, borderRadius: 10 }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={submitAuth} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
          {authMode === 'register' && (
            <input
              placeholder="Kullanıcı adı"
              value={authForm.username}
              onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
              style={styles.input}
            />
          )}
          <input
            type="email"
            placeholder="E-posta"
            value={authForm.email}
            onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Şifre (en az 6 karakter)"
            value={authForm.password}
            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            style={styles.input}
          />
          {authMode === 'register' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea
                placeholder="Kendini anlat (opsiyonel)"
                value={authForm.bio}
                onChange={(e) => setAuthForm({ ...authForm, bio: e.target.value })}
                style={{ ...styles.input, minHeight: 80, resize: 'vertical' }}
              />
              <select
                value={authForm.avatar}
                onChange={(e) => setAuthForm({ ...authForm, avatar: e.target.value })}
                style={styles.input}
              >
                {AVATARS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          )}
          <button
            type="submit"
            disabled={authBusy}
            style={{ ...styles.buttonPrimary, width: '100%', marginTop: 4 }}
          >
            {authBusy ? 'İşleniyor...' : (authMode === 'register' ? 'Hesabı Oluştur ✨' : 'Giriş Yap 🚀')}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14, fontSize: 12, color: '#778590' }}>
          {authMode === 'register' ? (
            <div>
              Zaten hesabın var mı?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                style={{ background: 'none', border: 'none', color: '#53e6bc', fontWeight: 900 }}
              >
                Giriş yap
              </button>
            </div>
          ) : (
            <div>
              Hesabın yok mu?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                style={{ background: 'none', border: 'none', color: '#53e6bc', fontWeight: 900 }}
              >
                Kayıt ol
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
