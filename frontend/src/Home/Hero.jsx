import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Hero({ handleQuickCreateRoom }) {
  const navigate = useNavigate();
  const [cardLiked, setCardLiked] = useState(false);
  const [matchToast, setMatchToast] = useState('');

  const handleTinderAction = (type) => {
    if (type === 'like' || type === 'superlike') {
      setCardLiked(true);
      setMatchToast(type === 'superlike' ? '⭐ Süper Like Gönderildi! Sanal Date Başlatılıyor...' : '💚 Eşleşme Sağlandı! Sanal Date Lobisine Geçiliyor...');
      setTimeout(() => {
        navigate('/date');
      }, 1200);
    } else if (type === 'rewind') {
      setCardLiked(false);
      setMatchToast('↩️ Önceki Profile Dönüldü');
      setTimeout(() => setMatchToast(''), 1500);
    } else if (type === 'boost') {
      setMatchToast('⚡ Profilin 30 Dakika Boyunca Öne Çıkarıldı!');
      setTimeout(() => setMatchToast(''), 2000);
    } else {
      setMatchToast('❌ Sıradaki Profile Geçildi');
      setTimeout(() => setMatchToast(''), 1200);
    }
  };

  return (
    <section className="cm-hero" style={{ padding: '36px 0 20px', position: 'relative' }}>
      {/* 2-Column Tinder Layout (Editorial Headline + Interactive Tinder Card) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 'clamp(24px, 5vw, 60px)',
        alignItems: 'center',
        maxWidth: 1140,
        margin: '0 auto',
        padding: '0 16px'
      }}>
        {/* Left Column: Bold Tinder Headline & Primary CTAs */}
        <div style={{ textAlign: 'left' }}>
          {/* Flame Micro-Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 18px',
            borderRadius: 999,
            background: '#fff1f2',
            border: '1.5px solid #fecdd3',
            marginBottom: 20
          }}>
            <span style={{ fontSize: 14, animation: 'cmPulseHeart 1.4s ease-in-out infinite' }}>🔥</span>
            <span style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: '0.6px', color: '#e11d48', textTransform: 'uppercase' }}>
              TÜRKİYE&apos;NİN 1 NUMARALI ÇİFT & DATE PLATFORMU
            </span>
          </div>

          {/* Huge Iconic Editorial Headline */}
          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 68px)',
            fontWeight: 950,
            lineHeight: 1.05,
            letterSpacing: '-2px',
            color: '#0f172a',
            margin: '0 0 18px'
          }}>
            Kaydırmayı Bırak. <br />
            <span style={{
              background: 'linear-gradient(135deg, #fd267d 0%, #ff6036 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 4px 20px rgba(253, 38, 125, 0.25))'
            }}>
              Birlikte İzle ve Tanış.
            </span>
          </h1>

          <p style={{
            color: '#475569',
            fontSize: 'clamp(15px, 2vw, 17.5px)',
            lineHeight: 1.6,
            fontWeight: 500,
            margin: '0 0 32px',
            maxWidth: 520
          }}>
            Aynı filmi izleyin, aynı şarkıda aşık olun. Uzak mesafe sevgilileri ve yeni tanışanlar için aynı saniyede senkronize YouTube, müzik sahneleri ve baş başa Sanal Date deneyimi.
          </p>

          {/* High-Converting Tinder CTAs */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/date')}
              style={{
                padding: '16px 36px',
                borderRadius: 999,
                border: 'none',
                background: 'linear-gradient(135deg, #fd267d 0%, #ff6036 100%)',
                color: '#ffffff',
                fontSize: 15.5,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 10px 30px rgba(253, 38, 125, 0.4)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(253, 38, 125, 0.5)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(253, 38, 125, 0.4)'; }}
            >
              <span>💘 Sanal Date&apos;e Başla</span>
              <span style={{ fontSize: 18, fontWeight: 900 }}>↗</span>
            </button>

            <button
              type="button"
              onClick={handleQuickCreateRoom}
              style={{
                padding: '15px 28px',
                borderRadius: 999,
                border: '2px solid #0f172a',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: 15,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <span>🎬 Özel Oda Kur & İzle</span>
            </button>
          </div>

          {/* Social Proof / Active Stat */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {['👩', '👨', '👧', '🧑'].map((emoji, i) => (
                <div
                  key={i}
                  style={{
                    width: 32, height: 32, borderRadius: '50%', background: '#fff1f2',
                    border: '2.5px solid #ffffff', display: 'grid', placeItems: 'center',
                    fontSize: 15, marginLeft: i === 0 ? 0 : -10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {emoji}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>
              <span style={{ color: '#0f172a', fontWeight: 900 }}>12.400+ Çift & Flört</span> şu an birlikte izliyor
            </div>
          </div>
        </div>

        {/* Right Column: Signature Tinder Profile Card & Swipe Mockup */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          {/* Decorative Pink Glow behind the card */}
          <div style={{
            position: 'absolute', inset: -20,
            background: 'radial-gradient(circle at center, rgba(253,38,125,0.22) 0%, rgba(255,96,54,0.1) 50%, transparent 70%)',
            filter: 'blur(35px)', zIndex: 0
          }} />

          {/* The Tinder Card */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 380,
            borderRadius: 32,
            background: '#ffffff',
            border: '2px solid rgba(253, 38, 125, 0.25)',
            boxShadow: '0 24px 60px rgba(253, 38, 125, 0.18), 0 8px 24px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            animation: 'cmCardFloat 6s ease-in-out infinite'
          }}>
            {/* Card Header Media / Avatar Showcase */}
            <div style={{
              height: 310,
              background: 'linear-gradient(160deg, #fd267d 0%, #ff6036 50%, #f43f5e 100%)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 20,
              boxSizing: 'border-box',
              color: '#ffffff'
            }}>
              {/* Top Live Pill */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(10px)',
                  padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 900,
                  display: 'inline-flex', alignItems: 'center', gap: 6
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'cmLivePulse 2s infinite' }} />
                  CANLI DATE MODUNDA
                </span>
                <span style={{
                  background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)',
                  padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 900
                }}>
                  %98 UYUM
                </span>
              </div>

              {/* Big Romantic Center Icon / Photo placeholder */}
              <div style={{ textAlign: 'center', margin: 'auto 0' }}>
                <div style={{
                  width: 96, height: 96, borderRadius: '50%', background: '#ffffff',
                  margin: '0 auto 8px', display: 'grid', placeItems: 'center', fontSize: 48,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.25)', border: '4px solid rgba(255,255,255,0.4)'
                }}>
                  {cardLiked ? '💖' : '👩‍🦰'}
                </div>
              </div>

              {/* Bottom Card Title & Location */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 24, fontWeight: 950 }}>
                  <span>Zeynep, 23</span>
                  <span title="Doğrulanmış Profil" style={{ fontSize: 18 }}>🛡️</span>
                </div>
                <div style={{ fontSize: 13, opacity: 0.92, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📍 Kadıköy, İstanbul • 4 km uzakta</span>
                </div>
              </div>
            </div>

            {/* Card Body: Song Playing & Passions */}
            <div style={{ padding: '18px 20px 22px', background: '#ffffff' }}>
              {/* Music Sync Status */}
              <div style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: 14,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 14
              }}>
                <span style={{ fontSize: 20 }}>🎵</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#e11d48', fontWeight: 900, textTransform: 'uppercase' }}>ŞU AN DİNLİYOR</div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Duman - Senden Daha Güzel
                  </div>
                </div>
              </div>

              {/* Passion Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                {['🎬 Sinema Sever', '☕ Sıcak Kafe Date', '🎸 Rock Müzik', '🏕️ Kamp Ateşi'].map((badge) => (
                  <span
                    key={badge}
                    style={{
                      padding: '5px 11px',
                      borderRadius: 999,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      color: '#334155',
                      fontSize: 11,
                      fontWeight: 800
                    }}
                  >
                    {badge}
                  </span>
                ))}
              </div>

              {/* Iconic 5 Tinder Action Circular Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                {/* 1. Rewind */}
                <button
                  type="button"
                  onClick={() => handleTinderAction('rewind')}
                  title="Geri Al"
                  style={{
                    width: 44, height: 44, borderRadius: '50%', border: '2px solid #f59e0b',
                    background: '#ffffff', color: '#f59e0b', fontSize: 18, cursor: 'pointer',
                    display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px rgba(245,158,11,0.2)'
                  }}
                >
                  ↩️
                </button>

                {/* 2. Pass / Hayır */}
                <button
                  type="button"
                  onClick={() => handleTinderAction('pass')}
                  title="Geç"
                  style={{
                    width: 52, height: 52, borderRadius: '50%', border: '2px solid #ef4444',
                    background: '#ffffff', color: '#ef4444', fontSize: 22, cursor: 'pointer',
                    display: 'grid', placeItems: 'center', boxShadow: '0 4px 16px rgba(239,68,68,0.25)'
                  }}
                >
                  ✕
                </button>

                {/* 3. Super Like */}
                <button
                  type="button"
                  onClick={() => handleTinderAction('superlike')}
                  title="Süper Like & Eşleş"
                  style={{
                    width: 44, height: 44, borderRadius: '50%', border: '2px solid #06b6d4',
                    background: '#ffffff', color: '#06b6d4', fontSize: 19, cursor: 'pointer',
                    display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px rgba(6,182,212,0.2)'
                  }}
                >
                  ⭐
                </button>

                {/* 4. Like / Beğen (Tinder Green Heart) */}
                <button
                  type="button"
                  onClick={() => handleTinderAction('like')}
                  title="Beğen & Sanal Date Başlat"
                  style={{
                    width: 58, height: 58, borderRadius: '50%', border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff',
                    fontSize: 26, cursor: 'pointer', display: 'grid', placeItems: 'center',
                    boxShadow: '0 8px 24px rgba(16,185,129,0.4)', transition: 'transform 0.15s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  💚
                </button>

                {/* 5. Boost */}
                <button
                  type="button"
                  onClick={() => handleTinderAction('boost')}
                  title="Öne Çıkar"
                  style={{
                    width: 44, height: 44, borderRadius: '50%', border: '2px solid #a855f7',
                    background: '#ffffff', color: '#a855f7', fontSize: 18, cursor: 'pointer',
                    display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px rgba(168,85,247,0.2)'
                  }}
                >
                  ⚡
                </button>
              </div>

              {matchToast && (
                <div style={{
                  marginTop: 14,
                  padding: '8px 12px',
                  borderRadius: 12,
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 900,
                  textAlign: 'center',
                  animation: 'cmDrawerSlide 0.2s ease'
                }}>
                  {matchToast}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
