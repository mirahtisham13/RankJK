import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3 className="text-gradient" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              🎯 RankJK
            </h3>
            <p>
              India&apos;s crowd-sourced cutoff predictor for competitive exams. Built for aspirants of JKSSB, SSC, JKPSC and more.
            </p>
            <p style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Note:</strong> Cutoffs are predicted based on community data and may differ from official results.
            </p>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li><Link href="/exams">Browse Exams</Link></li>
              <li><Link href="/submit">Submit Marks</Link></li>
              <li><Link href="/leaderboard">Leaderboard</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Exams</h4>
            <ul>
              <li><Link href="/exams?body=JKSSB">JKSSB</Link></li>
              <li><Link href="/exams?body=SSC">SSC</Link></li>
              <li><Link href="/exams?body=JKPSC">JKPSC</Link></li>
              <li><Link href="/auth?tab=signup">Join Community</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} RankJK. Made with ❤️ for J&K aspirants.</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Data is community-contributed. Results may vary.
          </span>
        </div>
      </div>
    </footer>
  );
}
