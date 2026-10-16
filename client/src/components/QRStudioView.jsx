import React, { useState, useEffect } from 'react';
import { 
  Download, 
  ExternalLink, 
  Smartphone 
} from 'lucide-react';

export default function QRStudioView({ links = [], initialLink = null, notify }) {
  const [selectedLinkCode, setSelectedLinkCode] = useState(initialLink ? initialLink.short_code : (links[0]?.short_code || 'summer26'));
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [ecc, setEcc] = useState('M'); // L, M, Q, H
  const [size, setSize] = useState(360);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Sync when initialLink changes
  useEffect(() => {
    if (initialLink) {
      setSelectedLinkCode(initialLink.short_code);
    }
  }, [initialLink]);

  // Fetch QR Code data URL whenever parameters change
  useEffect(() => {
    if (!selectedLinkCode) return;

    let isMounted = true;

    const query = new URLSearchParams({
      color: fgColor,
      background: bgColor,
      ecc,
      size: String(size),
      format: 'dataurl'
    });

    fetch(`/api/qr/${selectedLinkCode}?${query}`)
      .then(r => r.json())
      .then(data => {
        if (isMounted && data.qrDataUrl) {
          setQrDataUrl(data.qrDataUrl);
        }
      })
      .catch(err => console.error('Failed to load QR code:', err));

    return () => { isMounted = false; };
  }, [selectedLinkCode, fgColor, bgColor, ecc, size]);

  const handleDownload = (format = 'png') => {
    const url = `/api/qr/${selectedLinkCode}?color=${encodeURIComponent(fgColor)}&background=${encodeURIComponent(bgColor)}&ecc=${ecc}&size=${size}&format=${format}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkpulse-qr-${selectedLinkCode}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    notify(`Downloaded ${format.toUpperCase()} QR code`, 'success');
  };

  const currentLink = links.find(l => l.short_code === selectedLinkCode);
  const targetScanUrl = `${window.location.origin}/${selectedLinkCode}?qr=1`;

  const colorPresets = [
    { name: 'Classic Black', fg: '#000000', bg: '#ffffff' },
    { name: 'Indigo Pulse', fg: '#6366f1', bg: '#ffffff' },
    { name: 'Cyber Violet', fg: '#a855f7', bg: '#ffffff' },
    { name: 'Emerald Forest', fg: '#059669', bg: '#ffffff' },
    { name: 'Dark Mode Invert', fg: '#ffffff', bg: '#0f172a' }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-medium)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Dynamic QR Code Studio</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Generate print-ready vector & raster QR codes with automated scan telemetry tracking.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(99, 102, 241, 0.15)',
          padding: '0.4rem 0.85rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#a5b4fc',
          fontSize: '0.8rem',
          fontWeight: 600
        }}>
          <Smartphone size={16} color="#818cf8" />
          <span>Automated <code>?qr=1</code> scan tagging enabled</span>
        </div>
      </div>

      {/* Main Studio Workspace: Controls (Left) & Live Preview (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        
        {/* Controls Column */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Select Link */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              Select Short Link
            </label>
            <select
              value={selectedLinkCode}
              onChange={e => setSelectedLinkCode(e.target.value)}
              className="glass-input"
            >
              {links.map(l => (
                <option key={l.id} value={l.short_code} style={{ background: '#0f172a' }}>
                  /{l.short_code} — {l.title}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Color Presets */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Color Palettes
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {colorPresets.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setFgColor(preset.fg);
                    setBgColor(preset.bg);
                  }}
                  className="btn-secondary"
                  style={{
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    borderColor: (fgColor === preset.fg && bgColor === preset.bg) ? '#818cf8' : undefined
                  }}
                >
                  <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '10px', height: '10px', background: preset.fg }} />
                    <div style={{ width: '10px', height: '10px', background: preset.bg }} />
                  </div>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Pickers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Foreground Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="color"
                  value={fgColor}
                  onChange={e => setFgColor(e.target.value)}
                  style={{ width: '38px', height: '38px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  className="glass-input"
                  value={fgColor}
                  onChange={e => setFgColor(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Background Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="color"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  style={{ width: '38px', height: '38px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  className="glass-input"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Error Correction & Resolution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Error Correction Level
              </label>
              <select
                value={ecc}
                onChange={e => setEcc(e.target.value)}
                className="glass-input"
                style={{ fontSize: '0.85rem' }}
              >
                <option value="L" style={{ background: '#0f172a' }}>Low (7% recovery)</option>
                <option value="M" style={{ background: '#0f172a' }}>Medium (15% recovery)</option>
                <option value="Q" style={{ background: '#0f172a' }}>Quartile (25% recovery)</option>
                <option value="H" style={{ background: '#0f172a' }}>High (30% logo-safe)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Output Resolution
              </label>
              <select
                value={size}
                onChange={e => setSize(Number(e.target.value))}
                className="glass-input"
                style={{ fontSize: '0.85rem' }}
              >
                <option value="250" style={{ background: '#0f172a' }}>250 x 250 px (Web/Email)</option>
                <option value="400" style={{ background: '#0f172a' }}>400 x 400 px (Standard)</option>
                <option value="800" style={{ background: '#0f172a' }}>800 x 800 px (Hi-Res Print)</option>
              </select>
            </div>
          </div>

          {/* Embedded Scan Target Info */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.825rem'
          }}>
            <div style={{ color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Scan Target Destination:</div>
            <div style={{ fontFamily: 'var(--font-mono)', color: '#818cf8', wordBreak: 'break-all' }}>
              {targetScanUrl}
            </div>
          </div>
        </div>

        {/* Live Preview & Download Column */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            padding: '1.25rem',
            background: bgColor,
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            marginBottom: '1.5rem',
            minHeight: '260px',
            minWidth: '260px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt={`QR code for /${selectedLinkCode}`} 
                style={{ width: '240px', height: '240px', display: 'block' }}
              />
            ) : (
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Generating QR...</div>
            )}
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            /{selectedLinkCode}
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {currentLink?.title || 'Selected Short Link'}
          </p>

          {/* Download Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: '320px' }}>
            <button
              onClick={() => handleDownload('png')}
              className="btn-primary"
              style={{ flex: '1', padding: '0.7rem' }}
            >
              <Download size={15} />
              <span>PNG</span>
            </button>

            <button
              onClick={() => handleDownload('svg')}
              className="btn-secondary"
              style={{ flex: '1', padding: '0.7rem' }}
            >
              <Download size={15} />
              <span>Vector SVG</span>
            </button>
          </div>

          {/* Test Link Button */}
          <a
            href={targetScanUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: '1.25rem',
              fontSize: '0.825rem',
              color: 'var(--text-dim)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              textDecoration: 'none'
            }}
            className="hover-bright"
          >
            <span>Test scan redirect</span>
            <ExternalLink size={12} />
          </a>
        </div>

      </div>
    </div>
  );
}
