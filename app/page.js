'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ExamCard from '@/components/ExamCard';
import { getExams, getGlobalStats } from '@/lib/db';

const HOW_IT_WORKS = [
  {
    icon: '✍️',
    title: 'Give Your Exam',
    desc: 'Appear for JKSSB, SSC, JKPSC or any other competitive exam.',
  },
  {
    icon: '📊',
    title: 'Submit Your Marks',
    desc: 'Click on your exam, enter your score and category. Takes under a minute.',
  },
  {
    icon: '🎯',
    title: 'See Your Cutoff',
    desc: 'We instantly show predicted cutoffs based on all community submissions — category-wise.',
  },
];

const FAQS = [
  {
    q: 'Is this the official cutoff?',
    a: 'No. These are community-predicted cutoffs based on marks submitted by aspirants like you. The official cutoff is declared by the recruiting body (JKSSB, SSC, etc.) with the result.',
  },
  {
    q: 'How accurate is the prediction?',
    a: 'Accuracy improves with more submissions. With fewer than 50 submissions the confidence is low; above 200 it becomes quite reliable. Always treat it as an estimate.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'Viewing cutoffs and leaderboards is completely free and requires no login. You only need an account to submit your own marks.',
  },
  {
    q: 'Can I submit marks for multiple exams?',
    a: 'Yes! You can submit marks for as many exams as you have appeared in. You get one submission per post, but you can update it anytime.',
  },
  {
    q: 'Are my individual marks visible to others?',
    a: 'No. Your exact score is never shown publicly. Only aggregated statistics (distribution graph, cutoff range, total submissions) are visible to everyone.',
  },
  {
    q: 'What are RBA and ALC categories?',
    a: 'These are J&K-specific reservation categories. RBA stands for Residents of Backward Areas and ALC stands for Adjacent Locality Candidates. They are only applicable in JKSSB and JKPSC exams.',
  },
  {
    q: 'Which exams are supported?',
    a: 'Currently JKSSB, JKPSC, and SSC exams are listed. The admin can add any new exam directly from the admin panel without any code changes.',
  },
  {
    q: 'How is the cutoff calculated?',
    a: 'We sort all submitted scores in descending order and apply percentile-based thresholds: Optimistic (top 15%), Likely (top 20%), and Conservative (top 25%) — matching typical vacancy-to-applicant ratios.',
  },
];

export default function HomePage() {
  const [exams, setExams] = useState([]);
  const [stats, setStats] = useState({ totalExams: 0, totalSubmissions: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [openFaq, setOpenFaq] = useState(null);

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

          {/* ── Hero ── */}
          <div style={{ textAlign: 'center', padding: '48px 0 56px' }}>
            <div className="hero-eyebrow" style={{ marginBottom: '20px' }}>
              🏆 Community-Powered · Free · For J&K Aspirants
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '16px' }}>
              Know Your <span className="text-gradient">Expected Cutoff</span>
              <br />Before Results
            </h1>
            <p style={{
              fontSize: '1.05rem', color: 'var(--text-secondary)',
              maxWidth: '520px', margin: '0 auto', lineHeight: 1.7,
            }}>
              Thousands of aspirants submit their marks after every exam.
              We crunch the numbers to give you realistic, category-wise cutoff predictions.
            </p>
          </div>



          {/* ── Exams ── */}
          <div style={{ marginBottom: '72px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '20px', gap: '12px', flexWrap: 'wrap',
            }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Exams</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Click any exam to see cutoff predictions and submit your marks
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {BODIES.map(b => (
                  <button
                    key={b}
                    className={`btn btn-sm ${filter === b ? 'btn-secondary' : 'btn-ghost'}`}
                    onClick={() => setFilter(b)}
                  >{b}</button>
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

          {/* ── How it works ── */}
          <div style={{ marginBottom: '72px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '1.6rem', marginBottom: '8px' }}>How It Works</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '36px', fontSize: '0.95rem' }}>
              Three simple steps — done in under a minute
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {HOW_IT_WORKS.map((item, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: '28px 24px', position: 'relative',
                }}>
                  {/* Step number watermark */}
                  <div style={{
                    position: 'absolute', top: '16px', right: '20px',
                    fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 900,
                    color: 'rgba(59,130,246,0.08)', lineHeight: 1, userSelect: 'none',
                  }}>0{i + 1}</div>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: 'var(--radius-md)',
                    background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', marginBottom: '18px',
                  }}>{item.icon}</div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>{item.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── FAQs ── */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '1.6rem', marginBottom: '8px' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '36px', fontSize: '0.95rem' }}>
              Everything you need to know about RankJK
            </p>
            <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid',
                    borderColor: openFaq === i ? 'rgba(59,130,246,0.4)' : 'var(--border)',
                    borderRadius: 'var(--radius-md)', overflow: 'hidden',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', gap: '16px',
                      padding: '18px 20px', background: 'none', border: 'none',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {faq.q}
                    </span>
                    <span style={{
                      fontSize: '1.2rem', color: 'var(--text-muted)', flexShrink: 0,
                      transform: openFaq === i ? 'rotate(45deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}>+</span>
                  </button>
                  {openFaq === i && (
                    <div style={{
                      padding: '0 20px 18px',
                      fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7,
                      borderTop: '1px solid var(--border)',
                      paddingTop: '14px',
                    }}>
                      {faq.a}
                    </div>
                  )}
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
