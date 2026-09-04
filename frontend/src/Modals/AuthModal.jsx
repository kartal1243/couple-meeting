import { AVATARS } from '../constants';
import { useState, useEffect } from 'react';

export default function AuthModal({
  authMode, setAuthMode, authForm, setAuthForm, authBusy, submitAuth,
  setShowAuthModal, errorMessage, setErrorMessage, styles, socket
}) {
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [focused, setFocused] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetStep, setResetStep] = useState(0);
  const [resetMessage, setResetMessage] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => { setErrors({}); setStep(1); }, [authMode]);

  useEffect(() => {
    if (!socket) return;
    const onForgot = (d) => { setResetBusy(false); setResetMessage(d.message); if (d.ok && d.resetToken) { setResetToken(d.resetToken); setResetStep(2); } };
    const onReset = (d) => { setResetBusy(false); setResetMessage(d.message); if (d.ok) setTimeout(() => { setResetMode(false); setAuthMode('login'); }, 2000); };
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

  const nextStep = () => { if (!validateStep()) return; setStep(s => s + 1); };
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (authMode === 'register' && step < 3) { nextStep(); return; }
    if (authMode === 'login' && step < 2) { nextStep(); return; }
    if (!validateStep()) return;
    submitAuth(e);
  };

  const S = {
    overlay: { position: 'fixed', inset: 0, zIndex: 20000, background: 'linear-gradient(135deg, rgba(0,0,0,.92), rgba(10,14,20,.95))', backdropFilter: 'blur(30px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
    card: { width: 'min(440px, 100%)', background: 'linear-gradient(180deg, rgba(15,23,42,.98), rgba(8,12,18,.99))', border: '1px solid rgba(255,255,255,.06)', borderRadius: 28, padding: 0, position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,.6), 0 0 60px rgba(124,58,237,.06)', maxHeight: '92vh', overflow: 'hidden' },
    header: { padding: '36px 32px 24px', textAlign: 'center', background: 'linear-gradient(180deg, rgba(124,58,237,.06), transparent)', position: 'relative' },
    logo: { width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, #7c3aed, #ec4899)', display: 'inline-grid', placeItems: 'center', marginBottom: 16, boxShadow: '0 8px 32px rgba(124,58,237,.3)', border: '1px solid rgba(255,255,255,.1)' },
    title: { color: '#fff', fontSize: 22, fontWeight: 900, marginBottom: 4, letterSpacing: -0.3 },
    subtitle: { color: '#64748b', fontSize: 13, fontWeight: 500 },
    inputWrap: { position: 'relative', marginBottom: 4 },
    label: { fontSize: 11, color: '#64748b', fontWeight: 800, display: 'block', marginBottom: 6, letterSpacing: 0.5 },
    input: (field) => ({ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 14, fontSize: 15, background: focused === field ? 'rgba(124,58,237,.06)' : 'rgba(255,255,255,.03)', border: errors[field] ? '1.5px solid #ef4444' : (focused === field ? '1.5px solid #7c3aed' : '1.5px solid rgba(255,255,255,.06)'), color: '#e2e8f0', outline: 'none', transition: 'all 0.25s ease', boxSizing: 'border-box' }),
    icon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, opacity: .5, pointerEvents: 'none' },
    btnPrimary: { width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: authBusy ? 'rgba(124,58,237,.3)' : 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', fontWeight: 900, fontSize: 15, cursor: authBusy ? 'not-allowed' : 'pointer', boxShadow: '0 8px 32px rgba(124,58,237,.25)', transition: 'all 0.3s ease', letterSpacing: 0.3 },
    btnSecondary: { flex: 1, padding: '13px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,.06)', background: 'transparent', color: '#64748b', fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s ease' },
    close: { position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', color: '#64748b', width: 32, height: 32, borderRadius: 10, cursor: 'pointer', fontSize: 13, display: 'grid', placeItems: 'center', transition: 'all 0.2s' },
    error: { background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)', color: '#f87171', padding: '10px 14px', borderRadius: 12, fontWeight: 700, fontSize: 12, textAlign: 'center' },
    stepDot: (active, done) => ({ width: active ? 28 : 8, height: 8, borderRadius: 4, background: done ? '#7c3aed' : 'rgba(255,255,255,.06)', transition: 'all 0.4s ease' }),
    divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: '#374151', fontSize: 11, fontWeight: 700 },
    dividerLine: { flex: 1, height: 1, background: 'rgba(255,255,255,.06)' },
  };

  const renderStep = () => {
    if (authMode === 'register') {
      if (step === 1) return (
        <div key="r1" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={S.label}>KULLANICI ADI</label>
            <div style={S.inputWrap}>
              <span style={S.icon}>👤</span>
              <input placeholder="ornek_kullanici" value={authForm.username}
                onChange={(e) => { setAuthForm({ ...authForm, username: e.target.value }); setErrors({ ...errors, username: '' }); }}
                onFocus={() => setFocused('username')} onBlur={() => setFocused('')} style={S.input('username')} />
            </div>
            {errors.username && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4, fontWeight: 700 }}>{errors.username}</div>}
          </div>
          <div>
            <label style={S.label}>E-POSTA</label>
            <div style={S.inputWrap}>
              <span style={S.icon}>✉️</span>
              <input type="email" placeholder="ornek@email.com" value={authForm.email}
                onChange={(e) => { setAuthForm({ ...authForm, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
                onFocus={() => setFocused('email')} onBlur={() => setFocused('')} style={S.input('email')} />
            </div>
            {errors.email && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4, fontWeight: 700 }}>{errors.email}</div>}
          </div>
        </div>
      );
      if (step === 2) return (
        <div key="r2" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={S.label}>ŞİFRENİ BELİRLE</label>
            <div style={S.inputWrap}>
              <span style={S.icon}>🔒</span>
              <input type="password" placeholder="••••••••" value={authForm.password}
                onChange={(e) => { setAuthForm({ ...authForm, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
                onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                style={{ ...S.input('password'), fontSize: 20, letterSpacing: 6, textAlign: 'center', paddingLeft: 16 }} />
            </div>
            {errors.password && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4, fontWeight: 700, textAlign: 'center' }}>{errors.password}</div>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[6, 8, 12, 16].map(len => (
              <div key={len} style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, background: authForm.password.length >= len ? 'rgba(124,58,237,.15)' : 'rgba(255,255,255,.03)', color: authForm.password.length >= len ? '#a855f7' : '#475569', border: `1px solid ${authForm.password.length >= len ? 'rgba(124,58,237,.2)' : 'rgba(255,255,255,.04)'}`, transition: 'all 0.3s' }}>
                {authForm.password.length >= len ? '✓' : '○'} {len}+
              </div>
            ))}
          </div>
        </div>
      );
      if (step === 3) return (
        <div key="r3" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <div style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 800 }}>Avatar seç</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, justifyItems: 'center' }}>
            {AVATARS.map(a => (
              <button key={a} type="button" onClick={() => setAuthForm({ ...authForm, avatar: a })}
                style={{ width: 48, height: 48, borderRadius: 14, fontSize: 24, cursor: 'pointer', background: authForm.avatar === a ? 'linear-gradient(135deg, rgba(124,58,237,.2), rgba(168,85,247,.1))' : 'rgba(255,255,255,.03)', border: authForm.avatar === a ? '1.5px solid #7c3aed' : '1.5px solid rgba(255,255,255,.04)', boxShadow: authForm.avatar === a ? '0 4px 16px rgba(124,58,237,.2)' : 'none', transition: 'all 0.2s', display: 'grid', placeItems: 'center' }}>
                {a}
              </button>
            ))}
          </div>
          <div>
            <label style={S.label}>HAKKINDA (opsiyonel)</label>
            <textarea placeholder="Kendinden bahset..." value={authForm.bio}
              onChange={(e) => setAuthForm({ ...authForm, bio: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 14, fontSize: 13, background: 'rgba(255,255,255,.03)', border: '1.5px solid rgba(255,255,255,.06)', color: '#e2e8f0', outline: 'none', minHeight: 70, resize: 'vertical', boxSizing: 'border-box', transition: 'all 0.25s' }} />
          </div>
        </div>
      );
    } else {
      if (step === 1) return (
        <div key="l1" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={S.label}>E-POSTA</label>
            <div style={S.inputWrap}>
              <span style={S.icon}>✉️</span>
              <input type="email" placeholder="ornek@email.com" value={authForm.email}
                onChange={(e) => { setAuthForm({ ...authForm, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
                onFocus={() => setFocused('email')} onBlur={() => setFocused('')} style={S.input('email')} />
            </div>
            {errors.email && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4, fontWeight: 700 }}>{errors.email}</div>}
          </div>
        </div>
      );
      if (step === 2) return (
        <div key="l2" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={S.label}>ŞİFREN</label>
            <div style={S.inputWrap}>
              <span style={S.icon}>🔒</span>
              <input type="password" placeholder="••••••••" value={authForm.password}
                onChange={(e) => { setAuthForm({ ...authForm, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
                onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                style={{ ...S.input('password'), fontSize: 20, letterSpacing: 6, textAlign: 'center', paddingLeft: 16 }} />
            </div>
            {errors.password && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4, fontWeight: 700, textAlign: 'center' }}>{errors.password}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <button type="button" onClick={() => { setResetMode(true); setResetStep(1); setResetMessage(''); }}
              style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'color 0.2s' }}>
              Şifremi Unuttum
            </button>
          </div>
        </div>
      );
    }
  };

  const totalSteps = authMode === 'register' ? 3 : 2;
  const progress = (step / totalSteps) * 100;

  return (
    <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) setShowAuthModal(false); }}>
      <div style={S.card}>
        {resetMode ? (
          <div style={{ padding: '36px 32px 32px' }}>
            <button type="button" onClick={() => { setResetMode(false); setResetStep(1); setResetMessage(''); }} style={S.close}>✕</button>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, rgba(239,68,68,.1), rgba(239,68,68,.05))', display: 'inline-grid', placeItems: 'center', marginBottom: 16, border: '1px solid rgba(239,68,68,.1)' }}>
                <span style={{ fontSize: 24 }}>🔐</span>
              </div>
              <div style={S.title}>Şifremi Unuttum</div>
              <div style={S.subtitle}>E-posta adresini gir, sana bir sıfırlama kodu gönderelim.</div>
            </div>
            {resetStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={S.inputWrap}>
                  <span style={S.icon}>✉️</span>
                  <input type="email" placeholder="ornek@email.com" value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    style={{ ...S.input('resetemail'), paddingLeft: 44 }} />
                </div>
                {resetMessage && <div style={{ color: resetMessage.includes('✓') ? '#34d399' : '#ef4444', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>{resetMessage}</div>}
                <button onClick={() => { if (!socket || !resetEmail) return; setResetBusy(true); socket.emit('auth_forgot_password', { email: resetEmail }); }}
                  disabled={resetBusy || !resetEmail} style={{ ...S.btnPrimary, opacity: resetBusy || !resetEmail ? 0.5 : 1 }}>
                  {resetBusy ? '⏳ Gönderiliyor...' : '📧 Sıfırlama Kodu Gönder'}
                </button>
              </div>
            )}
            {resetStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input placeholder="Sıfırlama kodu" value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 14, fontSize: 16, background: 'rgba(255,255,255,.03)', border: '1.5px solid rgba(255,255,255,.06)', color: '#e2e8f0', outline: 'none', boxSizing: 'border-box', textAlign: 'center', letterSpacing: 4, fontWeight: 900 }} />
                <input type="password" placeholder="Yeni şifre (min 6)" value={resetNewPass}
                  onChange={(e) => setResetNewPass(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 14, fontSize: 15, background: 'rgba(255,255,255,.03)', border: '1.5px solid rgba(255,255,255,.06)', color: '#e2e8f0', outline: 'none', boxSizing: 'border-box' }} />
                {resetMessage && <div style={{ color: resetMessage.includes('✓') || resetMessage.includes('başarıyla') ? '#34d399' : '#ef4444', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>{resetMessage}</div>}
                <button onClick={() => { if (!socket) return; setResetBusy(true); socket.emit('auth_reset_password', { resetToken, newPassword: resetNewPass }); }}
                  disabled={resetBusy || !resetToken || resetNewPass.length < 6} style={{ ...S.btnPrimary, opacity: resetBusy || !resetToken || resetNewPass.length < 6 ? 0.5 : 1 }}>
                  {resetBusy ? '⏳ İşleniyor...' : '🔒 Şifreyi Sıfırla'}
                </button>
                <button type="button" onClick={() => setResetStep(1)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>← Geri</button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Progress */}
            <div style={{ height: 3, background: 'rgba(255,255,255,.03)' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #a855f7)', transition: 'width 0.4s ease' }} />
            </div>

            {/* Header */}
            <div style={S.header}>
              <button type="button" onClick={() => setShowAuthModal(false)} style={S.close}>✕</button>
              <div style={S.logo}>
                <span style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>♥</span>
              </div>
              <div style={S.title}>{authMode === 'register' ? 'Hesap Oluştur' : 'Hoş Geldin'}</div>
              <div style={S.subtitle}>{authMode === 'register' ? 'Birkaç adımda hazır!' : 'Hesabına giriş yap'}</div>

              {/* Mode tabs */}
              <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,.03)', padding: 4, borderRadius: 12, marginTop: 20, border: '1px solid rgba(255,255,255,.04)' }}>
                <button type="button" onClick={() => { setAuthMode('login'); setStep(1); setErrors({}); }}
                  style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: 'pointer', background: authMode === 'login' ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'transparent', color: authMode === 'login' ? '#fff' : '#64748b', transition: 'all 0.25s', boxShadow: authMode === 'login' ? '0 4px 12px rgba(124,58,237,.2)' : 'none' }}>
                  Giriş Yap
                </button>
                <button type="button" onClick={() => { setAuthMode('register'); setStep(1); setErrors({}); }}
                  style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: 'pointer', background: authMode === 'register' ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'transparent', color: authMode === 'register' ? '#fff' : '#64748b', transition: 'all 0.25s', boxShadow: authMode === 'register' ? '0 4px 12px rgba(124,58,237,.2)' : 'none' }}>
                  Kayıt Ol
                </button>
              </div>

              {/* Step dots */}
              <div style={{ display: 'flex', gap: 6, marginTop: 16, justifyContent: 'center' }}>
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div key={i} style={S.stepDot(i + 1 === step, i + 1 <= step)} />
                ))}
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 32px 32px' }}>
              {errorMessage && <div style={{ ...S.error, marginBottom: 16 }}>{errorMessage}</div>}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {renderStep()}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {step > 1 && <button type="button" onClick={prevStep} style={S.btnSecondary}>← Geri</button>}
                  <button type="submit" disabled={authBusy} style={{ ...S.btnPrimary, flex: step > 1 ? 2 : 1, opacity: authBusy ? 0.5 : 1 }}>
                    {authBusy ? '⏳ İşleniyor...' : ((authMode === 'register' && step === 3) ? '✨ Hesabı Oluştur' : (authMode === 'login' && step === 2) ? '🚀 Giriş Yap' : 'Devam →')}
                  </button>
                </div>
              </form>

              {/* Footer */}
              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#475569' }}>
                {authMode === 'register' ? (
                  <>Zaten hesabın var mı?{' '}
                    <button type="button" onClick={() => { setAuthMode('login'); setStep(1); setErrors({}); setErrorMessage(''); }}
                      style={{ background: 'none', border: 'none', color: '#a855f7', fontWeight: 800, cursor: 'pointer' }}>Giriş yap</button>
                  </>
                ) : (
                  <>Hesabın yok mu?{' '}
                    <button type="button" onClick={() => { setAuthMode('register'); setStep(1); setErrors({}); setErrorMessage(''); }}
                      style={{ background: 'none', border: 'none', color: '#a855f7', fontWeight: 800, cursor: 'pointer' }}>Kayıt ol</button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
