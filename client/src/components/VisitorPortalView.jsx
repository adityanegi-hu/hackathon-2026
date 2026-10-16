import React, { useState } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Play 
} from 'lucide-react';
import staticStore from '../staticStore';

export default function VisitorPortalView({ onSwitchRole }) {
  const [testCode, setTestCode] = useState('summer26');
  const [simDevice, setSimDevice] = useState('desktop');
  const [simPassword, setSimPassword] = useState('');
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  const sampleScenarios = [
    { code: 'summer26', label: 'Active Link (Product Showcase)', desc: 'Directs seamlessly to destination with UTM parameters' },
    { code: 'vip-deck', label: 'Password Protected Link', desc: 'Prompts with LinkPulse security unlock form (Key: pulse2026)' },
    { code: 'get-app', label: 'Device Targeted Link', desc: 'Routes iOS/Android users to App Store, desktop to web' },
    { code: 'early50', label: 'Click Capped Link (Exceeded)', desc: 'Displays 410 Cap Limit Hit notice' },
    { code: 'summit-early', label: 'Expired Link', desc: 'Displays 410 Expired notice with expiration timestamp' },
    { code: 'free-eth', label: 'Suspended Abuse Link', desc: 'Displays 410 Security Suspension notice' }
  ];

  const handleEvaluate = async (codeToTest = testCode, passwordToUse = simPassword) => {
    setEvaluating(true);
    try {
      const res = await staticStore.evaluateRedirect(codeToTest, {
        device: simDevice,
        password: passwordToUse
      });
      setEvaluationResult(res);
    } catch (err) {
      setEvaluationResult({ status: 500, type: 'error', message: err.message });
    } finally {
      setEvaluating(false);
    }
  };

  const handleScenarioSelect = (code) => {
    setTestCode(code);
    if (code === 'vip-deck') {
      setSimPassword('');
    }
    handleEvaluate(code, code === 'vip-deck' ? '' : simPassword);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(99, 102, 241, 0.12))',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.65rem', borderRadius: '12px' }}>
            <Globe size={28} color="#10b981" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Visitor & Anonymous Portal</h2>
              <span className="badge badge-active">Visitor Persona Active</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#a7f3d0' }}>
              Test how external visitors experience password gates, smart device routing, and expired link notices in 100% static mode.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSwitchRole('user')}
          className="btn-primary"
          style={{ fontSize: '0.85rem' }}
        >
          <span>Switch to Creator Mode</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Interactive Link Tester & Live Engine Inspector */}
      <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Client-Side Redirection Rule Inspector</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Evaluates status codes, expiration schedules, device routing, and security blocklists instantly in-browser.
            </p>
          </div>

          {/* Device Selector */}
          <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            {[
              { id: 'desktop', icon: Monitor, label: 'Desktop' },
              { id: 'mobile', icon: Smartphone, label: 'Mobile' },
              { id: 'tablet', icon: Tablet, label: 'Tablet' }
            ].map(d => {
              const Icon = d.icon;
              const active = simDevice === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSimDevice(d.id)}
                  className="btn-ghost"
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    background: active ? '#6366f1' : 'transparent',
                    color: active ? 'white' : 'var(--text-muted)'
                  }}
                >
                  <Icon size={13} />
                  <span>{d.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Input Bar */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
              /{' '}
            </span>
            <input
              type="text"
              className="glass-input"
              style={{ paddingLeft: '1.8rem', fontFamily: 'var(--font-mono)' }}
              placeholder="e.g. summer26"
              value={testCode}
              onChange={e => setTestCode(e.target.value.replace(/^\//, ''))}
            />
          </div>

          <input
            type="password"
            className="glass-input"
            style={{ width: '160px', fontSize: '0.85rem' }}
            placeholder="Password (if key locked)"
            value={simPassword}
            onChange={e => setSimPassword(e.target.value)}
          />

          <button
            onClick={() => handleEvaluate(testCode, simPassword)}
            disabled={evaluating}
            className="btn-primary"
            style={{ padding: '0.65rem 1.25rem', whiteSpace: 'nowrap' }}
          >
            <Play size={14} />
            <span>{evaluating ? 'Evaluating...' : 'Inspect Rules'}</span>
          </button>

          <a
            href={`/${testCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ padding: '0.65rem 1rem' }}
          >
            <span>Open in Tab</span>
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Live Evaluation Inspector Result Card */}
        {evaluationResult && (
          <div style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: evaluationResult.status === 302 
              ? 'rgba(16, 185, 129, 0.08)' 
              : (evaluationResult.status === 401 
                ? 'rgba(245, 158, 11, 0.08)' 
                : 'rgba(239, 68, 68, 0.08)'),
            border: `1px solid ${
              evaluationResult.status === 302 
                ? 'rgba(16, 185, 129, 0.3)' 
                : (evaluationResult.status === 401 
                  ? 'rgba(245, 158, 11, 0.3)' 
                  : 'rgba(239, 68, 68, 0.3)')
            }`,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className={evaluationResult.status === 302 ? 'badge badge-active' : (evaluationResult.status === 401 ? 'badge badge-purple' : 'badge badge-abuse')}>
                  HTTP {evaluationResult.status} {evaluationResult.status === 302 ? 'REDIRECT' : (evaluationResult.status === 401 ? 'UNAUTHORIZED' : 'GONE')}
                </span>
                <strong style={{ color: 'white', fontSize: '0.9rem' }}>
                  Rule Result: {evaluationResult.type.toUpperCase()}
                </strong>
              </div>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Simulated as {simDevice.toUpperCase()}
              </span>
            </div>

            {evaluationResult.destination ? (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Resolved Final Destination URL:</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#818cf8', wordBreak: 'break-all', marginTop: '0.2rem' }}>
                  {evaluationResult.destination}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.825rem', color: '#fca5a5' }}>
                ⚠️ Notice: {evaluationResult.message}
              </div>
            )}

            {evaluationResult.status === 401 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Unlock Test:</span>
                <button
                  onClick={() => {
                    setSimPassword('pulse2026');
                    handleEvaluate(testCode, 'pulse2026');
                  }}
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                >
                  <Lock size={12} />
                  <span>Try Key "pulse2026"</span>
                </button>
              </div>
            )}

            {evaluationResult.status === 302 && (
              <div style={{ marginTop: '0.4rem' }}>
                <a
                  href={evaluationResult.destination}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'inline-flex' }}
                >
                  <span>Proceed to Resolved Destination</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scenario Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Explore Platform Redirection Scenarios</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {sampleScenarios.map(sc => (
            <div 
              key={sc.code}
              className="glass-panel"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="code-chip">/{sc.code}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>{sc.label}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {sc.desc}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleScenarioSelect(sc.code)}
                  className="btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', flex: '1', justifyContent: 'center' }}
                >
                  <Play size={12} />
                  <span>Inspect Live</span>
                </button>

                <a
                  href={`/${sc.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                  title="Open in new window"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Public Bio Page Showcase */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <Sparkles size={16} color="#818cf8" />
            <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Public Link-in-Bio Landing Page</h4>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Visit the public creator page at <code>/bio/alex-growth</code>
          </p>
        </div>

        <a
          href="/bio/alex-growth"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          <span>Open Public Bio Page</span>
          <ExternalLink size={14} />
        </a>
      </div>

    </div>
  );
}
