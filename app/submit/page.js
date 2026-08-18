'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { supabase } from '@/lib/supabase';
import { getExams, getPostsByExam, submitMarks, getUserSubmissionForPost } from '@/lib/db';
import { CATEGORIES } from '@/lib/constants';

function SubmitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedExam = searchParams.get('exam');

  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [exams, setExams] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [existingSubmission, setExistingSubmission] = useState(null);

  const [form, setForm] = useState({
    examId: preSelectedExam || '',
    postId: '',
    score: '',
    category: '',
  });

  const selectedPost = posts.find(p => p.id === form.postId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    getExams().then(data => {
      setExams(data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (form.examId) {
      setPosts([]);
      setForm(f => ({ ...f, postId: '' }));
      getPostsByExam(form.examId).then(data => setPosts(data || []));
    }
  }, [form.examId]);

  useEffect(() => {
    if (user && form.postId) {
      getUserSubmissionForPost(user.id, form.postId).then(data => {
        setExistingSubmission(data);
        if (data) {
          setForm(f => ({ ...f, score: data.score.toString(), category: data.category }));
        }
      }).catch(() => {});
    } else {
      setExistingSubmission(null);
    }
  }, [user, form.postId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) { setShowAuth(true); return; }

    const score = parseFloat(form.score);
    if (!selectedPost) { setError('Please select a post.'); return; }
    if (isNaN(score) || score < 0 || score > selectedPost.total_marks) {
      setError(`Score must be between 0 and ${selectedPost.total_marks}.`);
      return;
    }
    if (!form.category) { setError('Please select your category.'); return; }

    setError(''); setSubmitting(true);
    try {
      await submitMarks({ postId: form.postId, score, category: form.category });
      setSuccess(true);
      setTimeout(() => router.push(`/predict/${form.examId}`), 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '24px' }}>✅</div>
        <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>Marks Submitted!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Your marks have been recorded. Redirecting to the cutoff predictor...
        </p>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <>
      {showAuth && (
        <AuthModal
          defaultTab="login"
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      )}

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="page-title" style={{ textAlign: 'center' }}>
          <h1>Submit Your <span className="text-gradient">Marks</span></h1>
          <p>Help your fellow aspirants by submitting your marks. All submissions are anonymous in the analytics.</p>
        </div>

        {!user && (
          <div className="alert alert-info mb-6" style={{ marginBottom: '24px' }}>
            <div>
              <strong>Login required to submit.</strong> Your marks are linked to your account to prevent duplicate submissions.{' '}
              <button onClick={() => setShowAuth(true)} style={{
                color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer',
                fontWeight: 600, textDecoration: 'underline'
              }}>
                Log in or sign up →
              </button>
            </div>
          </div>
        )}

        {existingSubmission && (
          <div className="alert alert-warning mb-6" style={{ marginBottom: '24px' }}>
            ⚠️ You already submitted marks for this post. Submitting again will update your previous entry.
          </div>
        )}

        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Exam */}
            <div className="form-group">
              <label className="form-label">Select Exam *</label>
              {loading ? (
                <div className="skeleton" style={{ height: '44px' }} />
              ) : (
                <select
                  className="form-input form-select"
                  value={form.examId}
                  onChange={e => setForm(f => ({ ...f, examId: e.target.value }))}
                  required
                >
                  <option value="">-- Choose an exam --</option>
                  {exams.map(exam => (
                    <option key={exam.id} value={exam.id}>{exam.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Post */}
            <div className="form-group">
              <label className="form-label">Select Post *</label>
              <select
                className="form-input form-select"
                value={form.postId}
                onChange={e => setForm(f => ({ ...f, postId: e.target.value }))}
                required
                disabled={!form.examId || posts.length === 0}
              >
                <option value="">-- Choose a post --</option>
                {posts.map(post => (
                  <option key={post.id} value={post.id}>
                    {post.name} (out of {post.total_marks})
                  </option>
                ))}
              </select>
              {form.examId && posts.length === 0 && (
                <span className="form-hint">Loading posts...</span>
              )}
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Your Category *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                    style={{
                      padding: '10px 8px', borderRadius: 'var(--radius-md)', border: '1px solid',
                      borderColor: form.category === cat.value ? cat.color : 'var(--border)',
                      background: form.category === cat.value ? `${cat.color}20` : 'var(--bg-input)',
                      color: form.category === cat.value ? cat.color : 'var(--text-muted)',
                      fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s', textAlign: 'center'
                    }}
                  >
                    {cat.label}
                    {cat.jkOnly && <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>J&K only</div>}
                  </button>
                ))}
              </div>
            </div>

            {/* Score */}
            <div className="form-group">
              <label className="form-label">
                Your Score *
                {selectedPost && (
                  <span className="form-hint" style={{ marginLeft: '8px' }}>
                    (out of {selectedPost.total_marks})
                  </span>
                )}
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="number"
                  className="form-input"
                  placeholder={selectedPost ? `0 – ${selectedPost.total_marks}` : 'Select a post first'}
                  value={form.score}
                  onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
                  min="0"
                  max={selectedPost?.total_marks}
                  step="0.25"
                  disabled={!form.postId}
                  required
                  style={{ flex: 1 }}
                />
                {selectedPost && form.score && (
                  <div style={{
                    padding: '8px 16px', background: 'var(--brand-gradient-subtle)',
                    borderRadius: 'var(--radius-md)', border: '1px solid rgba(59,130,246,0.2)',
                    fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap'
                  }}>
                    {((parseFloat(form.score) / selectedPost.total_marks) * 100).toFixed(1)}%
                  </div>
                )}
              </div>
              <span className="form-hint">
                Enter to 2 decimal places (e.g. 74.25). Your exact score won&apos;t be shown to others.
              </span>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={submitting}
              style={{ marginTop: '8px' }}
            >
              {submitting ? (
                <><span className="spinner" /> Submitting...</>
              ) : user ? (
                existingSubmission ? '✏️ Update My Submission' : '📊 Submit My Marks'
              ) : (
                '🔑 Login to Submit'
              )}
            </button>
          </form>
        </div>

        <div className="alert alert-info mt-4" style={{ marginTop: '16px' }}>
          <div>
            <strong>🔒 Privacy:</strong> Your individual score is never displayed publicly. Only aggregated statistics and distribution graphs are shown to other users.
          </div>
        </div>
      </div>
    </>
  );
}

export default function SubmitPage() {
  return (
    <>
      <Navbar />
      <main className="page-wrapper">
        <div className="container">
          <Suspense fallback={<div className="skeleton skeleton-title" />}>
            <SubmitContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
