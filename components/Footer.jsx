import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '32px 0',
      position: 'relative',
      zIndex: 1
    }}>
      <div className="container">
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem',
              background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>
              🎯 RankJK
            </span>
            <nav style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', alignItems: 'center' }}>
              <Link href="/exams" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
              >Exams</Link>
              <Link href="/leaderboard" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
              >Leaderboard</Link>
              <a
                href="https://t.me/JKExamSpark_Official"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  color: '#229ED9', fontWeight: 600, fontSize: '0.875rem',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.24 13.766l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.908.793z"/>
                </svg>
                Telegram
              </a>
            </nav>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} RankJK · Predictions are community-based, not official.
          </div>
        </div>
      </div>
    </footer>
  );
}
