'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      setProfile(data);
    } catch (_) {}
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUserDropdown(false);
    router.push('/');
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/exams', label: 'Exams' },
    { href: '/leaderboard', label: 'Leaderboard' },
  ];

  const initials = (profile?.full_name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <>
      <nav className="navbar">
        <div className="container">
          <div className="navbar-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
              {/* Logo */}
              <Link href="/" className="navbar-logo">
                <div className="logo-icon">🎯</div>
                <span className="text-gradient">RankJK</span>
              </Link>

              {/* Desktop Nav */}
              <ul className="navbar-nav">
                {navLinks.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className={pathname === l.href ? 'active' : ''}>
                      {l.label}
                    </Link>
                  </li>
                ))}
                {profile?.is_admin && (
                  <li>
                    <Link href="/admin" className={pathname.startsWith('/admin') ? 'active' : ''}>
                      Admin
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Actions */}
            <div className="navbar-actions">
              {/* Telegram */}
              <a
                href="https://t.me/JKExamSpark_Official"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm hide-on-mobile"
                style={{
                  background: 'linear-gradient(135deg, #229ED9, #1a7db5)',
                  color: '#fff', border: 'none', gap: '6px', display: 'flex',
                  alignItems: 'center', fontSize: '0.85rem', padding: '8px 14px',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.24 13.766l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.908.793z"/>
                </svg>
                Join Telegram
              </a>

              {user ? (
                <div style={{ position: 'relative' }}>
                  <div
                    className="user-avatar"
                    onClick={() => setUserDropdown(!userDropdown)}
                    title={profile?.full_name || user.email}
                  >
                    {initials}
                  </div>
                  {userDropdown && (
                    <div style={{
                      position: 'absolute', top: '44px', right: 0, minWidth: '200px',
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)', padding: '8px', zIndex: 200,
                      boxShadow: 'var(--shadow-lg)'
                    }}>
                      <div style={{ padding: '10px 12px 14px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{profile?.full_name || 'User'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{user.email}</div>
                      </div>
                      <Link href="/profile" onClick={() => setUserDropdown(false)} style={{
                        display: 'block', padding: '9px 12px', borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem', color: 'var(--text-secondary)',
                        transition: 'all 0.2s'
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        👤 My Profile
                      </Link>
                      {profile?.is_admin && (
                        <Link href="/admin" onClick={() => setUserDropdown(false)} style={{
                          display: 'block', padding: '9px 12px', borderRadius: 'var(--radius-md)',
                          fontSize: '0.875rem', color: 'var(--text-secondary)',
                          transition: 'all 0.2s'
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          ⚙️ Admin Panel
                        </Link>
                      )}
                      <button onClick={handleSignOut} style={{
                        display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px',
                        borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--danger)',
                        background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        marginTop: '4px', borderTop: '1px solid var(--border)', paddingTop: '12px'
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/auth" className="btn btn-ghost btn-sm hide-on-mobile">Log In</Link>
                  <Link href="/auth?tab=signup" className="btn btn-primary btn-sm hide-on-mobile">Sign Up</Link>
                </>
              )}

              {/* Hamburger */}
              <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
                <span style={{ transform: menuOpen ? 'rotate(45deg) translateY(7px)' : '' }} />
                <span style={{ opacity: menuOpen ? 0 : 1 }} />
                <span style={{ transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : '' }} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        {navLinks.map(l => (
          <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
            {l.label}
          </Link>
        ))}
        {profile?.is_admin && (
          <Link href="/admin" onClick={() => setMenuOpen(false)}>⚙️ Admin Panel</Link>
        )}
        <a
          href="https://t.me/JKExamSpark_Official"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMenuOpen(false)}
          style={{ color: '#229ED9', fontWeight: 600 }}
        >
          📢 Join Telegram Group
        </a>
        <hr className="divider" style={{ margin: '8px 0' }} />
        {user ? (
          <>
            <Link href="/profile" onClick={() => setMenuOpen(false)}>👤 My Profile</Link>
            <button onClick={handleSignOut} style={{
              textAlign: 'left', padding: '12px 16px', borderRadius: 'var(--radius-md)',
              fontSize: '0.95rem', color: 'var(--danger)', background: 'none', border: 'none',
              cursor: 'pointer'
            }}>
              🚪 Sign Out
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '8px', padding: '8px 0' }}>
            <Link href="/auth" className="btn btn-ghost w-full" onClick={() => setMenuOpen(false)}>Log In</Link>
            <Link href="/auth?tab=signup" className="btn btn-primary w-full" onClick={() => setMenuOpen(false)}>Sign Up</Link>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {userDropdown && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={() => setUserDropdown(false)} />
      )}
    </>
  );
}
