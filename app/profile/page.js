'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { getUserSubmissions, updateProfile, getProfile } from '@/lib/db';
import { CONDUCTING_BODY_COLORS } from '@/lib/constants';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '' });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        router.push('/auth');
        return;
      }
      setUser(session.user);
      const [profileData, subsData] = await Promise.all([
        getProfile(session.user.id),
        getUserSubmissions(session.user.id),
      ]);
      setProfile(profileData);
      setSubmissions(subsData || []);
      setEditForm({ full_name: profileData?.full_name || '', phone: profileData?.phone || '' });
      setLoading(false);
    });
  }, [router]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(user.id, editForm);
      setProfile(p => ({ ...p, ...editForm }));
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page-wrapper">
          <div className="container">
            <div className="skeleton skeleton-title" style={{ marginBottom: '16px' }} />
            <div className="grid-2">
              <div className="skeleton skeleton-card" />
              <div className="skeleton skeleton-card" />
            </div>
          </div>
        </main>
      </>
    );
  }

  const initials = (profile?.full_name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <>
      <Navbar />
      <main className="page-wrapper">
        <div className="container" style={{ maxWidth: '900px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: '#fff',
              boxShadow: 'var(--shadow-glow-blue)', flexShrink: 0
            }}>
              {initials}
            </div>
            <div>
              <h1 style={{ fontSize: '1.8rem' }}>
                {profile?.full_name || 'My Profile'}
                {profile?.is_admin && (
                  <span className="badge badge-purple" style={{ marginLeft: '12px', verticalAlign: 'middle' }}>
                    Admin
                  </span>
                )}
              </h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{user?.email}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '2px' }}>
                Member since {new Date(user?.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            {!editing && (
              <button className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => setEditing(true)}>
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {saveSuccess && (
            <div className="alert alert-success mb-6" style={{ marginBottom: '24px' }}>
              ✅ Profile updated successfully!
            </div>
          )}

          <div className="grid-2">
            {/* Profile Card */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '20px', color: 'var(--text-secondary)' }}>
                PROFILE DETAILS
              </h3>
              {editing ? (
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.full_name}
                      onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={editForm.phone}
                      onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? <span className="spinner" /> : '✓ Save'}
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { label: 'Full Name', value: profile?.full_name || '—' },
                    { label: 'Email', value: user?.email },
                    { label: 'Phone', value: profile?.phone || '—' },
                    { label: 'Submissions', value: submissions.length },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {item.label}
                      </div>
                      <div style={{ fontWeight: 500 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '20px', color: 'var(--text-secondary)' }}>
                ACTIVITY STATS
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: 'Exams Submitted', value: new Set(submissions.map(s => s.posts?.exam_id)).size, icon: '📋' },
                  { label: 'Total Submissions', value: submissions.length, icon: '📊' },
                  { label: 'Latest Activity', value: submissions[0] ? new Date(submissions[0].created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—', icon: '📅' },
                  { label: 'Account Status', value: profile?.is_admin ? 'Admin' : 'Member', icon: '✅' },
                ].map(item => (
                  <div key={item.label} style={{
                    background: 'var(--brand-gradient-subtle)', border: '1px solid rgba(59,130,246,0.15)',
                    borderRadius: 'var(--radius-md)', padding: '16px', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{item.icon}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', marginBottom: '4px' }}>
                      {item.value}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* My Submissions */}
          <div style={{ marginTop: '32px' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>My Submissions</h2>
            {submissions.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px' }}>
                <div className="empty-icon">📝</div>
                <h3>No submissions yet</h3>
                <p>Submit your marks to see them here.</p>
                <Link href="/submit" className="btn btn-primary mt-4">Submit Marks</Link>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Exam</th>
                      <th>Post</th>
                      <th>Score</th>
                      <th>Category</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(sub => {
                      const colors = CONDUCTING_BODY_COLORS[sub.posts?.exams?.conducting_body] || CONDUCTING_BODY_COLORS.OTHER;
                      return (
                        <tr key={sub.id}>
                          <td>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                              {sub.posts?.exams?.short_name || '—'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            {sub.posts?.name}
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                              {sub.score}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              /{sub.posts?.total_marks}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>{sub.category}</span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            {new Date(sub.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </td>
                          <td>
                            <Link
                              href={`/predict/${sub.posts?.exam_id}`}
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: '0.78rem' }}
                            >
                              View Cutoff
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
