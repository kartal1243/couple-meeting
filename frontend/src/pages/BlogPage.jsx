import { useState, memo } from 'react';
import { blogPosts } from '../data/blogPosts';

function BlogPage() {
  const [selectedPost, setSelectedPost] = useState(null);

  if (selectedPost) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0e14', color: '#e9edef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <button onClick={() => setSelectedPost(null)} style={{
            background: 'rgba(255,255,255,.08)', border: 'none', color: '#00a884',
            padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
            fontSize: 14, marginBottom: 24
          }}>
            ← Geri Dön
          </button>

          <div style={{ marginBottom: 16 }}>
            <span style={{
              background: 'rgba(0,168,132,.15)', color: '#00a884', padding: '4px 12px',
              borderRadius: 20, fontSize: 12, fontWeight: 700
            }}>
              {selectedPost.category}
            </span>
            <span style={{ color: '#64748b', fontSize: 13, marginLeft: 12 }}>
              {selectedPost.date} · {selectedPost.readTime} okuma
            </span>
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 900, lineHeight: 1.3, marginBottom: 24, color: '#fff' }}>
            {selectedPost.title}
          </h1>

          <div style={{
            lineHeight: 1.8, fontSize: 16, color: '#94a3b8',
            background: 'rgba(255,255,255,.03)', padding: 32, borderRadius: 16,
            border: '1px solid rgba(255,255,255,.06)'
          }}>
            {selectedPost.content.split('\n').map((paragraph, i) => {
              if (paragraph.startsWith('## ')) {
                return <h2 key={i} style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginTop: 32, marginBottom: 16 }}>{paragraph.replace('## ', '')}</h2>;
              }
              if (paragraph.startsWith('### ')) {
                return <h3 key={i} style={{ fontSize: 20, fontWeight: 700, color: '#e9edef', marginTop: 24, marginBottom: 12 }}>{paragraph.replace('### ', '')}</h3>;
              }
              if (paragraph.startsWith('- **')) {
                const parts = paragraph.replace('- **', '').split('**');
                return (
                  <li key={i} style={{ marginBottom: 8 }}>
                    <strong style={{ color: '#00a884' }}>{parts[0]}</strong>
                    {parts[1] || ''}
                  </li>
                );
              }
              if (paragraph.startsWith('- ')) {
                return <li key={i} style={{ marginBottom: 6 }}>{paragraph.replace('- ', '')}</li>;
              }
              if (paragraph.match(/^\d\./)) {
                return <li key={i} style={{ marginBottom: 6 }}>{paragraph}</li>;
              }
              if (paragraph.trim() === '') return <br key={i} />;
              return <p key={i} style={{ marginBottom: 12 }}>{paragraph}</p>;
            })}
          </div>

          <div style={{
            marginTop: 32, padding: 24, background: 'linear-gradient(135deg, rgba(0,168,132,.1), rgba(233,30,140,.1))',
            borderRadius: 16, textAlign: 'center', border: '1px solid rgba(0,168,132,.2)'
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: '#fff' }}>
              Hemen Deneyin!
            </h3>
            <p style={{ color: '#94a3b8', marginBottom: 16, fontSize: 14 }}>
              Arkadaşlarınızla birlikte YouTube izlemeye başlayın
            </p>
            <a href="/" style={{
              display: 'inline-block', background: 'linear-gradient(135deg, #00a884, #00d4aa)',
              color: '#fff', padding: '12px 32px', borderRadius: 12, fontWeight: 800,
              fontSize: 14, textDecoration: 'none'
            }}>
              Ücretsiz Başla →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e14', color: '#e9edef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 16, background: 'linear-gradient(135deg, #00a884, #e91e8c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Couple Meeting Blog
          </h1>
          <p style={{ fontSize: 18, color: '#64748b', maxWidth: 600, margin: '0 auto' }}>
            Arkadaşlarınızla birlikte izleme, müzik dinleme ve online eğlence hakkında rehberler
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {blogPosts.map((post) => (
            <article
              key={post.id}
              onClick={() => setSelectedPost(post)}
              style={{
                background: 'rgba(255,255,255,.03)', borderRadius: 16, padding: 24,
                border: '1px solid rgba(255,255,255,.06)', cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,.06)';
                e.currentTarget.style.borderColor = 'rgba(0,168,132,.3)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{
                  background: 'rgba(0,168,132,.15)', color: '#00a884', padding: '4px 10px',
                  borderRadius: 20, fontSize: 11, fontWeight: 700
                }}>
                  {post.category}
                </span>
                <span style={{ color: '#64748b', fontSize: 12 }}>
                  {post.date}
                </span>
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, lineHeight: 1.4, color: '#fff' }}>
                {post.title}
              </h2>

              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
                {post.excerpt}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: 12 }}>{post.readTime} okuma</span>
                <span style={{ color: '#00a884', fontSize: 13, fontWeight: 700 }}>Oku →</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(BlogPage);
