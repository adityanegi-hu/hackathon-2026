import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  QrCode, 
  Layers, 
  Download,
  BarChart2,
  Edit3,
  Save
} from 'lucide-react';

import staticStore from '../staticStore';

export default function LinkDetailsModal({ 
  link, 
  isOpen, 
  onClose, 
  onRefresh,
  campaigns = [],
  notify
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'clicks' | 'qr' | 'edit'
  const [details, setDetails] = useState(() => {
    if (!link) return null;
    try {
      return staticStore.getLinkById(link.id);
    } catch {
      return null;
    }
  });
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrSvgUrl, setQrSvgUrl] = useState('');

  const currentLink = details?.link || link || {};

  // Edit Form State
  const [editTitle, setEditTitle] = useState(currentLink.title || '');
  const [editUrl, setEditUrl] = useState(currentLink.original_url || '');
  const [editAlias, setEditAlias] = useState(currentLink.short_code || '');
  const [editLimit, setEditLimit] = useState(
    currentLink.click_limit !== null && currentLink.click_limit !== undefined ? String(currentLink.click_limit) : ''
  );
  const [editExpiry, setEditExpiry] = useState(currentLink.expires_at ? currentLink.expires_at.slice(0, 16) : '');
  const [editMobileUrl, setEditMobileUrl] = useState(currentLink.mobile_url || '');
  const [editCampaignId, setEditCampaignId] = useState(currentLink.campaign_id ? String(currentLink.campaign_id) : '');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!currentLink.short_code) return;
    let isMounted = true;

    staticStore.generateQr({ code: currentLink.short_code, size: 300, format: 'dataurl' })
      .then(res => {
        if (isMounted) setQrDataUrl(res.qrDataUrl);
      })
      .catch(err => console.error('QR generation error:', err));

    staticStore.generateQr({ code: currentLink.short_code, format: 'svg' })
      .then(res => {
        if (isMounted) {
          const blob = new Blob([res.svgString], { type: 'image/svg+xml' });
          setQrSvgUrl(URL.createObjectURL(blob));
        }
      })
      .catch(err => console.error('QR SVG error:', err));

    return () => {
      isMounted = false;
    };
  }, [currentLink.short_code]);

  if (!isOpen || !link) return null;

  const clicks = details?.clicks || [];

  const handleCopy = () => {
    const fullUrl = `${window.location.origin}/${currentLink.short_code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    notify(`Copied /${currentLink.short_code} to clipboard`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);

    try {
      const res = await staticStore.updateLink(currentLink.id, {
        title: editTitle,
        original_url: editUrl,
        click_limit: editLimit ? Number(editLimit) : null,
        expires_at: editExpiry || null,
        mobile_url: editMobileUrl || null,
        campaign_id: editCampaignId ? Number(editCampaignId) : null
      });

      notify('Link rules and details updated successfully!', 'success');
      setDetails(prev => ({ ...prev, link: res.link }));
      if (onRefresh) onRefresh();
      setActiveTab('overview');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '820px' }}>
        
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.5)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.2rem' }}>
              <span className="code-chip" style={{ fontSize: '1rem', padding: '0.2rem 0.6rem' }}>
                /{currentLink.short_code}
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
                {currentLink.title}
              </h2>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Created on {new Date(currentLink.created_at).toLocaleString()}
            </p>
          </div>

          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.4rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Unified Link Flow Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.75rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.3)',
          overflowX: 'auto'
        }}>
          {[
            { id: 'overview', label: 'Overview & Rules', icon: Layers },
            { id: 'clicks', label: `Clicks Telemetry (${clicks.length})`, icon: BarChart2 },
            { id: 'qr', label: 'QR Code', icon: QrCode },
            { id: 'edit', label: 'Edit Link Rules', icon: Edit3 }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="btn-ghost"
                style={{
                  fontSize: '0.825rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isActive ? '#a5b4fc' : 'var(--text-muted)',
                  borderBottom: isActive ? '2px solid #818cf8' : '2px solid transparent'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Tabs */}
        <div style={{ padding: '1.75rem', maxHeight: '68vh', overflowY: 'auto' }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Short URL Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#a5b4fc', textTransform: 'uppercase', fontWeight: 700 }}>
                    Short URL
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white', fontFamily: 'var(--font-mono)' }}>
                    {window.location.origin}/{currentLink.short_code}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={handleCopy}
                    className="btn-secondary"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
                  >
                    {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy URL'}</span>
                  </button>

                  <a
                    href={`/${currentLink.short_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.825rem' }}
                  >
                    <span>Test Redirection</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* Rules Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
                <div className="glass-panel" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Destination URL</div>
                  <a 
                    href={currentLink.original_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#818cf8', fontSize: '0.85rem', wordBreak: 'break-all', display: 'block', marginTop: '0.25rem' }}
                  >
                    {currentLink.original_url}
                  </a>
                </div>

                <div className="glass-panel" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Status & Access</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', marginTop: '0.25rem' }}>
                    {currentLink.status.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {currentLink.is_password_protected ? '🔒 Password Protected' : 'Public Access'}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Visit Cap / Click Limit</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', marginTop: '0.25rem' }}>
                    {currentLink.click_limit ? `${currentLink.click_count} / ${currentLink.click_limit} visits` : `${currentLink.click_count} visits (Unlimited)`}
                  </div>
                  {currentLink.isLimitExceeded && (
                    <span style={{ fontSize: '0.7rem', color: '#f97316' }}>⚠️ Maximum cap reached</span>
                  )}
                </div>

                <div className="glass-panel" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Expiry Schedule</div>
                  <div style={{ fontSize: '0.85rem', color: 'white', marginTop: '0.25rem' }}>
                    {currentLink.expires_at ? new Date(currentLink.expires_at).toLocaleString() : 'Never expires'}
                  </div>
                  {currentLink.isExpired && (
                    <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>⏳ Expired</span>
                  )}
                </div>

                <div className="glass-panel" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Device Overrides</div>
                  <div style={{ fontSize: '0.825rem', color: currentLink.mobile_url ? '#38bdf8' : 'var(--text-dim)', marginTop: '0.25rem', wordBreak: 'break-all' }}>
                    {currentLink.mobile_url ? currentLink.mobile_url : 'Default Routing'}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Campaign & Tags</div>
                  <div style={{ fontSize: '0.85rem', color: '#c084fc', marginTop: '0.25rem' }}>
                    {currentLink.campaign_name || 'Standalone (No Campaign)'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.35rem' }}>
                    {currentLink.tags && currentLink.tags.map(t => (
                      <span key={t} style={{ fontSize: '0.68rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLICKS & VISITOR TELEMETRY */}
          {activeTab === 'clicks' && (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Visit Logs & Request Details ({clicks.length})
              </h3>

              {clicks.length === 0 ? (
                <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px' }}>
                  No visit events recorded yet. Try clicking "Test Redirection" to record your first visit!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {clicks.map(c => (
                    <div
                      key={c.id}
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'rgba(15, 23, 42, 0.5)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.825rem',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>{c.country} ({c.city})</span>
                          {c.is_bot === 1 && <span className="badge badge-abuse" style={{ fontSize: '0.65rem' }}>Bot</span>}
                          {c.is_qr === 1 && <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>QR Scan</span>}
                        </div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                          Origin: {c.referrer} • IP: {c.ip}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#818cf8', fontWeight: 600, fontSize: '0.8rem' }}>
                          {c.device_type} • {c.browser} ({c.os})
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {new Date(c.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QR CODE */}
          {activeTab === 'qr' && (
            <div style={{ textAlign: 'center', padding: '1rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                padding: '1.25rem',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
                width: '240px',
                height: '240px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="QR code" 
                    style={{ width: '220px', height: '220px', display: 'block' }}
                  />
                ) : (
                  <div style={{ color: '#0f172a', fontSize: '0.85rem' }}>Generating QR...</div>
                )}
              </div>

              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>/{currentLink.short_code}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Targeting URL with in-browser client scan logging</p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {qrDataUrl && (
                  <a
                    href={qrDataUrl}
                    download={`qr-${currentLink.short_code}.png`}
                    className="btn-primary"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <Download size={14} />
                    <span>Download PNG</span>
                  </a>
                )}

                {qrSvgUrl && (
                  <a
                    href={qrSvgUrl}
                    download={`qr-${currentLink.short_code}.svg`}
                    className="btn-secondary"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <Download size={14} />
                    <span>Download SVG</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EDIT LINK RULES */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Link Title
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Destination URL
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={editUrl}
                  onChange={e => setEditUrl(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Custom Alias
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    value={editAlias}
                    onChange={e => setEditAlias(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Campaign
                  </label>
                  <select
                    className="glass-input"
                    value={editCampaignId}
                    onChange={e => setEditCampaignId(e.target.value)}
                  >
                    <option value="" style={{ background: '#0f172a' }}>No Campaign</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id} style={{ background: '#0f172a' }}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Visit Cap / Click Limit (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="glass-input"
                    placeholder="e.g. 500"
                    value={editLimit}
                    onChange={e => setEditLimit(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    className="glass-input"
                    value={editExpiry}
                    onChange={e => setEditExpiry(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Mobile Device Override URL (Optional)
                </label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="https://apps.apple.com/app/..."
                  value={editMobileUrl}
                  onChange={e => setEditMobileUrl(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn-primary"
                >
                  <Save size={15} />
                  <span>{savingEdit ? 'Saving...' : 'Save Rule Changes'}</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderTop: '1px solid var(--border-medium)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'rgba(15, 23, 42, 0.5)'
        }}>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
