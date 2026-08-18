'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, CONDUCTING_BODY_COLORS } from '@/lib/constants';

export default function LeaderboardPage() {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [topScores, setTopScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [examLoading, setExamLoading] = useState(true);

  useEffect(() => {
    supabase.from('exams').select('*, posts(*)').eq('is_active', true).then(({ data }) => {
      setExams(data || []);
      if (data?.[0]) {
        setSelectedExam(data[0]);
        setPosts(data[0].posts || []);
        if (data[0].posts?.[0]) setSelectedPost(data[0].posts[0]);
      }
      setExamLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedPost) return;
    setLoading(true);
    supabase
      .from('submissions')
      .select('score, category, created_at, profiles(full_name)')
      .eq('post_id', selectedPost.id)
      .eq('category', selectedCategory)
      .order('score', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setTopScores(data || []);
        setLoading(false);
      });
  }, [selectedPost, selectedCategory]);

  function handleExamChange(examId) {
    const exam = exams.find(e => e.id === examId);
    setSelectedExam(exam);
    setPosts(exam?.posts || []);
    const firstPost = exam?.posts?.[0] || null;
    setSelectedPost(firstPost);
  }

  const colors = CONDUCTING_BODY_COLORS[selectedExam?.conducting_body] || CONDUCTING_BODY_COLORS.OTHER;

  const getMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <>
      <Navbar />
      <main className="page-wrapper">
        <div className="container">
          <div className="page-title">
            <h1>🏆 <span className="text-gradient">Leaderboard</span></h1>
            <p>Top marks submitted by the community, per post and category</p>
          </div>

          {/* Filters Row */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1', minWidth: '200px' }}>
              <label className="form-label">Exam</label>
              {examLoading ? (
                <div className="skeleton" style={{ height: '44px' }} />
              ) : (
                <select
                  className="form-input form-select"
                  value={selectedExam?.id || ''}
                  onChange={e => handleExamChange(e.target.value)}
                >
                  {exams.map(e => <option key={e.id} value={e.id}>{e.short_name}</option>)}
                </select>
              )}
            </div>
            <div className="form-group" style={{ flex: '1', minWidth: '160px' }}>
              <label className="form-label">Post</label>
              <select
                className="form-input form-select"
                value={selectedPost?.id || ''}
                onChange={e => setSelectedPost(posts.find(p => p.id === e.target.value))}
                disabled={posts.length === 0}
              >
                {posts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    className={`btn btn-sm`}
                    style={{
                      background: selectedCategory === cat.value ? `${cat.color}20` : 'transparent',
                      color: selectedCategory === cat.value ? cat.color : 'var(--text-muted)',
                      border: `1px solid ${selectedCategory === cat.value ? cat.color : 'var(--border)'}`,
                    }}
                    onClick={() => setSelectedCategory(cat.value)}
                  >
                    {cat.value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Header */}
          {selectedExam && selectedPost && (
            <div style={{
              padding: '16px 20px', background: `${colors.accent}10`, borderRadius: 'var(--radius-md)',
              border: `1px solid ${colors.accent}30`, marginBottom: '24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                  {selectedExam.name} — {selectedPost.name}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {topScores.length} submissions in {selectedCategory} category
                </div>
              </div>
              <Link href={`/predict/${selectedExam.id}`} className="btn btn-sm btn-secondary">
                View Cutoff →
              </Link>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: '52px' }} />)}
            </div>
          ) : topScores.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No submissions yet</h3>
              <p>Be the first to submit marks for {selectedPost?.name} in {selectedCategory}!</p>
              <Link href={`/submit?exam=${selectedExam?.id}`} className="btn btn-primary mt-4">
                Submit Marks
              </Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Aspirant</th>
                    <th>Score</th>
                    <th>Out of</th>
                    <th>Percentage</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {topScores.map((submission, index) => (
                    <tr key={index}>
                      <td>
                        <span style={{
                          fontSize: index < 3 ? '1.2rem' : '0.9rem',
                          fontWeight: index < 3 ? 700 : 400,
                          color: index < 3 ? '#fbbf24' : 'var(--text-muted)'
                        }}>
                          {getMedal(index)}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {submission.profiles?.full_name || 'Aspirant'}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem',
                          color: index === 0 ? '#fbbf24' : 'var(--text-primary)'
                        }}>
                          {parseFloat(submission.score).toFixed(2)}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{selectedPost?.total_marks}</td>
                      <td>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '8px'
                        }}>
                          <div style={{
                            width: '60px', height: '6px', background: 'var(--border)',
                            borderRadius: 'var(--radius-full)', overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${(submission.score / selectedPost?.total_marks) * 100}%`,
                              height: '100%', background: 'var(--brand-gradient)',
                              borderRadius: 'var(--radius-full)'
                            }} />
                          </div>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {((submission.score / selectedPost?.total_marks) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {new Date(submission.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
