import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  Lock, 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import staticStore from '../staticStore';

export default function PublicVisitorView({ onReturnHome }) {
  const rawPath = window.location.pathname || '/';
  const isBioRoute = rawPath.startsWith('/bio/');
  const shortCode = rawPath.replace(/^\//, '').split('/')[0].split('?')[0];

  // Bio state initialized directly
  const [bioData] = useState(() => {
    if (isBioRoute) {
      try {
        return staticStore.getBio().bio;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Link Redirection State
  const [evalResult, setEvalResult] = useState(null);
  const [loading, setLoading] = useState(() => !isBioRoute && Boolean(shortCode));
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [countdown, setCountdown] = useState(2);

  const evaluateAndTrack = useCallback(async (code, pass = '') => {
    setLoading(true);
    setPasswordError('');

    try {
      // Detect client device
      const width = window.innerWidth;
      const device = width < 640 ? 'mobile' : (width < 1024 ? 'tablet' : 'desktop');
      const isQr = window.location.search.includes('qr=1');

      const result = await staticStore.evaluateRedirect(code, {
        device,
        password: pass
      });

      setEvalResult(result);

      if (result.status === 302 && result.destination) {
        // Log telemetry visit into static store
        try {
          staticStore.simulateClick({
            code,
            device,
            referrer: document.referrer || 'Direct',
            isQr
          });
        } catch {
          // ignore
        }

        // Start countdown to redirect
        let timer = 2;
        const interval = setInterval(() => {
          timer -= 1;
          setCountdown(timer);
          if (timer <= 0) {
            clearInterval(interval);
            window.location.href = result.destination;
          }
        }, 1000);
      }
    } catch (err) {
      setEvalResult({ status: 500, type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  // Run redirection evaluation on mount if shortCode route
  useEffect(() => {
    let active = true;
    if (!isBioRoute && shortCode) {
      const timer = setTimeout(() => {
        if (active) {
          evaluateAndTrack(shortCode);
        }
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, [isBioRoute, shortCode, evaluateAndTrack]);

  const handleUnlockPassword = async (e) => {
    e.preventDefault();
    if (!password) {
      setPasswordError('Please enter the password key.');
      return;
    }
    evaluateAndTrack(shortCode, password);
  };

  // 1. PUBLIC LINK-IN-BIO PAGE
  if (isBioRoute) {
    const b = bioData || {
      title: 'Alex Vance',
      bio: 'Growth Engineer & Full-Stack Architect building next-gen web systems.',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      links: [
        { title: '🚀 Summer 2026 Launch Showcase', url: '/summer26', subtitle: 'Live product walkthrough' },
        { title: '📱 Get LinkPulse Mobile App', url: '/get-app', subtitle: 'Direct App Store installation' },
        { title: '💼 Portfolio & Open Source Work', url: 'https://github.com', subtitle: 'Check my recent contributions' }
      ],
      socials: {
        twitter: 'https://twitter.com',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com'
      }
    };

    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 10%, #1e1b4b 0%, #0b0f19 50%, #030712 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem 1rem',
        position: 'relative'
      }}>
        {/* Floating Top Banner */}
        <div style={{
          position: 'fixed',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-medium)',
          borderRadius: '999px',
          padding: '0.4rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={14} color="#818cf8" />
            <span>Public Link-in-Bio</span>
          </span>
          <button
            onClick={onReturnHome}
            className="btn-ghost"
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', color: 'white' }}
          >
            <ArrowLeft size={13} />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Profile Container */}
        <div style={{
          maxWidth: '480px',
          width: '100%',
          marginTop: '3.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          {b.avatar_url ? (
            <img 
              src={b.avatar_url} 
              alt={b.title} 
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #818cf8',
                boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)',
                marginBottom: '1rem'
              }}
            />
          ) : (
            <div style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              background: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              color: 'white',
              marginBottom: '1rem'
            }}>
              {b.title?.charAt(0) || 'L'}
            </div>
          )}

          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'white', marginBottom: '0.35rem' }}>
            {b.title}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1.75rem', maxWidth: '380px' }}>
            {b.bio}
          </p>

          {/* Links Card Stack */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
            {b.links && b.links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover-bright"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(30, 41, 59, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '1rem 1.25rem',
                  textDecoration: 'none',
                  color: 'white',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{link.title}</div>
                  {link.subtitle && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                      {link.subtitle}
                    </div>
                  )}
                </div>
                <ExternalLink size={16} color="#818cf8" />
              </a>
            ))}
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            ⚡ Powered by LinkPulse (100% Client-Side Engine)
          </div>
        </div>
      </div>
    );
  }

  // 2. SHORT CODE REDIRECTION INTERSTITIAL
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      background: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0b0f19 60%, #030712 100%)'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        borderRadius: '24px'
      }}>
        {/* State: Loading */}
        {loading && (
          <>
            <div className="live-dot" style={{ width: '22px', height: '22px' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Resolving Redirection Rules...</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Checking expiration schedules, safety blocklists, and device parameters.
            </p>
          </>
        )}

        {/* State: 302 Active Redirect */}
        {!loading && evalResult?.status === 302 && (
          <>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={32} color="#10b981" />
            </div>

            <div>
              <span className="code-chip" style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'inline-block' }}>
                /{shortCode}
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Redirecting to Destination</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Taking you to the official target in <strong>{countdown}s</strong>...
              </p>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: '#818cf8',
              wordBreak: 'break-all',
              width: '100%'
            }}>
              {evalResult.destination}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              <a
                href={evalResult.destination}
                className="btn-primary"
                style={{ flex: 1, padding: '0.7rem', justifyContent: 'center' }}
              >
                <span>Proceed Immediately</span>
                <ExternalLink size={15} />
              </a>

              <button
                onClick={onReturnHome}
                className="btn-secondary"
                style={{ padding: '0.7rem 1.1rem' }}
              >
                Dashboard
              </button>
            </div>
          </>
        )}

        {/* State: 401 Password Required */}
        {!loading && evalResult?.status === 401 && (
          <form onSubmit={handleUnlockPassword} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Lock size={30} color="#f59e0b" />
            </div>

            <div>
              <span className="code-chip" style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'inline-block' }}>
                /{shortCode}
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Password Protected Link</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                This resource requires an authorization key to unlock.
              </p>
            </div>

            <div style={{ width: '100%', textAlign: 'left' }}>
              <input
                type="password"
                className="glass-input"
                placeholder="Enter password (hint: pulse2026)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
              {passwordError && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                  {passwordError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              <button
                type="submit"
                className="btn-primary"
                style={{ flex: 1, padding: '0.7rem', justifyContent: 'center' }}
              >
                <Lock size={15} />
                <span>Unlock & Proceed</span>
              </button>

              <button
                type="button"
                onClick={onReturnHome}
                className="btn-secondary"
                style={{ padding: '0.7rem 1.1rem' }}
              >
                Home
              </button>
            </div>
          </form>
        )}

        {/* State: 410 or 404 Error / Blocked / Expired / Capped */}
        {!loading && evalResult && evalResult.status !== 302 && evalResult.status !== 401 && (
          <>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldAlert size={32} color="#ef4444" />
            </div>

            <div>
              <span className="badge badge-abuse" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                HTTP {evalResult.status} {evalResult.type?.toUpperCase()}
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Link Unavailable</h2>
              <p style={{ fontSize: '0.85rem', color: '#fca5a5', marginTop: '0.45rem', lineHeight: '1.4' }}>
                {evalResult.message || 'This short link cannot be accessed at this time.'}
              </p>
            </div>

            <button
              onClick={onReturnHome}
              className="btn-primary"
              style={{ width: '100%', padding: '0.7rem', justifyContent: 'center', marginTop: '0.5rem' }}
            >
              <ArrowLeft size={15} />
              <span>Return to LinkPulse Dashboard</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
