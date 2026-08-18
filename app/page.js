'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ExamCard from '@/components/ExamCard';
import { getExams, getGlobalStats } from '@/lib/db';

export default function HomePage() {
  const [exams, setExams] = useState([]);
  const [stats, setStats] = useState({ totalExams: 0, totalSubmissions: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const BODIES = ['ALL', 'JKSSB', 'JKPSC', 'SSC'];

  useEffect(() => {
    async function load() {
      try {
        const [examData, statsData] = await Promise.all([getExams(), getGlobalStats()]);
        setExams(examData || []);
        setStats(statsData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = filter === 'ALL' ? exams : exams.filter(e => e.conducting_body === filter);

  return (
    <>
      <Navbar />
      <main className="page-wrapper">
        <div className="container">

          {/* Hero — compact */}
          <div style={{ textAlign: 'center', padding: '40px 0 48px' }}>
            <div className="hero-eyebrow" style={{ marginBottom: '20px' }}>
              🏆 Community-Powered · Free · No Ads
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '16px' }}>
              Know Your <span className="text-gradient">Expected Cutoff</span>
            </h1>
            <p style={{
              fontSize: '1.05rem', color: 'var(--text-secondary)',
              maxWidth: '500px', margin: '0 auto 32px', lineHeight: 1.6
            }}>
              Submit your marks. See how you compare. Get realistic cutoff predictions for JKSSB, SSC, JKPSC and more — category-wise.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/submit" className="btn btn-primary btn-lg">
                📊 Submit My Marks
              </Link>
              <Link href="/leaderboard" className="btn btn-ghost btn-lg">
                🏆 Leaderboard
              </Link>
            </div>
          </div>

          {/* Quick stats strip */}
          <div style={{
            display: 'flex', gap: '0', marginBottom: '48px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden'
          }}>
            {[
              { value: stats.totalExams, label: 'Active Exams', icon: '📋' },
              { value: stats.totalSubmissions.toLocaleString(), label: 'Marks Submitted', icon: '📊' },
              { value: '8', label: 'Categories', icon: '🏷️' },
              { value: 'Free', label: 'Always', icon: '✅' },
            ].map((item, i) => (
              <div key={i} style={{
                flex: 1, textAlign: 'center', padding: '20px 12px',
                borderRight: i < 3 ? '1px solid var(--border)' : 'none'
              }}>
                <div style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{item.icon}</div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem',
                  background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1
                }}>
                  {item.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Exams section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Browse Exams</h2>
              <div style={{ display: 'flex', gap: '6px' }}>
                {BODIES.map(b => (
                  <button
                    key={b}
                    className={`btn btn-sm ${filter === b ? 'btn-secondary' : 'btn-ghost'}`}
                    onClick={() => setFilter(b)}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid-3">
                {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-card" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No exams found</h3>
                <p>Try a different filter.</p>
              </div>
            ) : (
              <div className="grid-3">
                {filtered.map(exam => <ExamCard key={exam.id} exam={exam} />)}
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
