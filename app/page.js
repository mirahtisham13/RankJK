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

  const BODIES = ['ALL', 'JKSSB', 'JKPSC', 'SSC', 'UPSC'];

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

          {/* Hero */}
          <div className="hero">
            <div className="hero-eyebrow">
              🏆 Community-Powered Cutoff Predictions
            </div>
            <h1>
              Know Your{' '}
              <span className="text-gradient">Expected Cutoff</span>
              {' '}Before Results
            </h1>
            <p>
              Submit your marks after the exam. We aggregate scores from thousands of aspirants to predict realistic cutoffs for JKSSB, SSC, JKPSC and more — category-wise.
            </p>
            <div className="hero-actions">
              <Link href="/submit" className="btn btn-primary btn-lg">
                📊 Submit My Marks
              </Link>
              <Link href="/exams" className="btn btn-ghost btn-lg">
                Browse Exams →
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-bar">
            <div className="stat-item">
              <div className="stat-value gradient">{stats.totalExams}</div>
              <div className="stat-label">Active Exams</div>
            </div>
            <div className="stat-item">
              <div className="stat-value gradient">{stats.totalSubmissions.toLocaleString()}</div>
              <div className="stat-label">Marks Submitted</div>
            </div>
            <div className="stat-item">
              <div className="stat-value gradient">8</div>
              <div className="stat-label">Categories Covered</div>
            </div>
            <div className="stat-item">
              <div className="stat-value gradient">Free</div>
              <div className="stat-label">Always Free</div>
            </div>
          </div>

          {/* How it works */}
          <div style={{ marginBottom: '80px' }}>
            <div className="section-header">
              <div>
                <h2>How It Works</h2>
                <p>Three simple steps to get your cutoff estimate</p>
              </div>
            </div>
            <div className="grid-3">
              {[
                { icon: '✍️', step: '01', title: 'Submit Your Marks', desc: 'After giving an exam, log in and enter your score along with your category (General, OBC, SC, ST, EWS, RBA, ALC, PWD).' },
                { icon: '🤝', step: '02', title: 'Community Aggregates', desc: 'As thousands of aspirants submit their marks, our system builds a real-time distribution of all scores.' },
                { icon: '🎯', step: '03', title: 'Get Cutoff Prediction', desc: 'We calculate optimistic, likely, and conservative cutoffs per category based on vacancy ratios and score distributions.' },
              ].map(item => (
                <div key={item.step} className="card">
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '48px', height: '48px', background: 'var(--brand-gradient-subtle)',
                      border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-md)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                      flexShrink: 0
                    }}>
                      {item.icon}
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900,
                      color: 'rgba(59,130,246,0.15)', lineHeight: 1
                    }}>{item.step}</span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '8px' }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Exams */}
          <div>
            <div className="section-header">
              <div>
                <h2>Browse Exams</h2>
                <p>Click any exam to see real-time cutoff predictions</p>
              </div>
              <Link href="/exams" className="btn btn-ghost btn-sm">View All</Link>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
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

            {loading ? (
              <div className="grid-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton skeleton-card" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No exams found</h3>
                <p>Try a different filter or check back later.</p>
              </div>
            ) : (
              <div className="grid-3">
                {filtered.slice(0, 6).map(exam => (
                  <ExamCard key={exam.id} exam={exam} />
                ))}
              </div>
            )}
          </div>

          {/* CTA Banner */}
          <div style={{
            marginTop: '80px', padding: '60px 40px', borderRadius: 'var(--radius-xl)',
            background: 'var(--brand-gradient)', textAlign: 'center', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, transparent 70%)'
            }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '12px' }}>
                Already gave your exam?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '28px', fontSize: '1.05rem' }}>
                Submit your marks now and help build a more accurate cutoff for your fellow aspirants.
              </p>
              <Link href="/submit" className="btn btn-lg" style={{
                background: '#fff', color: '#111827', fontWeight: 700, boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
              }}>
                📊 Submit My Marks
              </Link>
            </div>
          </div>

          {/* Category Guide */}
          <div style={{ marginTop: '80px' }}>
            <div className="section-header">
              <div>
                <h2>All Categories Covered</h2>
                <p>Including J&K-specific RBA and ALC categories</p>
              </div>
            </div>
            <div className="grid-4">
              {[
                { cat: 'General', desc: 'Open merit candidates', color: '#6366f1' },
                { cat: 'OBC', desc: 'Other Backward Classes', color: '#f59e0b' },
                { cat: 'SC', desc: 'Scheduled Caste', color: '#10b981' },
                { cat: 'ST', desc: 'Scheduled Tribe', color: '#ef4444' },
                { cat: 'EWS', desc: 'Economically Weaker Section', color: '#8b5cf6' },
                { cat: 'PWD', desc: 'Persons with Disabilities', color: '#06b6d4' },
                { cat: 'RBA', desc: 'Residents of Backward Areas 🏔️', color: '#f97316' },
                { cat: 'ALC', desc: 'Adjacent Locality Candidates 🌿', color: '#ec4899' },
              ].map(item => (
                <div key={item.cat} className="card card-sm" style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: 'var(--radius-full)',
                    background: `${item.color}20`, border: `1px solid ${item.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px', fontWeight: 800, color: item.color, fontSize: '0.9rem'
                  }}>
                    {item.cat.substring(0, 1)}
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>{item.cat}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
