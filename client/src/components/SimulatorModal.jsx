import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Smartphone, 
  Monitor, 
  Tablet, 
  QrCode, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

import staticStore from '../staticStore';

export default function SimulatorModal({ 
  isOpen, 
  onClose, 
  links = [], 
  onSimulated, 
  notify 
}) {
  const [selectedCode, setSelectedCode] = useState(links[0]?.short_code || 'summer26');
  const [device, setDevice] = useState('desktop');
  const [country, setCountry] = useState('United States');
  const [referrer, setReferrer] = useState('https://twitter.com/feed');
  const [isQr, setIsQr] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  if (!isOpen) return null;

  const handleSimulate = async () => {
    setSimulating(true);
    setLastResult(null);

    try {
      const data = staticStore.simulateClick({
        code: selectedCode,
        device,
        country,
        referrer,
        isQr
      });

      setLastResult({
        success: true,
        message: data.message,
        code: selectedCode
      });

      notify(`Simulated ${device} visit from ${country} registered for /${selectedCode}!`, 'success');
      onSimulated && onSimulated();
    } catch (err) {
      setLastResult({
        success: false,
        message: err.message
      });
      notify(err.message, 'error');
    } finally {
      setSimulating(false);
    }
  };

  const sampleCountries = [
    { name: 'United States', code: 'US', flag: '🇺🇸' },
    { name: 'Germany', code: 'DE', flag: '🇩🇪' },
    { name: 'India', code: 'IN', flag: '🇮🇳' },
    { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
    { name: 'Japan', code: 'JP', flag: '🇯🇵' },
    { name: 'France', code: 'FR', flag: '🇫🇷' },
    { name: 'Canada', code: 'CA', flag: '🇨🇦' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
              <Play size={18} color="#10b981" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Telemetry Event Simulator</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Simulate real-time clicks from across the globe</p>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Pick Link */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Target Short Link
            </label>
            <select
              className="glass-input"
              value={selectedCode}
              onChange={e => setSelectedCode(e.target.value)}
            >
              {links.map(l => (
                <option key={l.id} value={l.short_code} style={{ background: '#0f172a' }}>
                  /{l.short_code} — {l.title} ({l.status})
                </option>
              ))}
            </select>
          </div>

          {/* Device Type */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Client Device Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              {[
                { id: 'desktop', label: 'Desktop PC', icon: Monitor },
                { id: 'mobile', label: 'iPhone / Mobile', icon: Smartphone },
                { id: 'tablet', label: 'iPad / Tablet', icon: Tablet }
              ].map(d => {
                const Icon = d.icon;
                const isSelected = device === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDevice(d.id)}
                    className="btn-secondary"
                    style={{
                      padding: '0.65rem 0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.3rem',
                      fontSize: '0.78rem',
                      borderColor: isSelected ? '#818cf8' : undefined,
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : undefined,
                      color: isSelected ? 'white' : 'var(--text-muted)'
                    }}
                  >
                    <Icon size={18} color={isSelected ? '#818cf8' : 'currentColor'} />
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Country Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Origin Country / IP Geolocation
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {sampleCountries.map(c => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setCountry(c.name)}
                  className="btn-secondary"
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    borderColor: country === c.name ? '#10b981' : undefined
                  }}
                >
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* QR Scan Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={16} color="#c084fc" />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Simulate as QR Code Scan</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Appends ?qr=1 to telemetry headers</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isQr}
              onChange={e => setIsQr(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          {/* Feedback */}
          {lastResult && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: lastResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: lastResult.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: lastResult.success ? '#34d399' : '#fca5a5'
            }}>
              {lastResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{lastResult.message}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderTop: '1px solid var(--border-medium)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          background: 'rgba(15, 23, 42, 0.6)'
        }}>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)' }}
          >
            <Play size={15} />
            <span>{simulating ? 'Transmitting Click...' : 'Fire Simulated Click'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
