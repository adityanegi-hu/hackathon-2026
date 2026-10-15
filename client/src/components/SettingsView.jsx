import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Layers, 
  FolderPlus, 
  ShieldCheck, 
  Database, 
  Save, 
  Check, 
  Globe, 
  Lock, 
  Sparkles,
  Server
} from 'lucide-react';

export default function SettingsView({ workspaces = [], onRefresh, notify, role = 'user' }) {
  const [settings, setSettings] = useState({
    platformName: 'LinkPulse',
    defaultDomain: 'localhost:5000',
    defaultRateLimitPerMin: 30,
    autoBotFilter: true,
    strictDomainCheck: true,
    enableQrAutoTag: true
  });
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(err => console.error('Failed to load settings:', err));
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (role !== 'admin') {
      notify('Administrator privileges required to modify system settings.', 'error');
      return;
    }
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-role': 'admin',
          'x-user-id': '2'
        },
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error('Failed to update platform settings');
      notify('Platform settings saved successfully!', 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) {
      notify('Workspace name is required', 'error');
      return;
    }

    setCreatingWorkspace(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName.trim() })
      });
      if (!res.ok) throw new Error('Failed to create workspace');
      notify(`Workspace "${newWorkspaceName}" created!`, 'success');
      setNewWorkspaceName('');
      onRefresh();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setCreatingWorkspace(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1080px', margin: '0 auto' }}>
      
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '0.6rem', borderRadius: '10px' }}>
            <Settings size={22} color="#818cf8" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Platform Settings & Governance</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Configure redirection defaults, workspaces & folders, rate limits, and security controls.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={savingSettings}
          className="btn-primary"
          style={{ fontSize: '0.85rem' }}
        >
          <Save size={15} />
          <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Grid: Platform General Settings & Workspaces Management */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: General & Redirection Settings */}
        <form onSubmit={handleSaveSettings} className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
            General Redirection & Routing
          </h3>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Platform Display Name
            </label>
            <input
              type="text"
              className="glass-input"
              value={settings.platformName}
              onChange={e => setSettings({ ...settings, platformName: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Default Redirection Domain
            </label>
            <input
              type="text"
              className="glass-input"
              value={settings.defaultDomain}
              onChange={e => setSettings({ ...settings, defaultDomain: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Rate Limiting (Max link creations per minute per IP)
            </label>
            <input
              type="number"
              min="5"
              max="200"
              className="glass-input"
              value={settings.defaultRateLimitPerMin}
              onChange={e => setSettings({ ...settings, defaultRateLimitPerMin: Number(e.target.value) })}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
              Protects against automated spam and denial-of-service abuse.
            </span>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem', marginTop: '0.5rem' }}>
            Security & Telemetry Flags
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Automated Bot Crawler Filtering</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Tag crawlers as is_bot to preserve human analytics</div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoBotFilter}
                onChange={e => setSettings({ ...settings, autoBotFilter: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Strict Domain Blocklist Verification</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Reject links matching hazardous phishing/malware domains</div>
              </div>
              <input
                type="checkbox"
                checked={settings.strictDomainCheck}
                onChange={e => setSettings({ ...settings, strictDomainCheck: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Embed ?qr=1 on QR Code Studio Export</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Tracks physical mobile scan conversions separately</div>
              </div>
              <input
                type="checkbox"
                checked={settings.enableQrAutoTag}
                onChange={e => setSettings({ ...settings, enableQrAutoTag: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </label>
          </div>

          {role === 'admin' ? (
            <button
              type="submit"
              disabled={savingSettings}
              className="btn-primary"
              style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
            >
              <Save size={16} />
              {savingSettings ? 'Saving Configuration...' : 'Save Platform Settings'}
            </button>
          ) : (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#fca5a5',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Lock size={14} />
              <span>Only platform administrators can modify system settings.</span>
            </div>
          )}
        </form>

        {/* Right Column: Workspaces & Folders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Workspaces Card */}
          <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Workspaces & Folders</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Organize links and team campaigns into distinct workspaces.
                </p>
              </div>
            </div>

            {/* Create Workspace Form */}
            <form onSubmit={handleCreateWorkspace} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="glass-input"
                placeholder="New Workspace / Folder name..."
                value={newWorkspaceName}
                onChange={e => setNewWorkspaceName(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
              <button
                type="submit"
                disabled={creatingWorkspace}
                className="btn-primary"
                style={{ padding: '0.65rem 1rem', whiteSpace: 'nowrap', fontSize: '0.85rem' }}
              >
                <FolderPlus size={15} />
                <span>Add</span>
              </button>
            </form>

            {/* List Workspaces */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {workspaces.map(ws => (
                <div 
                  key={ws.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={16} color="#818cf8" />
                    <strong style={{ color: 'white' }}>{ws.name}</strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    ID: #{ws.id}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Database & Architecture Telemetry Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={18} color="#10b981" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Database & Engine Status</h4>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Database Engine:</span>
                <strong style={{ color: 'white' }}>SQLite 3 (WAL Mode)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Redirection Engine:</span>
                <strong style={{ color: '#10b981' }}>Asynchronous (Non-Blocking)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Storage Path:</span>
                <code style={{ color: '#818cf8', fontSize: '0.75rem' }}>linkpulse.db</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Node.js Runtime:</span>
                <strong style={{ color: 'white' }}>v22 (Express 5)</strong>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
