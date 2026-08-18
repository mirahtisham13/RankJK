'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { getExamById, getSubmissionsByPost, getCutoffStats } from '@/lib/db';
import { CATEGORIES, getConfidenceLevel } from '@/lib/constants';

const CutoffChart = dynamic(() => import('@/components/CutoffChart'), { ssr: false });

function CutoffValueCard({ label, value, isMain, color = 'var(--text-primary)' }) {
  return (
    <div className={`cutoff-value-item ${isMain ? 'likely' : ''}`}>
      <div className="cutoff-value-label">{label}</div>
      <div className="cutoff-value-number" style={{ color }}>
        {value != null && !isNaN(value) ? Math.round(parseFloat(value)) : '—'}
      </div>
      <div className="cutoff-value-desc">
        {isMain ? 'Most likely' : label === 'Optimistic' ? 'Best case' : 'Worst case'}
      </div>
    </div>
  );
}

export default function PredictPage() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [submissions, setSubmissions] = useState([]);
  const [cutoffStats, setCutoffStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userScore, setUserScore] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
  }, []);

  useEffect(() => {
    getExamById(examId).then(data => {
      setExam(data);
      if (data?.posts?.length > 0) setSelectedPost(data.posts[0]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [examId]);

  useEffect(() => {
    if (!selectedPost) return;
    Promise.all([
      getSubmissionsByPost(selectedPost.id),
      getCutoffStats(selectedPost.id),
    ]).then(([subs, stats]) => {
      setSubmissions(subs || []);
      setCutoffStats(stats || []);

      // Get user's own score if logged in
      if (user) {
        supabase
          .from('submissions')
          .select('score, category')
          .eq('post_id', selectedPost.id)
          .eq('user_id', user.id)
          .maybeSingle()
          .then(({ data }) => setUserScore(data));
      }
    });
  }, [selectedPost, user]);

  const categoryStats = cutoffStats.find(s => s.category === selectedCategory);
  const categorySubmissions = submissions.filter(s => s.category === selectedCategory);
  const confidence = getConfidenceLevel(categoryStats?.submission_count || 0);

  // Calculate user rank
  const userRank = userScore && userScore.category === selectedCategory
    ? categorySubmissions.filter(s => parseFloat(s.score) > parseFloat(userScore.score)).length + 1
    : null;

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page-wrapper">
          <div className="container">
            <div className="skeleton skeleton-title" style={{ marginBottom: '16px' }} />
            <div className="skeleton skeleton-card" />
          </div>
        </main>
      </>
    );
  }

  if (!exam) {
    return (
      <>
        <Navbar />
        <main className="page-wrapper">
          <div className="container">
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>Exam not found</h3>
              <Link href="/exams" className="btn btn-primary">Browse Exams</Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="page-wrapper">
        <div className="container">

          {/* Breadcrumb */}
          <div style={{ marginBottom: '24px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <Link href="/exams" style={{ color: 'var(--text-accent)' }}>Exams</Link>
            {' / '}
            <span>{exam.short_name}</span>
          </div>

          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <span className="badge badge-blue" style={{ marginBottom: '10px' }}>
                  {exam.conducting_body}
                </span>
                <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: '8px' }}>
                  {exam.name}
                </h1>
                {exam.description && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{exam.description}</p>
                )}
              </div>
              <Link href={`/submit?exam=${exam.id}`} className="btn btn-primary">
                📊 Submit My Marks
              </Link>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'start' }}>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Post Selector */}
              <div className="card">
                <h3 style={{ fontSize: '0.875rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>SELECT POST</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {exam.posts?.map(post => (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      style={{
                        padding: '10px 14px', borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        borderColor: selectedPost?.id === post.id ? 'var(--brand-blue)' : 'transparent',
                        background: selectedPost?.id === post.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                        color: selectedPost?.id === post.id ? 'var(--text-accent)' : 'var(--text-secondary)',
                        textAlign: 'left', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
                        transition: 'all 0.2s'
                      }}
                    >
                      {post.name}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {post.vacancies && `${post.vacancies} vacancies`} · out of {post.total_marks}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Selector */}
              <div className="card">
                <h3 style={{ fontSize: '0.875rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>CATEGORY</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {CATEGORIES.map(cat => {
                    const catStats = cutoffStats.find(s => s.category === cat.value);
                    const count = catStats?.submission_count || 0;
                    return (
                      <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '9px 12px', borderRadius: 'var(--radius-md)',
                          border: '1px solid',
                          borderColor: selectedCategory === cat.value ? cat.color : 'transparent',
                          background: selectedCategory === cat.value ? `${cat.color}15` : 'transparent',
                          color: selectedCategory === cat.value ? cat.color : 'var(--text-secondary)',
                          cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s'
                        }}
                      >
                        <span>{cat.label}</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* User rank if logged in */}
              {userRank && (
                <div className="rank-badge">
                  <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '8px', position: 'relative' }}>
                    YOUR RANK
                  </div>
                  <div className="rank-number">#{userRank}</div>
                  <div className="rank-label">
                    among {categorySubmissions.length} in {selectedCategory}
                  </div>
                  <div style={{ position: 'relative', marginTop: '8px', fontSize: '0.85rem', opacity: 0.8 }}>
                    Your score: {userScore.score}
                  </div>
                </div>
              )}

              {/* Submit CTA if not submitted */}
              {!userRank && (
                <Link href={`/submit?exam=${exam.id}`} className="btn btn-secondary w-full">
                  + Submit Your Marks
                </Link>
              )}
            </div>

            {/* Main content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Confidence */}
              <div className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '12px', height: '12px', borderRadius: '50%',
                  background: confidence.color, boxShadow: `0 0 8px ${confidence.color}`,
                  animation: 'pulse-glow 2s infinite', flexShrink: 0
                }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: confidence.color }}>
                    {confidence.label}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {categoryStats?.submission_count || 0} submissions in {selectedCategory} for {selectedPost?.name}
                    {' — '}{confidence.desc}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <div className="confidence-bar" style={{ width: '120px' }}>
                    <div
                      className="confidence-bar-fill"
                      style={{
                        width: `${Math.min(100, ((categoryStats?.submission_count || 0) / 200) * 100)}%`,
                        background: confidence.color
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Cutoff Values */}
              {categoryStats ? (
                <div className="cutoff-range-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h2 style={{ fontSize: '1.1rem' }}>
                      Expected Cutoff — {selectedPost?.name} ({selectedCategory})
                    </h2>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Based on {categoryStats.submission_count} community submissions. Predicted assuming ~15–25% selection rate.
                  </p>
                  <div className="cutoff-values">
                    <CutoffValueCard label="Optimistic" value={categoryStats.cutoff_optimistic} color="var(--success)" />
                    <CutoffValueCard label="Likely" value={categoryStats.cutoff_likely} isMain color="var(--text-accent)" />
                    <CutoffValueCard label="Conservative" value={categoryStats.cutoff_conservative} color="var(--warning)" />
                  </div>

                  {/* Additional stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '20px' }}>
                    {[
                      { label: 'Highest Score', value: categoryStats.max_score },
                      { label: 'Lowest Score', value: categoryStats.min_score },
                      { label: 'Average Score', value: Math.round(categoryStats.avg_score * 10) / 10 },
                      { label: 'Median Score', value: Math.round(categoryStats.median_score * 10) / 10 },
                    ].map(item => (
                      <div key={item.label} style={{
                        textAlign: 'center', padding: '12px',
                        background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)'
                      }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                          {item.value}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                  <h3 style={{ marginBottom: '8px' }}>No submissions yet for {selectedCategory}</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Be the first to submit marks for this category!
                  </p>
                  <Link href={`/submit?exam=${exam.id}`} className="btn btn-primary">
                    Submit Now
                  </Link>
                </div>
              )}

              {/* Chart */}
              <div className="card">
                <CutoffChart
                  submissions={submissions}
                  cutoffStats={categoryStats}
                  category={selectedCategory}
                  totalMarks={selectedPost?.total_marks}
                />
              </div>

              {/* Disclaimer */}
              <div className="alert alert-warning">
                ⚠️ <strong>Disclaimer:</strong> These predictions are based on community-submitted data and are NOT official. Actual cutoffs are determined by the recruiting authority. Use this as a rough guide only.
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />

      <style>{`
        @media (max-width: 900px) {
          .predict-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
