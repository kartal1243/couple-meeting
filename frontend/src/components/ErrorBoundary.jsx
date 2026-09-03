import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 200, background: 'rgba(15,23,42,.9)', borderRadius: 16, padding: 24,
          border: '1px solid rgba(239,68,68,.3)', margin: 12
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Bir hata oluştu</div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 16, textAlign: 'center' }}>
            {this.props.fallbackMessage || 'Bu bölüm geçici olarak kullanılamıyor.'}
          </div>
          <button onClick={() => this.setState({ hasError: false, error: null })} style={{
            background: 'linear-gradient(135deg, #00a884, #008f6f)', color: '#fff',
            border: 'none', padding: '8px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13
          }}>🔄 Tekrar Dene</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
