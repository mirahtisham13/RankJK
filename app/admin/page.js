'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { getProfile, getAllSubmissions, getAllProfiles, deleteSubmission, setAdminStatus, createExam, createPost, deleteExam, deletePost, getExams, getPostsByExam, updateExam } from '@/lib/db';
import { CONDUCTING_BODIES } from '@/lib/constants';

const TABS = ['exams', 'submissions', 'users'];

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('exams');

  // Exams tab state
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examPosts, setExamPosts] = useState([]);
  const [showExamForm, setShowExamForm] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [examForm, setExamForm] = useState({ name: '', short_name: '', description: '', conducting_body: 'JKSSB', total_vacancies: '' });
  const [postForm, setPostForm] = useState({ name: '', total_marks: 100, vacancies: '' });
  const [examSaving, setExamSaving] = useState(false);
  const [postSaving, setPostSaving] = useState(false);

  // Submissions tab state
  const [submissions, setSubmissions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);

  // Users tab state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { router.push('/auth'); return; }
      setUser(session.user);
      const p = await getProfile(session.user.id);
      if (!p?.is_admin) { router.push('/'); return; }
      setProfile(p);
      loadExams();
      setLoading(false);
    });
  }, [router]);

  async function loadExams() {
    const data = await getExams({ activeOnly: false });
    setExams(data || []);
    if (data?.[0] && !selectedExam) {
      setSelectedExam(data[0]);
      loadPostsForExam(data[0].id);
    }
  }

  async function loadPostsForExam(examId) {
    const data = await getPostsByExam(examId);
    setExamPosts(data || []);
  }

  async function loadSubmissions() {
    setSubsLoading(true);
    const data = await getAllSubmissions({ limit: 200 });
    setSubmissions(data || []);
    setSubsLoading(false);
  }

  async function loadUsers() {
    setUsersLoading(true);
    const data = await getAllProfiles({ limit: 200 });
    setUsers(data || []);
    setUsersLoading(false);
  }

  useEffect(() => {
    if (activeTab === 'submissions') loadSubmissions();
    if (activeTab === 'users') loadUsers();
  }, [activeTab]);

  function showMsg(msg) {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3500);
  }

  // ---- Exam Actions ----
  async function handleCreateExam(e) {
    e.preventDefault();
    setExamSaving(true);
    try {
      const exam = await createExam({
        ...examForm,
        total_vacancies: examForm.total_vacancies ? parseInt(examForm.total_vacancies) : null,
        is_active: true,
      });
      setExams(prev => [exam, ...prev]);
      setShowExamForm(false);
      setExamForm({ name: '', short_name: '', description: '', conducting_body: 'JKSSB', total_vacancies: '' });
      showMsg('✅ Exam created successfully!');
    } catch (err) {
      showMsg('❌ Error: ' + err.message);
    } finally {
      setExamSaving(false);
    }
  }

  async function handleDeleteExam(id) {
    if (!confirm('Delete this exam and ALL its posts and submissions? This cannot be undone.')) return;
    try {
      await deleteExam(id);
      setExams(prev => prev.filter(e => e.id !== id));
      if (selectedExam?.id === id) { setSelectedExam(null); setExamPosts([]); }
      showMsg('✅ Exam deleted.');
    } catch (err) {
      showMsg('❌ Error: ' + err.message);
    }
  }

  async function handleToggleExamActive(exam) {
    try {
      await updateExam(exam.id, { is_active: !exam.is_active });
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, is_active: !e.is_active } : e));
      showMsg(`✅ Exam ${!exam.is_active ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      showMsg('❌ Error: ' + err.message);
    }
  }

  // ---- Post Actions ----
  async function handleCreatePost(e) {
    e.preventDefault();
    if (!selectedExam) return;
    setPostSaving(true);
    try {
      const post = await createPost({
        exam_id: selectedExam.id,
        name: postForm.name,
        total_marks: parseInt(postForm.total_marks),
        vacancies: postForm.vacancies ? parseInt(postForm.vacancies) : null,
        is_active: true,
      });
      setExamPosts(prev => [...prev, post]);
      setShowPostForm(false);
      setPostForm({ name: '', total_marks: 100, vacancies: '' });
      showMsg('✅ Post created!');
    } catch (err) {
      showMsg('❌ Error: ' + err.message);
    } finally {
      setPostSaving(false);
    }
  }

  async function handleDeletePost(id) {
    if (!confirm('Delete this post? All submissions for it will also be deleted.')) return;
    try {
      await deletePost(id);
      setExamPosts(prev => prev.filter(p => p.id !== id));
      showMsg('✅ Post deleted.');
    } catch (err) {
      showMsg('❌ Error: ' + err.message);
    }
  }

  // ---- Submission Actions ----
  async function handleDeleteSubmission(id) {
    if (!confirm('Delete this submission?')) return;
    try {
      await deleteSubmission(id);
      setSubmissions(prev => prev.filter(s => s.id !== id));
      showMsg('✅ Submission deleted.');
    } catch (err) {
      showMsg('❌ Error: ' + err.message);
    }
  }

  // ---- User Actions ----
  async function handleToggleAdmin(user) {
    if (!confirm(`${user.is_admin ? 'Remove admin from' : 'Make admin'} this user?`)) return;
    try {
      await setAdminStatus(user.id, !user.is_admin);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_admin: !u.is_admin } : u));
      showMsg(`✅ Admin status updated.`);
    } catch (err) {
      showMsg('❌ Error: ' + err.message);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page-wrapper">
          <div className="container">
            <div className="skeleton skeleton-title" style={{ marginBottom: '24px' }} />
            <div className="skeleton skeleton-card" />
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

          {/* Header */}
          <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem' }}>⚙️ <span className="text-gradient">Admin Panel</span></h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>Manage exams, submissions, and users</p>
            </div>
            <span className="badge badge-purple">Admin: {profile?.full_name}</span>
          </div>

          {actionMsg && (
            <div
              className={`alert ${actionMsg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}
              style={{ marginBottom: '24px' }}
            >
              {actionMsg}
            </div>
          )}

          {/* Tabs */}
          <div className="tabs" style={{ width: '100%', marginBottom: '32px' }}>
            {TABS.map(tab => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                style={{ flex: 1, textTransform: 'capitalize' }}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'exams' ? '📋 Exams' : tab === 'submissions' ? '📊 Submissions' : '👥 Users'}
              </button>
            ))}
          </div>

          {/* ======== EXAMS TAB ======== */}
          {activeTab === 'exams' && (
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>

              {/* Exam List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>EXAMS ({exams.length})</h3>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowExamForm(v => !v)}>
                    {showExamForm ? 'Cancel' : '+ New Exam'}
                  </button>
                </div>

                {/* Create Exam Form */}
                {showExamForm && (
                  <div className="card" style={{ marginBottom: '16px', padding: '20px' }}>
                    <h4 style={{ marginBottom: '16px', fontSize: '0.95rem' }}>New Exam</h4>
                    <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Exam Name *</label>
                        <input className="form-input" value={examForm.name} onChange={e => setExamForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. JKSSB Finance Dept Exam 2025" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Short Name *</label>
                        <input className="form-input" value={examForm.short_name} onChange={e => setExamForm(f => ({ ...f, short_name: e.target.value }))} placeholder="e.g. JKSSB Finance" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Conducting Body *</label>
                        <select className="form-input form-select" value={examForm.conducting_body} onChange={e => setExamForm(f => ({ ...f, conducting_body: e.target.value }))}>
                          {CONDUCTING_BODIES.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-input" value={examForm.description} onChange={e => setExamForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Brief description..." />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Total Vacancies</label>
                        <input type="number" className="form-input" value={examForm.total_vacancies} onChange={e => setExamForm(f => ({ ...f, total_vacancies: e.target.value }))} placeholder="e.g. 500" />
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={examSaving}>
                        {examSaving ? <span className="spinner" /> : '✓ Create Exam'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Exam Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {exams.map(exam => (
                    <div
                      key={exam.id}
                      style={{
                        padding: '12px 14px', borderRadius: 'var(--radius-md)',
                        border: '1px solid', cursor: 'pointer',
                        borderColor: selectedExam?.id === exam.id ? 'var(--brand-blue)' : 'var(--border)',
                        background: selectedExam?.id === exam.id ? 'rgba(59,130,246,0.08)' : 'var(--bg-card)',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => { setSelectedExam(exam); loadPostsForExam(exam.id); }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{exam.short_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {exam.conducting_body}
                            {!exam.is_active && <span style={{ color: 'var(--danger)', marginLeft: '6px' }}>● Hidden</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                          <button
                            className="btn btn-sm"
                            style={{
                              background: exam.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                              color: exam.is_active ? 'var(--warning)' : 'var(--success)',
                              border: `1px solid ${exam.is_active ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`,
                              padding: '4px 8px', fontSize: '0.7rem'
                            }}
                            onClick={() => handleToggleExamActive(exam)}
                          >
                            {exam.is_active ? 'Hide' : 'Show'}
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                            onClick={() => handleDeleteExam(exam.id)}
                          >
                            Del
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Posts panel */}
              <div>
                {selectedExam ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '1rem' }}>{selectedExam.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
                          {selectedExam.description}
                        </p>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => setShowPostForm(v => !v)}>
                        {showPostForm ? 'Cancel' : '+ Add Post'}
                      </button>
                    </div>

                    {showPostForm && (
                      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
                        <h4 style={{ marginBottom: '14px', fontSize: '0.95rem' }}>New Post for {selectedExam.short_name}</h4>
                        <form onSubmit={handleCreatePost} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}>
                            <label className="form-label">Post Name *</label>
                            <input className="form-input" value={postForm.name} onChange={e => setPostForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Accounts Assistant" required />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Total Marks *</label>
                            <input type="number" className="form-input" value={postForm.total_marks} onChange={e => setPostForm(f => ({ ...f, total_marks: e.target.value }))} required />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Vacancies</label>
                            <input type="number" className="form-input" value={postForm.vacancies} onChange={e => setPostForm(f => ({ ...f, vacancies: e.target.value }))} placeholder="optional" />
                          </div>
                          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }} disabled={postSaving}>
                            {postSaving ? <span className="spinner" /> : '✓ Add'}
                          </button>
                        </form>
                      </div>
                    )}

                    {examPosts.length === 0 ? (
                      <div className="empty-state" style={{ padding: '40px' }}>
                        <div className="empty-icon">📭</div>
                        <h3>No posts yet</h3>
                        <p>Add posts to this exam.</p>
                      </div>
                    ) : (
                      <div className="table-wrapper">
                        <table>
                          <thead>
                            <tr>
                              <th>Post Name</th>
                              <th>Total Marks</th>
                              <th>Vacancies</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {examPosts.map(post => (
                              <tr key={post.id}>
                                <td style={{ fontWeight: 600 }}>{post.name}</td>
                                <td>{post.total_marks}</td>
                                <td>{post.vacancies || '—'}</td>
                                <td>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeletePost(post.id)}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">👈</div>
                    <h3>Select an exam</h3>
                    <p>Click on an exam to manage its posts.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======== SUBMISSIONS TAB ======== */}
          {activeTab === 'submissions' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>{submissions.length} submissions</h3>
                <button className="btn btn-ghost btn-sm" onClick={loadSubmissions}>🔄 Refresh</button>
              </div>
              {subsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: '52px' }} />)}
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Exam</th>
                        <th>Post</th>
                        <th>Score</th>
                        <th>Category</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(sub => (
                        <tr key={sub.id}>
                          <td style={{ fontSize: '0.85rem' }}>{sub.profiles?.full_name || 'Anonymous'}</td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {sub.posts?.exams?.short_name || '—'}
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{sub.posts?.name || '—'}</td>
                          <td style={{ fontWeight: 700 }}>{sub.score}</td>
                          <td><span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{sub.category}</span></td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {new Date(sub.created_at).toLocaleDateString('en-IN')}
                          </td>
                          <td>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSubmission(sub.id)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======== USERS TAB ======== */}
          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>{users.length} registered users</h3>
                <button className="btn btn-ghost btn-sm" onClick={loadUsers}>🔄 Refresh</button>
              </div>
              {usersLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '52px' }} />)}
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 500 }}>{u.full_name || '—'}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{u.phone || '—'}</td>
                          <td>
                            <span className={`badge ${u.is_admin ? 'badge-purple' : 'badge-gray'}`}>
                              {u.is_admin ? 'Admin' : 'Member'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </td>
                          <td>
                            <button
                              className={`btn btn-sm ${u.is_admin ? 'btn-danger' : 'btn-success'}`}
                              onClick={() => handleToggleAdmin(u)}
                              disabled={u.id === user?.id}
                            >
                              {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
