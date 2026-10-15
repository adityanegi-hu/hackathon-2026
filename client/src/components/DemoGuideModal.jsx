import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Sparkles, 
  CheckCircle, 
  ArrowRight, 
  ShieldAlert, 
  UploadCloud, 
  BarChart3, 
  ExternalLink 
} from 'lucide-react';

export default function DemoGuideModal({ 
  isOpen, 
  onClose, 
  onSelectTab, 
  onOpenCreate, 
  onOpenSimulator, 
  onSetRole 
}) {
  const [activeScenario, setActiveScenario] = useState('scenario1');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', padding: '0.45rem', borderRadius: '8px' }}>
              <Sparkles size={18} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>5-Minute Live Demo Walkthrough</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Interactive scenario guides for evaluation & hackathon review</p>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Scenario Toggle */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.75rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.2)'
        }}>
          <button
            onClick={() => setActiveScenario('scenario1')}
            className="btn-ghost"
            style={{
              flex: '1',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              background: activeScenario === 'scenario1' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeScenario === 'scenario1' ? 'white' : 'var(--text-muted)',
              borderBottom: activeScenario === 'scenario1' ? '2px solid #818cf8' : '2px solid transparent'
            }}
          >
            Scenario 1: Link Creation to Analytics
          </button>

          <button
            onClick={() => setActiveScenario('scenario2')}
            className="btn-ghost"
            style={{
              flex: '1',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              background: activeScenario === 'scenario2' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: activeScenario === 'scenario2' ? 'white' : 'var(--text-muted)',
              borderBottom: activeScenario === 'scenario2' ? '2px solid #ef4444' : '2px solid transparent'
            }}
          >
            Scenario 2: Bulk Import to Link Disable
          </button>
        </div>

        {/* Scenario Body */}
        <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {activeScenario === 'scenario1' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                padding: '0.9rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                color: '#cbd5e1'
              }}>
                🎯 <strong>Goal:</strong> Follow the unified lifecycle of a new marketing link from creation with real-time alias & safety validation to redirection and live telemetry tracking.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>1</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'white' }}>Open 2-Step Link Wizard</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Click <strong>"+ New Link"</strong> in the navbar to start.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>2</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'white' }}>Validation & Rules</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Type a destination URL, custom alias (e.g. <code>demo-walkthrough</code>), and configure click caps or password protection.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>3</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'white' }}>Test Redirection & Simulate Visits</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Click <strong>"Simulate Visit"</strong> in the navbar to test mobile/desktop traffic from Germany, US, or Japan with QR tags.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>4</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'white' }}>Observe Live Dashboard</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Watch the trajectory chart, device donut, geo flags, and live click stream increment asynchronously.</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => {
                    onClose();
                    onOpenCreate();
                  }}
                  className="btn-primary"
                >
                  <span>Launch Step 1: Create Link</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: '0.9rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                color: '#fca5a5'
              }}>
                🛑 <strong>Goal:</strong> Bulk import marketing campaigns with dry-run error diagnostics, then exercise administrative safety governance to neutralize a malicious domain.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>1</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'white' }}>Bulk Import & Dry-Run Preview</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Go to <strong>Bulk Import</strong> tab, click <strong>"Load Test CSV Sample"</strong>, and run pre-validation.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>2</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'white' }}>Inspect Pre-Validation Diagnostics</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Notice that duplicate aliases and blocked malware domains are automatically rejected before writing to database.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>3</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'white' }}>Switch to Admin Governance</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Use header role switcher to pick <strong>`[🛡️ Admin]`</strong> and navigate to <strong>"Abuse & Safety"</strong> tab.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>4</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'white' }}>Quarantine Domain & Halt Redirection</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Add a domain to safety blocklist or execute 1-click link takedown to immediately return 410 Suspended notices.</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => {
                    onClose();
                    onSelectTab('import');
                  }}
                  className="btn-danger"
                >
                  <span>Launch Step 1: Bulk Import</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
