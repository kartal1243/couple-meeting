import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0b141a', color: '#fff', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 80, marginBottom: 16 }}>🔍</div>
      <div style={{ fontSize: 48, fontWeight: 950, marginBottom: 8 }}>404</div>
      <div style={{ fontSize: 18, color: '#8696a0', marginBottom: 32 }}>Sayfa bulunamadi</div>
      <button onClick={() => navigate('/')} style={{ padding: '14px 32px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 25px rgba(124,58,237,.3)' }}>
        Ana Sayfaya Don
      </button>
    </div>
  );
}
