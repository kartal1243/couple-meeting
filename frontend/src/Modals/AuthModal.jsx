import { AVATARS } from '../constants';
import { useState, useEffect } from 'react';

export default function AuthModal({
  authMode, setAuthMode, authForm, setAuthForm, authBusy, submitAuth,
  setShowAuthModal, errorMessage, setErrorMessage, styles, socket
}) {
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [focused, setFocused] = useState('');
  const [animDir, setAnimDir] = useState('right');
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetStep, setResetStep] = useState(0);
  const [resetMessage, setResetMessage] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    setErrors({}); setStep(1);
  }, [authMode]);

  useEffect(() => {
    if (!socket) return;
    const onForgot = (data) => { setResetBusy(false); setResetMessage(data.message); if (data.ok && data.resetToken) { setResetToken(data.resetToken); setResetStep(2); } };
    const onReset = (data) => { setResetBusy(false); setResetMessage(data.message); if (data.ok) setTimeout(() => { setResetMode(false); setAuthMode('login'); }, 2000); };
    socket.on('forgot_result', onForgot);
    socket.on('reset_result', onReset);
    return () => { socket.off('forgot_result', onForgot); socket.off('reset_result', onReset); };
  }, [socket]);

  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (authMode === 'register' && (!authForm.username || authForm.username.trim().length < 3)) e.username = 'En az 3 karakter';
      else if (authMode === 'register' && !/^[a-z0-9_]{3,20}$/i.test(authForm.username.trim())) e.username = 'Sadece harf, sayı ve _';
      if (!authForm.email || !authForm.email.includes('@')) e.email = 'Geçerli bir e-posta gir';
    }
    if (step === 2) {
      if (!authForm.password || authForm.password.length < 6) e.password = 'En az 6 karakter';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setAnimDir('right');
    setStep(s => s + 1);
  };

  const prevStep = () => { setAnimDir('left'); setStep(s => s - 1); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (authMode === 'register' && step < 3) { nextStep(); return; }
    if (authMode === 'login' && step < 2) { nextStep(); return; }
    if (!validateStep()) return;
    submitAuth(e);
  };

  const inputStyle = (field) => ({
    width: '100%', padding: '14px 16px', borderRadius: 14, fontSize: 15,
    background: focused === field ? '#1a2a36' : '#111b21',
    border: errors[field] ? '2px solid #ea0038' : (focused === field ? '2px solid #00a884' : '2px solid #25313a'),
    color: '#e9edef', outline: 'none', transition: 'all 0.25s ease', boxSizing: 'border-box'
  });

  const renderStep = () => {
    if (authMode === 'register') {
      if (step === 1) return (
        <div key="reg1" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>✨</div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>Hadi başlayalım!</div>
            <div style={{ color: '#7f8c98', fontSize: 13, marginTop: 4 }}>Kullanıcı adı ve e-posta bilgilerini gir</div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#7f8c98', fontWeight: 800, marginBottom: 4, display: 'block' }}>KULLANICI ADI</label>
            <input placeholder="ornek_kullanici" value={authForm.username}
              onChange={(e) => { setAuthForm({ ...authForm, username: e.target.value }); setErrors({ ...errors, username: '' }); }}
              onFocus={() => setFocused('username')} onBlur={() => setFocused('')}
              style={inputStyle('username')} />
            {errors.username && <div style={{ color: '#ea0038', fontSize: 11, marginTop: 4, fontWeight: 700 }}>{errors.username}</div>}
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#7f8c98', fontWeight: 800, marginBottom: 4, display: 'block' }}>E-POSTA</label>
            <input type="email" placeholder="ornek@email.com" value={authForm.email}
              onChange={(e) => { setAuthForm({ ...authForm, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
              onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
              style={inputStyle('email')} />
            {errors.email && <div style={{ color: '#ea0038', fontSize: 11, marginTop: 4, fontWeight: 700 }}>{errors.email}</div>}
          </div>
        </div>
      );
      if (step === 2) return (
        <div key="reg2" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🔒</div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>Şifreni belirle</div>
            <div style={{ color: '#7f8c98', fontSize: 13, marginTop: 4 }}>En az 6 karakter olmalı</div>
          </div>
          <div>
            <input type="password" placeholder="••••••••" value={authForm.password}
              onChange={(e) => { setAuthForm({ ...authForm, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
              onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
              style={{ ...inputStyle('password'), fontSize: 22, letterSpacing: 6, textAlign: 'center' }} />
            {errors.password && <div style={{ color: '#ea0038', fontSize: 11, marginTop: 4, fontWeight: 700, textAlign: 'center' }}>{errors.password}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
            {[6, 8, 12, 16].map(len => (
              <div key={len} style={{
                padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800,
                background: authForm.password.length >= len ? '#00a884' : '#1a2634',
                color: authForm.password.length >= len ? '#fff' : '#63727d'
              }}>
                {authForm.password.length >= len ? '✓' : '○'} {len}+
              </div>
            ))}
          </div>
        </div>
      );
      if (step === 3) return (
        <div key="reg3" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🎨</div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>Profilini süsle</div>
            <div style={{ color: '#7f8c98', fontSize: 13, marginTop: 4 }}>Avatar seç ve kendini tanıtamazsın</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {AVATARS.map(a => (
              <button key={a} type="button" onClick={() => setAuthForm({ ...authForm, avatar: a })}
                style={{
                  width: 52, height: 52, borderRadius: 16, fontSize: 26, cursor: 'pointer',
                  background: authForm.avatar === a ? 'linear-gradient(135deg, #00a884, #008f6f)' : '#111b21',
                  border: authForm.avatar === a ? '2px solid #53e6bc' : '2px solid #25313a',
                  boxShadow: authForm.avatar === a ? '0 4px 15px rgba(0,168,132,0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}>
                {a}
              </button>
            ))}
          </div>
          <textarea placeholder="Kendini anlat (opsiyonel)" value={authForm.bio}
            onChange={(e) => setAuthForm({ ...authForm, bio: e.target.value })}
            style={{ ...inputStyle('bio'), minHeight: 70, resize: 'vertical', fontSize: 13 }} />
        </div>
      );
    } else {
      // LOGIN
      if (step === 1) return (
        <div key="login1" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>👋</div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>Tekrar hoş geldin!</div>
            <div style={{ color: '#7f8c98', fontSize: 13, marginTop: 4 }}>E-posta adresini gir</div>
          </div>
          <div>
            <input type="email" placeholder="ornek@email.com" value={authForm.email}
              onChange={(e) => { setAuthForm({ ...authForm, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
              onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
              style={inputStyle('email')} />
            {errors.email && <div style={{ color: '#ea0038', fontSize: 11, marginTop: 4, fontWeight: 700 }}>{errors.email}</div>}
          </div>
        </div>
      );
      if (step === 2) return (
        <div key="login2" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🔑</div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>Şifreni gir</div>
            <div style={{ color: '#7f8c98', fontSize: 13, marginTop: 4 }}>{authForm.email}</div>
          </div>
          <div>
            <input type="password" placeholder="••••••••" value={authForm.password}
              onChange={(e) => { setAuthForm({ ...authForm, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
              onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
              style={{ ...inputStyle('password'), fontSize: 22, letterSpacing: 6, textAlign: 'center' }} />
            {errors.password && <div style={{ color: '#ea0038', fontSize: 11, marginTop: 4, fontWeight: 700, textAlign: 'center' }}>{errors.password}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <button type="button" onClick={() => { setResetMode(true); setResetStep(1); setResetMessage(''); }}
              style={{ background: 'none', border: 'none', color: '#53e6bc', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
              🔑 Şifremi Unuttum
            </button>
          </div>
        </div>
      );
    }
  };

  const totalSteps = authMode === 'register' ? 3 : 2;
  const progress = (step / totalSteps) * 100;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 20000, background: 'rgba(0,0,0,.85)',
      backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18
    }}>
      <div style={{
        width: 'min(420px, 100%)', background: 'linear-gradient(180deg, #0f1a24 0%, #0a0f14 100%)',
        border: '1px solid #1e2d3a', borderRadius: 28, padding: '28px 24px', position: 'relative',
        boxShadow: '0 40px 120px rgba(0,0,0,.6), 0 0 80px rgba(0,168,132,.08)',
        maxHeight: '90vh', overflowY: 'auto'
      }}>

        {/* Forgot Password Mode */}
        {resetMode ? (
          <>
            <button type="button" onClick={() => { setResetMode(false); setResetStep(1); setResetMessage(''); }}
              style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,.06)', border: 'none', color: '#7f8c98', width: 32, height: 32, borderRadius: 10, cursor: 'pointer', fontSize: 13, display: 'grid', placeItems: 'center' }}>✕</button>

            {resetStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 44, marginBottom: 8 }}>🔐</div>
                <div style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>Şifremi Unuttum</div>
                <div style={{ color: '#7f8c98', fontSize: 13 }}>E-posta adresini gir, sana bir sıfırlama kodu gönderelim.</div>
                <input type="email" placeholder="ornek@email.com" value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 14, fontSize: 15, background: '#111b21', border: '2px solid #25313a', color: '#e9edef', outline: 'none', boxSizing: 'border-box' }} />
                {resetMessage && <div style={{ color: resetMessage.includes('✓') ? '#53e6bc' : '#ea0038', fontSize: 12, fontWeight: 800 }}>{resetMessage}</div>}
                <button onClick={() => {
                  if (!socket || !resetEmail) return;
                  setResetBusy(true);
                  socket.emit('auth_forgot_password', { email: resetEmail });
                }} disabled={resetBusy || !resetEmail} style={{
                  padding: '13px', borderRadius: 14, border: 'none',
                  background: resetBusy || !resetEmail ? '#1a2634' : 'linear-gradient(135deg, #00a884, #008f6f)',
                  color: '#fff', fontWeight: 900, fontSize: 14, cursor: resetBusy || !resetEmail ? 'not-allowed' : 'pointer',
                  opacity: resetBusy || !resetEmail ? 0.6 : 1
                }}>{resetBusy ? '⏳ Gönderiliyor...' : '📧 Sıfırlama Kodu Gönder'}</button>
              </div>
            )}

            {resetStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 44, marginBottom: 8 }}>✅</div>
                <div style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>Sıfırlama Kodu</div>
                <div style={{ color: '#7f8c98', fontSize: 13 }}>E-postana gönderilen kodu ve yeni şifreni gir.</div>
                <input placeholder="Sıfırlama kodu" value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 14, fontSize: 15, background: '#111b21', border: '2px solid #25313a', color: '#e9edef', outline: 'none', boxSizing: 'border-box', textAlign: 'center', letterSpacing: 2, fontWeight: 900 }} />
                <input type="password" placeholder="Yeni şifre (min 6 karakter)" value={resetNewPass}
                  onChange={(e) => setResetNewPass(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 14, fontSize: 15, background: '#111b21', border: '2px solid #25313a', color: '#e9edef', outline: 'none', boxSizing: 'border-box' }} />
                {resetMessage && <div style={{ color: resetMessage.includes('✓') || resetMessage.includes('başarıyla') ? '#53e6bc' : '#ea0038', fontSize: 12, fontWeight: 800 }}>{resetMessage}</div>}
                <button onClick={() => {
                  if (!socket) return;
                  setResetBusy(true);
                  socket.emit('auth_reset_password', { resetToken, newPassword: resetNewPass });
                }} disabled={resetBusy || !resetToken || resetNewPass.length < 6} style={{
                  padding: '13px', borderRadius: 14, border: 'none',
                  background: resetBusy || !resetToken || resetNewPass.length < 6 ? '#1a2634' : 'linear-gradient(135deg, #00a884, #008f6f)',
                  color: '#fff', fontWeight: 900, fontSize: 14, cursor: resetBusy ? 'not-allowed' : 'pointer'
                }}>{resetBusy ? '⏳ İşleniyor...' : '🔒 Şifreyi Sıfırla'}</button>
                <button type="button" onClick={() => setResetStep(1)} style={{ background: 'none', border: 'none', color: '#7f8c98', fontSize: 12, cursor: 'pointer' }}>← Geri</button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Progress bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '28px 28px 0 0', background: '#1a2634', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #00a884, #53e6bc)', transition: 'width 0.4s ease', borderRadius: 28 }} />
            </div>

            <button type="button" onClick={() => setShowAuthModal(false)}
              style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,.06)', border: 'none', color: '#7f8c98', width: 32, height: 32, borderRadius: 10, cursor: 'pointer', fontSize: 13, display: 'grid', placeItems: 'center' }}>✕</button>

            <div style={{ display: 'inline-flex', gap: 4, background: '#111b21', padding: 4, borderRadius: 10, marginBottom: 18 }}>
              <button type="button" onClick={() => { setAuthMode('login'); setStep(1); setErrors({}); }}
                style={{ padding: '7px 14px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', background: authMode === 'login' ? '#00a884' : 'transparent', color: authMode === 'login' ? '#fff' : '#7f8c98' }}>Giriş Yap</button>
              <button type="button" onClick={() => { setAuthMode('register'); setStep(1); setErrors({}); }}
                style={{ padding: '7px 14px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', background: authMode === 'register' ? '#00a884' : 'transparent', color: authMode === 'register' ? '#fff' : '#7f8c98' }}>Kayıt Ol</button>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 20, justifyContent: 'center' }}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} style={{ width: i + 1 === step ? 24 : 8, height: 8, borderRadius: 4, background: i + 1 <= step ? '#00a884' : '#1a2634', transition: 'all 0.3s ease' }} />
              ))}
            </div>

            {errorMessage && (
              <div style={{ background: 'rgba(234,0,56,.12)', border: '1px solid rgba(234,0,56,.3)', color: '#ff6b81', padding: '10px 14px', borderRadius: 12, fontWeight: 800, fontSize: 12, marginBottom: 14, textAlign: 'center' }}>{errorMessage}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {renderStep()}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {step > 1 && (
                  <button type="button" onClick={prevStep}
                    style={{ flex: 1, padding: '13px', borderRadius: 14, border: '2px solid #25313a', background: 'transparent', color: '#7f8c98', fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>← Geri</button>
                )}
                <button type="submit" disabled={authBusy}
                  style={{ flex: 1, padding: '13px', borderRadius: 14, border: 'none', background: authBusy ? '#1a2634' : 'linear-gradient(135deg, #00a884, #008f6f)', color: '#fff', fontWeight: 900, fontSize: 14, cursor: authBusy ? 'not-allowed' : 'pointer', opacity: authBusy ? 0.6 : 1 }}>
                  {authBusy ? '⏳ İşleniyor...' : ((authMode === 'register' && step === 3) ? '✨ Hesabı Oluştur' : (authMode === 'login' && step === 2) ? '🚀 Giriş Yap' : 'Devam →')}
                </button>
              </div>
            </form>

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#63727d' }}>
              {authMode === 'register' ? (
                <>Zaten hesabın var mı?{' '}
                  <button type="button" onClick={() => { setAuthMode('login'); setStep(1); setErrors({}); setErrorMessage(''); }}
                    style={{ background: 'none', border: 'none', color: '#53e6bc', fontWeight: 900, cursor: 'pointer' }}>Giriş yap</button>
                </>
              ) : (
                <>Hesabın yok mu?{' '}
                  <button type="button" onClick={() => { setAuthMode('register'); setStep(1); setErrors({}); setErrorMessage(''); }}
                    style={{ background: 'none', border: 'none', color: '#53e6bc', fontWeight: 900, cursor: 'pointer' }}>Kayıt ol</button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
