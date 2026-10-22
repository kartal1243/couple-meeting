import { useState } from 'react';
import { VIP_PLANS, VIP_FEATURES, VIP_LEVELS, BACKEND_URL } from '../constants';

export default function VipModal({ authUser, setShowVipModal, setAuthUser }) {
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [partnerUsername, setPartnerUsername] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePurchase = async () => {
    if (!authUser) return;
    setProcessing(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/vip/create-checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: localStorage.getItem('cm_auth_token'),
          plan: selectedPlan,
          partnerUsername: partnerUsername.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.ok) {
        if (data.testMode) {
          setSuccess(true);
          setAuthUser({ ...authUser, isVip: true, vipExpiry: data.vipExpiry });
          localStorage.setItem('cm_auth_user', JSON.stringify({ ...authUser, isVip: true, vipExpiry: data.vipExpiry }));
          setTimeout(() => setSuccess(false), 3000);
        } else if (data.url && /^https:\/\//i.test(data.url)) {
          window.location.href = data.url;
        }
      } else {
        setErrorMsg(data.message || 'İşlem sırasında bir hata oluştu.');
      }
    } catch (e) {
      console.error('VIP checkout error:', e);
      setErrorMsg('Sunucu ile bağlantı kurulamadı.');
    }
    setProcessing(false);
  };

  if (success) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 25000, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 80, marginBottom: 16, animation: 'float 2s ease-in-out infinite' }}>👑</div>
        <div style={{ color: '#f59e0b', fontSize: 28, fontWeight: 950, marginBottom: 8 }}>Tebrikler!</div>
        <div style={{ color: '#fff', fontSize: 16 }}>Çift VIP üyeliğin aktifleştirildi! 💕</div>
        {partnerUsername.trim() && (
          <div style={{ color: '#fb7185', fontSize: 14, fontWeight: 800, marginTop: 6 }}>
            🎁 @{partnerUsername.trim()} kullanıcısına da hediye VIP tanımlandı!
          </div>
        )}
        <div style={{ color: '#7f8c98', fontSize: 13, marginTop: 8 }}>Artık kalıcı oda, özel temalar ve tüm ayrıcalıklar sizin.</div>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 25000, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div style={{
        width: 'min(900px, 100%)', background: 'linear-gradient(180deg, #111b21, #0a0f14)',
        border: '1px solid #2a3942', borderRadius: 28, overflow: 'hidden',
        boxShadow: '0 40px 120px rgba(0,0,0,.6), 0 0 60px rgba(245,158,11,.08)',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ padding: '24px 28px', background: 'linear-gradient(135deg, rgba(245,158,11,.14), rgba(251,113,133,.12))', borderBottom: '1px solid #2a3942', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(251,113,133,.18)', border: '1px solid rgba(251,113,133,.35)', color: '#fb7185', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 900, marginBottom: 6 }}>
              💑 ÇİFT PAKETİ • 1 ÖDER, 2 KİŞİ VIP OLUR
            </div>
            <h2 style={{ margin: '2px 0 0', color: '#fff', fontSize: 24, fontWeight: 950 }}>Couple Pass Premium</h2>
          </div>
          <button onClick={() => setShowVipModal(false)}
            style={{ background: 'rgba(255,255,255,.06)', border: 'none', color: '#7f8c98', width: 36, height: 36, borderRadius: 12, cursor: 'pointer', fontSize: 14 }}>
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', minHeight: 480, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280, padding: 24, borderRight: '1px solid #25313a' }}>
            <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 900, marginBottom: 14 }}>COUPLE PASS NE KAZANDIRIR?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {VIP_FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', background: '#111b21', borderRadius: 12, border: i < 2 ? '1px solid rgba(251,113,133,.3)' : '1px solid #25313a' }}>
                  <div style={{ fontSize: 22, minWidth: 30 }}>{f.icon}</div>
                  <div>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 900 }}>{f.title}</div>
                    <div style={{ color: '#7f8c98', fontSize: 11, marginTop: 2 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ width: 350, padding: 24, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 280 }}>
            <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 900, marginBottom: 2 }}>ÇİFT PAKETİ SEÇİN</div>

            {Object.entries(VIP_PLANS).map(([key, plan]) => (
              <button key={key} type="button" onClick={() => setSelectedPlan(key)}
                style={{
                  padding: '14px 16px', borderRadius: 16, textAlign: 'left', cursor: 'pointer', position: 'relative',
                  border: selectedPlan === key ? '2px solid #f59e0b' : '2px solid #25313a',
                  background: selectedPlan === key ? 'rgba(245,158,11,.1)' : '#111b21',
                  transition: 'all 0.15s'
                }}>
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: -9, right: 12, background: key === 'yearly' ? 'linear-gradient(135deg, #fb7185, #e11d48)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 99
                  }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{plan.icon}</span>
                    <div>
                      <div style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>{plan.label}</div>
                      <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>{plan.duration}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#f59e0b', fontSize: 16, fontWeight: 950 }}>
                      ₺{plan.price.toFixed(2)}
                    </div>
                    <div style={{ background: 'rgba(0,168,132,.18)', color: '#34d399', fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 6, display: 'inline-block', marginTop: 3 }}>
                      LANSMANA ÖZEL ÜCRETSİZ
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {/* Partner Gift Input */}
            <div style={{ background: 'rgba(251,113,133,.07)', border: '1px solid rgba(251,113,133,.25)', borderRadius: 14, padding: 12, marginTop: 4 }}>
              <label style={{ display: 'block', color: '#fb7185', fontSize: 11, fontWeight: 900, marginBottom: 6 }}>
                🎁 Partner Kullanıcı Adı (1 Alana Sevgiline/Arkadaşına Hediye VIP 💕)
              </label>
              <input
                type="text"
                value={partnerUsername}
                onChange={(e) => setPartnerUsername(e.target.value)}
                placeholder="Örn: sevgilimin_kullanici_adi (İsteğe bağlı)"
                style={{
                  width: '100%', padding: '10px 12px', background: '#0b141a', border: '1px solid #25313a',
                  color: '#e9edef', borderRadius: 10, fontSize: 12, outline: 'none', boxSizing: 'border-box'
                }}
              />
              <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 5 }}>
                Yazdığın kullanıcı da seninle aynı sürede ücretsiz VIP ayrıcalıklarına sahip olur.
              </div>
            </div>

            {errorMsg && (
              <div style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, textAlign: 'center', padding: '6px 10px', background: 'rgba(239,68,68,.1)', borderRadius: 8 }}>
                {errorMsg}
              </div>
            )}

            {authUser?.isVip ? (
              <div style={{ padding: 14, borderRadius: 12, background: 'rgba(0,168,132,.1)', border: '1px solid rgba(0,168,132,.2)', textAlign: 'center' }}>
                <div style={{ color: '#00a884', fontSize: 13, fontWeight: 900 }}>✅ VIP üyeliğin aktif</div>
                <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 900, marginTop: 4 }}>{VIP_LEVELS[authUser.vipLevel || 0]?.icon} {VIP_LEVELS[authUser.vipLevel || 0]?.label || 'VIP'}</div>
                <div style={{ color: '#7f8c98', fontSize: 11, marginTop: 4 }}>Bitiş: {new Date(authUser.vipExpiry).toLocaleDateString('tr-TR')}</div>
              </div>
            ) : (
              <button onClick={handlePurchase} disabled={processing || !authUser}
                style={{
                  padding: '15px', borderRadius: 14, border: 'none', cursor: (processing || !authUser) ? 'not-allowed' : 'pointer',
                  background: processing ? '#1a2634' : 'linear-gradient(135deg, #f59e0b, #e11d48)',
                  color: '#fff', fontSize: 15, fontWeight: 900, marginTop: 4,
                  boxShadow: processing ? 'none' : '0 8px 25px rgba(245,158,11,.3)',
                  opacity: (processing || !authUser) ? 0.6 : 1
                }}>
                {!authUser
                  ? '🔒 VIP İçin Önce Giriş Yapmalısın'
                  : processing
                    ? '⏳ İşleniyor...'
                    : "💑 Çift VIP'i Ücretsiz Aktifleştir"}
              </button>
            )}

            <div style={{ textAlign: 'center', color: '#63727d', fontSize: 10, marginTop: 4 }}>
              🎉 Lansman dönemi boyunca Couple Pass ücretsiz • İstediğin zaman iptal et
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

