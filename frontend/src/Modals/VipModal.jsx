import { useState } from 'react';
import { VIP_PLANS, VIP_FEATURES, BACKEND_URL } from '../constants';

export default function VipModal({ authUser, setShowVipModal, setAuthUser, styles }) {
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');
  const [adminResult, setAdminResult] = useState('');

  const handlePurchase = async () => {
    if (!authUser) return;
    setProcessing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/vip/create-checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: localStorage.getItem('cm_auth_token'), plan: selectedPlan })
      });
      const data = await res.json();
      if (data.ok) {
        if (data.testMode) {
          setSuccess(true);
          setAuthUser({ ...authUser, isVip: true, vipExpiry: data.vipExpiry });
          localStorage.setItem('cm_auth_user', JSON.stringify({ ...authUser, isVip: true, vipExpiry: data.vipExpiry }));
          setTimeout(() => setSuccess(false), 3000);
        } else if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (e) { console.error('VIP checkout error:', e); }
    setProcessing(false);
  };

  const handleAdminGrant = async () => {
    if (!adminSecret || !authUser?.username) return;
    setAdminResult('İşleniyor...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/vip/admin-grant`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: adminSecret, username: authUser.username, plan: selectedPlan })
      });
      const data = await res.json();
      if (data.ok) {
        setAdminResult('VIP aktifleştirildi!');
        setAuthUser({ ...authUser, isVip: true, vipExpiry: data.vipExpiry });
        localStorage.setItem('cm_auth_user', JSON.stringify({ ...authUser, isVip: true, vipExpiry: data.vipExpiry }));
        setSuccess(true);
        setTimeout(() => { setSuccess(false); setShowVipModal(false); }, 2000);
      } else {
        setAdminResult(data.message || 'Hata oluştu.');
      }
    } catch (e) { setAdminResult('Bağlantı hatası.'); }
  };

  if (success) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 25000, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 80, marginBottom: 16, animation: 'float 2s ease-in-out infinite' }}>👑</div>
        <div style={{ color: '#f59e0b', fontSize: 28, fontWeight: 950, marginBottom: 8 }}>Tebrikler!</div>
        <div style={{ color: '#fff', fontSize: 16 }}>VIP üyeliğin aktifleştirildi!</div>
        <div style={{ color: '#7f8c98', fontSize: 13, marginTop: 8 }}>Artık özel temalar ve özellikler senin.</div>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 25000, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div style={{
        width: 'min(860px, 100%)', background: 'linear-gradient(180deg, #111b21, #0a0f14)',
        border: '1px solid #2a3942', borderRadius: 28, overflow: 'hidden',
        boxShadow: '0 40px 120px rgba(0,0,0,.6), 0 0 60px rgba(245,158,11,.08)',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ padding: '24px 28px', background: 'linear-gradient(135deg, rgba(245,158,11,.12), rgba(249,115,22,.08))', borderBottom: '1px solid #2a3942', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 900 }}>⭐ COUPLE MEETING VIP</div>
            <h2 style={{ margin: '4px 0 0', color: '#fff', fontSize: 24, fontWeight: 950 }}>Premium Üyelik</h2>
          </div>
          <button onClick={() => setShowVipModal(false)}
            style={{ background: 'rgba(255,255,255,.06)', border: 'none', color: '#7f8c98', width: 36, height: 36, borderRadius: 12, cursor: 'pointer', fontSize: 14 }}>
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', minHeight: 480, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280, padding: 24, borderRight: '1px solid #25313a' }}>
            <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 900, marginBottom: 14 }}>VIP NE KAZANDIRIR?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {VIP_FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', background: '#111b21', borderRadius: 12, border: '1px solid #25313a' }}>
                  <div style={{ fontSize: 24, minWidth: 32 }}>{f.icon}</div>
                  <div>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 900 }}>{f.title}</div>
                    <div style={{ color: '#7f8c98', fontSize: 11, marginTop: 2 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ width: 320, padding: 24, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 280 }}>
            <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 900, marginBottom: 4 }}>PLAN SEÇ</div>

            {Object.entries(VIP_PLANS).map(([key, plan]) => (
              <button key={key} type="button" onClick={() => setSelectedPlan(key)}
                style={{
                  padding: '16px', borderRadius: 16, textAlign: 'left', cursor: 'pointer',
                  border: selectedPlan === key ? '2px solid #f59e0b' : '2px solid #25313a',
                  background: selectedPlan === key ? 'rgba(245,158,11,.08)' : '#111b21',
                  transition: 'all 0.15s'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 22 }}>{plan.icon}</span>
                    <div>
                      <div style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>{plan.label}</div>
                      <div style={{ color: '#7f8c98', fontSize: 11 }}>{plan.duration}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#f59e0b', fontSize: 20, fontWeight: 950 }}>₺{plan.price}</div>
                    {plan.savings && (
                      <div style={{ background: '#00a884', color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 6, display: 'inline-block' }}>
                        %{plan.savings} Tasarruf
                      </div>
                    )}
                  </div>
                </div>
                {selectedPlan === key && <div style={{ marginTop: 8, width: 6, height: 6, borderRadius: 3, background: '#f59e0b', marginLeft: 'auto' }} />}
              </button>
            ))}

            {authUser?.isVip ? (
              <div style={{ padding: 14, borderRadius: 12, background: 'rgba(0,168,132,.1)', border: '1px solid rgba(0,168,132,.2)', textAlign: 'center' }}>
                <div style={{ color: '#00a884', fontSize: 13, fontWeight: 900 }}>✅ VIP üyeliğin aktif</div>
                <div style={{ color: '#7f8c98', fontSize: 11, marginTop: 4 }}>Bitiş: {new Date(authUser.vipExpiry).toLocaleDateString('tr-TR')}</div>
              </div>
            ) : (
              <button onClick={handlePurchase} disabled={processing}
                style={{
                  padding: '14px', borderRadius: 14, border: 'none', cursor: processing ? 'not-allowed' : 'pointer',
                  background: processing ? '#1a2634' : 'linear-gradient(135deg, #f59e0b, #f97316)',
                  color: '#fff', fontSize: 15, fontWeight: 900, marginTop: 8,
                  boxShadow: processing ? 'none' : '0 8px 25px rgba(245,158,11,.3)',
                  opacity: processing ? 0.6 : 1
                }}>
                {processing ? '⏳ İşleniyor...' : `🚀 VIP Ol - ₺${VIP_PLANS[selectedPlan].price}`}
              </button>
            )}

            {/* Admin VIP Verme */}
            <div style={{ borderTop: '1px solid #25313a', paddingTop: 12, marginTop: 8 }}>
              <div style={{ color: '#63727d', fontSize: 10, fontWeight: 900, marginBottom: 6 }}>🔧 ADMIN VIP AKTİVASYON</div>
              <input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="Admin anahtarı..."
                style={{
                  width: '100%', padding: '10px 12px', background: '#0b141a', border: '1px solid #25313a',
                  color: '#e9edef', borderRadius: 10, fontSize: 12, outline: 'none', marginBottom: 6, boxSizing: 'border-box'
                }}
              />
              <button onClick={handleAdminGrant}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer'
                }}>
                👑 Kendime VIP Ver
              </button>
              {adminResult && (
                <div style={{ color: adminResult.includes('aktifleştirildi') ? '#00a884' : '#ef4444', fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                  {adminResult}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', color: '#63727d', fontSize: 10, marginTop: 8 }}>
              Güvenli ödeme • İstediğin zaman iptal et
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
