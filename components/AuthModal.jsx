'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/db';

export default function AuthModal({ defaultTab = 'login', onClose, onSuccess }) {
  const [tab, setTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ email: '', password: '', confirmPassword: '', fullName: '' });

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await signIn(loginForm);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError('');
    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (signupForm.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signUp({ email: signupForm.email, password: signupForm.password, fullName: signupForm.fullName });
      setSuccess('Account created! Please check your email to confirm your account.');
    } catch (err) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {onClose && (
          <button className="modal-close" onClick={onClose}>×</button>
        )}

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '48px', height: '48px', background: 'var(--brand-gradient)',
            borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', margin: '0 auto 12px', boxShadow: 'var(--shadow-glow-blue)'
          }}>
            🎯
          </div>
          <h2 style={{ fontSize: '1.5rem' }}>
            {tab === 'login' ? 'Welcome back' : 'Join RankJK'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '6px' }}>
            {tab === 'login'
              ? 'Log in to submit and track your marks'
              : 'Create a free account to submit your marks'}
          </p>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ margin: '0 auto 24px', display: 'flex', width: '100%' }}>
          <button
            className={`tab-btn ${tab === 'login' ? 'active' : ''}`}
            style={{ flex: 1 }}
            onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
          >
            Log In
          </button>
          <button
            className={`tab-btn ${tab === 'signup' ? 'active' : ''}`}
            style={{ flex: 1 }}
            onClick={() => { setTab('signup'); setError(''); setSuccess(''); }}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}
        {success && <div className="alert alert-success mb-4">{success}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={loginForm.email}
                onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? <span className="spinner" /> : '→ Log In'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Don&apos;t have an account?{' '}
              <button type="button" onClick={() => setTab('signup')}
                style={{ color: 'var(--text-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Sign up free
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Your name"
                value={signupForm.fullName}
                onChange={e => setSignupForm(f => ({ ...f, fullName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={signupForm.email}
                onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Min. 6 characters"
                value={signupForm.password}
                onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Repeat password"
                value={signupForm.confirmPassword}
                onChange={e => setSignupForm(f => ({ ...f, confirmPassword: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? <span className="spinner" /> : '✓ Create Account'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <button type="button" onClick={() => setTab('login')}
                style={{ color: 'var(--text-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Log in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
