import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  AlertCircle, 
  Clock, 
  MousePointerClick, 
  Lock, 
  Smartphone, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { staticStore } from '../staticStore';

export default function CreateLinkModal({ 
  isOpen, 
  onClose, 
  onLinkCreated, 
  campaigns = [],
  notify
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  // Form State - Step 1
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [title, setTitle] = useState('');

  // Validation State
  const [urlStatus, setUrlStatus] = useState(null); // { valid, error, warnings }
  const [aliasStatus, setAliasStatus] = useState(null); // { valid, error }

  // Form State - Step 2 (Rules & Metadata)
  const [enableExpiry, setEnableExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [enableClickLimit, setEnableClickLimit] = useState(false);
  const [clickLimit, setClickLimit] = useState(100);
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [enableDeviceTargeting, setEnableDeviceTargeting] = useState(false);
  const [mobileUrl, setMobileUrl] = useState('');
  const [tabletUrl, setTabletUrl] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');


  // Debounced real-time validation for Step 1
  useEffect(() => {
    if (!originalUrl && !customAlias) return;

    const timer = setTimeout(async () => {
      setValidating(true);
      try {
        const val = await staticStore.validateLink({
          original_url: originalUrl,
          short_code: autoGenerate ? '' : customAlias
        });

        if (val.valid) {
          setUrlStatus({ valid: true, error: null, warnings: [] });
          setAliasStatus({ valid: true, error: null });
        } else {
          if (val.error.includes('alias') || val.error.includes('short code')) {
            setUrlStatus({ valid: true, error: null, warnings: [] });
            setAliasStatus({ valid: false, error: val.error });
          } else {
            setUrlStatus({ valid: false, error: val.error, warnings: [] });
            setAliasStatus({ valid: true, error: null });
          }
        }
      } catch (err) {
        console.error('Validation check failed:', err);
      } finally {
        setValidating(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [originalUrl, customAlias, autoGenerate]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (!originalUrl.trim()) {
      notify('Please enter a destination URL', 'error');
      return;
    }
    if (urlStatus && !urlStatus.valid) {
      notify(urlStatus.error || 'Destination URL is invalid or blocked', 'error');
      return;
    }
    if (!autoGenerate && aliasStatus && !aliasStatus.valid) {
      notify(aliasStatus.error || 'Custom alias is invalid or unavailable', 'error');
      return;
    }

    // Auto generate title if missing
    if (!title.trim()) {
      try {
        const host = new URL(originalUrl.startsWith('http') ? originalUrl : `https://${originalUrl}`).hostname;
        setTitle(`${host.replace('www.', '')} Short Link`);
      } catch {
        setTitle('Custom Short Link');
      }
    }

    setStep(2);
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        original_url: originalUrl.trim(),
        custom_alias: autoGenerate ? '' : customAlias.trim(),
        campaign_id: selectedCampaign ? Number(selectedCampaign) : null,
        tags,
        click_limit: enableClickLimit ? Number(clickLimit) : null,
        expires_at: enableExpiry && expiresAt ? expiresAt : null,
        password: enablePassword && password.trim() ? password.trim() : null,
        mobile_url: enableDeviceTargeting && mobileUrl.trim() ? mobileUrl.trim() : null,
        tablet_url: enableDeviceTargeting && tabletUrl.trim() ? tabletUrl.trim() : null
      };

      const result = await staticStore.createLink(payload);

      // Celebratory Confetti!
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 }
      });

      notify(`Link created successfully! Code: /${result.link.short_code}`, 'success');
      onLinkCreated(result.link);
      onClose();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          padding: '1.5rem 1.75rem',
          borderBottom: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.4)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                color: 'white',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                STEP {step} OF 2
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {step === 1 ? 'Destination & Alias Setup' : 'Configure Redirection Rules'}
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {step === 1 
                ? 'Enter destination, validate alias uniqueness, and check domain safety' 
                : 'Set expiry schedule, click limits, password protection, and device routing'}
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem' }}>
          {step === 1 ? (
            /* STEP 1: Destination, Alias & Title */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Destination URL */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  <span>Destination URL <span style={{ color: '#ef4444' }}>*</span></span>
                  {validating && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <RefreshCw size={12} className="animate-spin" /> Checking safety...
                    </span>
                  )}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="https://example.com/marketing/campaign-page"
                    value={originalUrl}
                    onChange={e => setOriginalUrl(e.target.value)}
                    autoFocus
                    style={{
                      paddingRight: '2.5rem',
                      borderColor: urlStatus ? (urlStatus.valid ? '#10b981' : '#ef4444') : undefined
                    }}
                  />
                  <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                    {urlStatus && (
                      urlStatus.valid ? (
                        <Check size={18} color="#10b981" />
                      ) : (
                        <AlertCircle size={18} color="#ef4444" />
                      )
                    )}
                  </div>
                </div>

                {/* URL Validation Message */}
                {urlStatus && !urlStatus.valid && (
                  <div style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertCircle size={14} />
                    <span>{urlStatus.error}</span>
                  </div>
                )}
                {urlStatus && urlStatus.valid && urlStatus.warnings?.length > 0 && (
                  <div style={{ color: '#fbbf24', fontSize: '0.8rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertCircle size={14} />
                    <span>{urlStatus.warnings[0]}</span>
                  </div>
                )}
              </div>

              {/* Alias Selection */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Custom Short Code / Alias</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <input 
                      type="checkbox"
                      checked={autoGenerate}
                      onChange={e => {
                        setAutoGenerate(e.target.checked);
                        if (e.target.checked) setCustomAlias('');
                      }}
                    />
                    <span>Auto-generate unique code</span>
                  </label>
                </div>

                {!autoGenerate ? (
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-dim)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem',
                      pointerEvents: 'none'
                    }}>
                      /
                    </div>
                    <input
                      type="text"
                      className="glass-input"
                      placeholder="summer-promo-26"
                      value={customAlias}
                      onChange={e => setCustomAlias(e.target.value)}
                      style={{
                        paddingLeft: '1.8rem',
                        fontFamily: 'var(--font-mono)',
                        borderColor: aliasStatus ? (aliasStatus.valid ? '#10b981' : '#ef4444') : undefined
                      }}
                    />
                    <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                      {aliasStatus && (
                        aliasStatus.valid ? (
                          <Check size={18} color="#10b981" />
                        ) : (
                          <AlertCircle size={18} color="#ef4444" />
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px dashed var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Sparkles size={16} color="#818cf8" />
                    <span>A clean 6-character collision-free short code will be automatically assigned.</span>
                  </div>
                )}

                {aliasStatus && !aliasStatus.valid && !autoGenerate && (
                  <div style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertCircle size={14} />
                    <span>{aliasStatus.error}</span>
                  </div>
                )}
              </div>

              {/* Title Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Link Title / Label
                </label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g. Summer 2026 Launch Promo"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
                  Used internally to organize and search your links.
                </span>
              </div>
            </div>
          ) : (
            /* STEP 2: Intelligent Redirection Rules */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Expiry Rule */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
                      <Clock size={18} color="#f59e0b" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Expiration Rule</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Deactivate link after a specific date and time</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableExpiry}
                    onChange={e => setEnableExpiry(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>

                {enableExpiry && (
                  <div style={{ marginTop: '0.9rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      Expire At (UTC or Local)
                    </label>
                    <input
                      type="datetime-local"
                      className="glass-input"
                      value={expiresAt}
                      onChange={e => setExpiresAt(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Click Limit Cap */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ background: 'rgba(249, 115, 22, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
                      <MousePointerClick size={18} color="#f97316" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Visit Cap / Click Limit</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Block redirection once total clicks are reached</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableClickLimit}
                    onChange={e => setEnableClickLimit(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>

                {enableClickLimit && (
                  <div style={{ marginTop: '0.9rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      Maximum Allowed Clicks
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="glass-input"
                      value={clickLimit}
                      onChange={e => setClickLimit(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Password Protection */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
                      <Lock size={18} color="#c084fc" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Password Protection</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Prompt visitors with an unlock screen before routing</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enablePassword}
                    onChange={e => setEnablePassword(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>

                {enablePassword && (
                  <div style={{ marginTop: '0.9rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      Access Password
                    </label>
                    <input
                      type="text"
                      className="glass-input"
                      placeholder="e.g. pulse2026"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Device Targeting */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
                      <Smartphone size={18} color="#06b6d4" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Device Routing</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Route mobile and tablet devices to alternative URLs</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableDeviceTargeting}
                    onChange={e => setEnableDeviceTargeting(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>

                {enableDeviceTargeting && (
                  <div style={{ marginTop: '0.9rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        Mobile Override URL (e.g. App Store or Mobile Web)
                      </label>
                      <input
                        type="text"
                        className="glass-input"
                        placeholder="https://apps.apple.com/app/id..."
                        value={mobileUrl}
                        onChange={e => setMobileUrl(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        Tablet Override URL (Optional)
                      </label>
                      <input
                        type="text"
                        className="glass-input"
                        placeholder="https://example.com/tablet-optimized"
                        value={tabletUrl}
                        onChange={e => setTabletUrl(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Campaign & Tags */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Assign Campaign
                  </label>
                  <select
                    className="glass-input"
                    value={selectedCampaign}
                    onChange={e => setSelectedCampaign(e.target.value)}
                  >
                    <option value="" style={{ background: '#0f172a' }}>No Campaign (Standalone)</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id} style={{ background: '#0f172a' }}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Tags (Press Enter)
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="add tag..."
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                  />
                </div>
              </div>

              {/* Render Tags */}
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {tags.map(t => (
                    <span 
                      key={t}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: '#a5b4fc',
                        fontSize: '0.78rem'
                      }}
                    >
                      #{t}
                      <X 
                        size={12} 
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRemoveTag(t)}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderTop: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.6)'
        }}>
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              className="btn-secondary"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step === 1 ? (
            <button
              onClick={handleNextStep}
              className="btn-primary"
            >
              <span>Next: Set Rules</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Publishing Link...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Create & Publish Link</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
