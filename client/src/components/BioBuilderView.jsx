import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Save, 
  Smartphone, 
  Check, 
  Globe, 
  Share2 
} from 'lucide-react';

export default function BioBuilderView({ notify }) {
  const [slug, setSlug] = useState('alex-growth');
  const [title, setTitle] = useState('Alex Rivera | Growth & Product Lead');
  const [bio, setBio] = useState('Curating high-impact marketing tools, open-source projects, and keynote recordings.');
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80');
  const [theme, setTheme] = useState('luxury-dark');
  const [links, setLinks] = useState([
    { title: '🚀 Summer 2026 Product Showcase', subtitle: 'Explore the newest features', url: `${window.location.origin}/summer26` },
    { title: '📱 Download LinkPulse Mobile App', subtitle: 'iOS & Android targeting', url: `${window.location.origin}/get-app` },
    { title: '🎤 Tech Summit Keynote Replay', subtitle: 'Watch the full 45-min talk', url: `${window.location.origin}/keynote` },
    { title: '⚡ Developer API & SDK Documentation', subtitle: 'Start building today', url: `${window.location.origin}/dev-docs` }
  ]);
  const [socials, setSocials] = useState({
    twitter: 'https://twitter.com',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    youtube: 'https://youtube.com'
  });
  const [saving, setSaving] = useState(false);

  // Load existing bio if available
  useEffect(() => {
    fetch('/api/bio/alex-growth')
      .then(r => r.json())
      .then(data => {
        if (data.bio) {
          setTitle(data.bio.title || title);
          setBio(data.bio.bio || bio);
          setAvatarUrl(data.bio.avatar_url || avatarUrl);
          setTheme(data.bio.theme || theme);
          if (data.bio.links && data.bio.links.length > 0) setLinks(data.bio.links);
          if (data.bio.socials) setSocials(data.bio.socials);
        }
      })
      .catch(err => console.log('Using default bio profile'));
  }, []);

  const handleAddLink = () => {
    setLinks([
      ...links,
      { title: '✨ New Featured Link', subtitle: 'Check it out now', url: `${window.location.origin}/summer26` }
    ]);
  };

  const handleRemoveLink = (idx) => {
    setLinks(links.filter((_, i) => i !== idx));
  };

  const handleUpdateLink = (idx, field, val) => {
    const updated = [...links];
    updated[idx][field] = val;
    setLinks(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          title,
          bio,
          avatar_url: avatarUrl,
          theme,
          links,
          socials
        })
      });
      if (!res.ok) throw new Error('Failed to save bio page');
      notify(`Bio page saved! Public URL: /bio/${slug}`, 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const publicBioUrl = `${window.location.origin}/bio/${slug}`;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
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
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Link-in-Bio Landing Page Builder</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Consolidate your top campaigns into a responsive, mobile-first social landing page.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a
            href={publicBioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <Globe size={15} />
            <span>View Public Page</span>
            <ExternalLink size={12} />
          </a>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </div>

      {/* 2-Column Layout: Editor Form & Live Mobile Mockup */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.3fr 1fr',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        
        {/* Editor Form Column */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            Profile Configuration
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Bio Page Handle / Slug
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  /bio/
                </span>
                <input
                  type="text"
                  className="glass-input"
                  style={{ paddingLeft: '3.2rem', fontFamily: 'var(--font-mono)' }}
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Avatar Image URL
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="https://..."
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Display Name / Title
            </label>
            <input
              type="text"
              className="glass-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Bio Description
            </label>
            <textarea
              className="glass-input"
              rows={2}
              value={bio}
              onChange={e => setBio(e.target.value)}
            />
          </div>

          {/* Links Customizer */}
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.95rem', fontWeight: 700 }}>Landing Page Links ({links.length})</label>
              <button
                type="button"
                onClick={handleAddLink}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                <Plus size={14} />
                <span>Add Link</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {links.map((link, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)' }}>LINK #{idx + 1}</span>
                    <button
                      onClick={() => handleRemoveLink(idx)}
                      className="btn-ghost"
                      style={{ padding: '0.2rem', color: '#f87171' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <input
                      type="text"
                      className="glass-input"
                      placeholder="Title"
                      value={link.title}
                      onChange={e => handleUpdateLink(idx, 'title', e.target.value)}
                      style={{ fontSize: '0.85rem' }}
                    />
                    <input
                      type="text"
                      className="glass-input"
                      placeholder="Subtitle (optional)"
                      value={link.subtitle || ''}
                      onChange={e => handleUpdateLink(idx, 'subtitle', e.target.value)}
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  <input
                    type="text"
                    className="glass-input"
                    placeholder="Destination or short link URL"
                    value={link.url}
                    onChange={e => handleUpdateLink(idx, 'url', e.target.value)}
                    style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Live Mobile Phone Mockup Column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Smartphone size={16} />
            <span>Live Mobile Preview</span>
          </div>

          {/* Smartphone Frame */}
          <div style={{
            width: '320px',
            height: '560px',
            background: 'radial-gradient(circle at 50% 10%, #1e1b4b 0%, #0b0f19 50%, #030712 100%)',
            border: '8px solid #1e293b',
            borderRadius: '40px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 35px rgba(99, 102, 241, 0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            padding: '1.5rem 1rem'
          }}>
            {/* Phone Notch */}
            <div style={{
              width: '100px',
              height: '14px',
              background: '#1e293b',
              borderRadius: '0 0 10px 10px',
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10
            }} />

            {/* Scrollable phone screen contents */}
            <div style={{ overflowY: 'auto', flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: '1rem' }}>
              
              {/* Avatar */}
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={title} 
                  style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #818cf8', marginBottom: '0.75rem' }} 
                />
              ) : (
                <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'white', marginBottom: '0.75rem' }}>
                  {title.charAt(0)}
                </div>
              )}

              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white', marginBottom: '0.25rem' }}>
                {title}
              </h4>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: '1.4', marginBottom: '1.25rem', padding: '0 0.5rem' }}>
                {bio}
              </p>

              {/* Mobile Links */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                {links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      background: 'rgba(30, 41, 59, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      padding: '0.65rem 0.85rem',
                      textDecoration: 'none',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{link.title}</div>
                    {link.subtitle && (
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                        {link.subtitle}
                      </div>
                    )}
                  </a>
                ))}
              </div>

              <div style={{ marginTop: 'auto', fontSize: '0.65rem', color: '#64748b' }}>
                ⚡ Powered by LinkPulse
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
