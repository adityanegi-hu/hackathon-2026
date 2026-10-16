import React, { useState } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';

export default function VisitorPortalView({ onSwitchRole }) {
  const [testCode, setTestCode] = useState('summer26');

  const sampleScenarios = [
    { code: 'summer26', label: 'Active Link (Product Showcase)', desc: 'Directs seamlessly to destination with UTM parameters' },
    { code: 'vip-deck', label: 'Password Protected Link', desc: 'Prompts with LinkPulse security unlock form (Key: pulse2026)' },
    { code: 'get-app', label: 'Device Targeted Link', desc: 'Routes iOS/Android users to App Store, desktop to web' },
    { code: 'early50', label: 'Click Capped Link (Exceeded)', desc: 'Displays 410 Cap Limit Hit notice' },
    { code: 'summit-early', label: 'Expired Link', desc: 'Displays 410 Expired notice with expiration timestamp' },
    { code: 'free-eth', label: 'Suspended Abuse Link', desc: 'Displays 410 Security Suspension notice' }
  ];

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
              Test how external visitors experience password gates, smart device routing, and expired link notices.
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

      {/* Interactive Link Tester Bar */}
      <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Test Any Short Code as a Visitor</h3>
        
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              {window.location.origin}/
            </span>
            <input
              type="text"
              className="glass-input"
              style={{ paddingLeft: `${window.location.origin.length * 8.5 + 24}px`, fontFamily: 'var(--font-mono)' }}
              value={testCode}
              onChange={e => setTestCode(e.target.value.replace(/^\//, ''))}
            />
          </div>

          <a
            href={`/${testCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ padding: '0.7rem 1.4rem' }}
          >
            <span>Open Link in New Tab</span>
            <ExternalLink size={15} />
          </a>
        </div>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyConent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="code-chip">/{sc.code}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>{sc.label}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {sc.desc}
                </p>
              </div>

              <a
                href={`/${sc.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', justifyContent: 'center' }}
              >
                <span>Launch Scenario</span>
                <ExternalLink size={12} />
              </a>
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
