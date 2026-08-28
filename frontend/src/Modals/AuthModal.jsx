import { AVATARS } from '../constants';
import { useState } from 'react';

export default function AuthModal({
  authMode, setAuthMode, authForm, setAuthForm, authBusy, submitAuth, setShowAuthModal, styles
}) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (authMode === 'register') {
      if (!authForm.username || authForm.username.trim().length < 3) e.username = 'En az 3 karakter';
      else if (!/^[a-z0-9_]{3,20}$/i.test(authForm.username.trim())) e.username = 'Sadece harf, sayı ve _';
    }
    if (!authForm.email || !authForm.email.includes('@')) e.email = 'Geçerli bir e-posta gir';
    if (!authForm.password || authForm.password.length < 6) e.password = 'En az 6 karakter';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    submitAuth(e);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 20000, background: 'rgba(0,0,0,.78)',
      backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18
    }}>
      <div style={{
        width: 'min(460px, 100%)', background: '#111b21', border: '1px solid #2a3942',
        borderRadius: 24, padding: 22, boxShadow: '0 35px 100px rgba(0,0,0,.5)', maxHeight: '90vh', overflowY: 'auto'
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
            style={{ background: '#202c33', border: 'none', color: '#fff', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', fontSize: 14 }}
          >
            ✕
          </button>
        </div>

        {errors.general && (
          <div style={{ background: '#ea0038', color: '#fff', padding: '10px 13px', borderRadius: 12, fontWeight: 800, fontSize: 12, marginTop: 14 }}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
          {authMode === 'register' && (
            <>
              <div>
                <input
                  placeholder="Kullanıcı adı"
                  value={authForm.username}
                  onChange={(e) => { setAuthForm({ ...authForm, username: e.target.value }); setErrors({ ...errors, username: '' }); }}
                  style={{ ...styles.input, ...(errors.username ? { border: '1px solid #ea0038' } : {}) }}
                />
                {errors.username && <div style={{ color: '#ea0038', fontSize: 11, marginTop: 4, fontWeight: 700 }}>{errors.username}</div>}
              </div>
              <div>
                <div style={{ color: '#8696a0', fontSize: 12, marginBottom: 8, fontWeight: 700 }}>Avatar seç</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {AVATARS.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAuthForm({ ...authForm, avatar: a })}
                      style={{
                        width: 44, height: 44, borderRadius: 12, fontSize: 22,
                        background: authForm.avatar === a ? '#00a884' : '#1a2634',
                        border: authForm.avatar === a ? '2px solid #53e6bc' : '1px solid #2a3942',
                        cursor: 'pointer', transition: 'all .15s'
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div>
            <input
              type="email"
              placeholder="E-posta"
              value={authForm.email}
              onChange={(e) => { setAuthForm({ ...authForm, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
              style={{ ...styles.input, ...(errors.email ? { border: '1px solid #ea0038' } : {}) }}
            />
            {errors.email && <div style={{ color: '#ea0038', fontSize: 11, marginTop: 4, fontWeight: 700 }}>{errors.email}</div>}
          </div>
          <div>
            <input
              type="password"
              placeholder="Şifre (en az 6 karakter)"
              value={authForm.password}
              onChange={(e) => { setAuthForm({ ...authForm, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
              style={{ ...styles.input, ...(errors.password ? { border: '1px solid #ea0038' } : {}) }}
            />
            {errors.password && <div style={{ color: '#ea0038', fontSize: 11, marginTop: 4, fontWeight: 700 }}>{errors.password}</div>}
          </div>
          {authMode === 'register' && (
            <textarea
              placeholder="Kendini anlat (opsiyonel)"
              value={authForm.bio}
              onChange={(e) => setAuthForm({ ...authForm, bio: e.target.value })}
              style={{ ...styles.input, minHeight: 70, resize: 'vertical' }}
            />
          )}
          <button
            type="submit"
            disabled={authBusy}
            style={{
              ...styles.buttonPrimary, width: '100%', marginTop: 4, padding: '13px 16px', fontSize: 14,
              opacity: authBusy ? 0.6 : 1, cursor: authBusy ? 'not-allowed' : 'pointer'
            }}
          >
            {authBusy ? '⏳ İşleniyor...' : (authMode === 'register' ? '✨ Hesabı Oluştur' : '🚀 Giriş Yap')}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14, fontSize: 12, color: '#778590' }}>
          {authMode === 'register' ? (
            <div>
              Zaten hesabın var mı?{' '}
              <button
                type="button"
                onClick={() => { setErrors({}); setAuthMode('login'); }}
                style={{ background: 'none', border: 'none', color: '#53e6bc', fontWeight: 900, cursor: 'pointer' }}
              >
                Giriş yap
              </button>
            </div>
          ) : (
            <div>
              Hesabın yok mu?{' '}
              <button
                type="button"
                onClick={() => { setErrors({}); setAuthMode('register'); }}
                style={{ background: 'none', border: 'none', color: '#53e6bc', fontWeight: 900, cursor: 'pointer' }}
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
