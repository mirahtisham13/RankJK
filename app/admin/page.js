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
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('exams');

  // Exams tab state
  const [exams, setExams] = useState([]);
  const [showExamForm, setShowExamForm] = useState(false);
  const [examForm, setExamForm] = useState({ name: '', short_name: '', description: '', conducting_body: 'JKSSB', total_marks: 100, total_vacancies: '' });
  const [examSaving, setExamSaving] = useState(false);

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
      try {
        const p = await getProfile(session.user.id);
        if (!p) {
          setError('Your profile was not found. Make sure you have run the Supabase schema SQL first.');
          setLoading(false);
          return;
        }
        if (!p.is_admin) {
          setError('You do not have admin access. Ask the site owner to run:\n\nUPDATE profiles SET is_admin = TRUE WHERE id = \'' + session.user.id + '\';');
          setLoading(false);
          return;
        }
        setProfile(p);
        loadExams();
        setLoading(false);
      } catch (err) {
        setError('Failed to load admin panel: ' + err.message + '\n\nMake sure you have run the Supabase schema SQL from supabase/schema.sql');
        setLoading(false);
      }
    });
  }, [router]);

  async function loadExams() {
    const data = await getExams({ activeOnly: false });
    setExams(data || []);
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
      // Create exam
      const exam = await createExam({
        name: examForm.name,
        short_name: examForm.short_name,
        description: examForm.description,
        conducting_body: examForm.conducting_body,
        total_vacancies: examForm.total_vacancies ? parseInt(examForm.total_vacancies) : null,
        is_active: true,
      });
      // Auto-create a single post with same name
      await createPost({
        exam_id: exam.id,
        name: examForm.short_name,
        total_marks: parseInt(examForm.total_marks),
        vacancies: examForm.total_vacancies ? parseInt(examForm.total_vacancies) : null,
        is_active: true,
      });
      setExams(prev => [exam, ...prev]);
      setShowExamForm(false);
      setExamForm({ name: '', short_name: '', description: '', conducting_body: 'JKSSB', total_marks: 100, total_vacancies: '' });
      showMsg('✅ Exam created successfully!');
    } catch (err) {
      showMsg('❌ Error: ' + err.message);
    } finally {
      setExamSaving(false);
    }
  }

  async function handleDeleteExam(id) {
    if (!confirm('Delete this exam and all its submissions? This cannot be undone.')) return;
    try {
      await deleteExam(id);
      setExams(prev => prev.filter(e => e.id !== id));
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

  if (error) {
    return (
      <>
        <Navbar />
        <main className="page-wrapper">
          <div className="container" style={{ maxWidth: '640px' }}>
            <div style={{ textAlign: 'center', padding: '60px 0 32px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
              <h2 style={{ marginBottom: '16px' }}>Admin Access Required</h2>
            </div>
            <div className="alert alert-error" style={{ marginBottom: '24px', whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
              {error}
            </div>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>How to fix</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
                <strong>Step 1:</strong> Make sure you have run <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>supabase/schema.sql</code> in your Supabase SQL Editor.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
                <strong>Step 2:</strong> Run this in Supabase → SQL Editor to grant yourself admin access:
              </p>
              <pre style={{
                background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                padding: '16px', fontSize: '0.82rem', color: '#4ade80', overflowX: 'auto'
              }}>
{`UPDATE profiles SET is_admin = TRUE
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'your@email.com'
);`}
              </pre>
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
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>{exams.length} exams</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowExamForm(v => !v)}>
                  {showExamForm ? 'Cancel' : '+ New Exam'}
                </button>
              </div>

              {/* Create Exam Form */}
              {showExamForm && (
                <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
                  <h4 style={{ marginBottom: '18px', fontSize: '1rem' }}>Add New Exam</h4>
                  <form onSubmit={handleCreateExam} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Full Exam Name *</label>
                      <input className="form-input" value={examForm.name} onChange={e => setExamForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. JKSSB Finance Dept Junior Assistant 2025" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Short Name *</label>
                      <input className="form-input" value={examForm.short_name} onChange={e => setExamForm(f => ({ ...f, short_name: e.target.value }))} placeholder="e.g. JKSSB Jr. Assistant" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Conducting Body *</label>
                      <select className="form-input form-select" value={examForm.conducting_body} onChange={e => setExamForm(f => ({ ...f, conducting_body: e.target.value }))}>
                        {CONDUCTING_BODIES.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Marks *</label>
                      <input type="number" className="form-input" value={examForm.total_marks} onChange={e => setExamForm(f => ({ ...f, total_marks: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Vacancies</label>
                      <input type="number" className="form-input" value={examForm.total_vacancies} onChange={e => setExamForm(f => ({ ...f, total_vacancies: e.target.value }))} placeholder="optional" />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Description</label>
                      <input className="form-input" value={examForm.description} onChange={e => setExamForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description (optional)" />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2' }} disabled={examSaving}>
                      {examSaving ? <span className="spinner" /> : '✓ Create Exam'}
                    </button>
                  </form>
                </div>
              )}

              {/* Exams Table */}
              {exams.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📋</div><h3>No exams yet</h3><p>Add your first exam above.</p></div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Exam</th>
                        <th>Body</th>
                        <th>Vacancies</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exams.map(exam => (
                        <tr key={exam.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{exam.short_name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{exam.name}</div>
                          </td>
                          <td><span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>{exam.conducting_body}</span></td>
                          <td style={{ color: 'var(--text-muted)' }}>{exam.total_vacancies || '—'}</td>
                          <td>
                            <span className={`badge ${exam.is_active ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '0.72rem' }}>
                              {exam.is_active ? 'Active' : 'Hidden'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                className="btn btn-sm"
                                style={{
                                  background: exam.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                                  color: exam.is_active ? 'var(--warning)' : 'var(--success)',
                                  border: `1px solid ${exam.is_active ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`,
                                }}
                                onClick={() => handleToggleExamActive(exam)}
                              >
                                {exam.is_active ? 'Hide' : 'Show'}
                              </button>
                              <button className="btn btn-sm btn-danger" onClick={() => handleDeleteExam(exam.id)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
