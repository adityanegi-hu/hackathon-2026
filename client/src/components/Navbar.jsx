import React from 'react';
import { 
  Zap, 
  BarChart3, 
  Link2, 
  Layers, 
  QrCode, 
  UploadCloud, 
  Sparkles, 
  ShieldAlert, 
  Plus, 
  Play, 
  User, 
  Shield, 
  Globe,
  Settings,
  HelpCircle,
  Folder
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  role, 
  setRole, 
  onOpenCreate, 
  onOpenSimulator,
  onOpenDemoGuide,
  workspaces = [],
  selectedWorkspace,
  setSelectedWorkspace,
  abuseCount = 0
}) {
  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'links', label: 'Links Hub', icon: Link2 },
    { id: 'campaigns', label: 'Campaigns', icon: Layers },
    { id: 'qr', label: 'QR Studio', icon: QrCode },
    { id: 'import', label: 'Bulk Import', icon: UploadCloud },
    { id: 'bio', label: 'Link-in-Bio', icon: Sparkles },
    ...(role === 'admin' ? [{ id: 'admin', label: 'Abuse & Safety', icon: ShieldAlert, badge: abuseCount }] : []),
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <header style={{
      borderBottom: '1px solid var(--border-medium)',
      background: 'rgba(7, 9, 19, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.75rem 1.5rem'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand Logo & Workspace Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div 
            onClick={() => setCurrentTab('analytics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
            }}>
              <Zap size={22} color="#ffffff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>
                  Link<span style={{ color: '#818cf8' }}>Pulse</span>
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#a5b4fc',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(99, 102, 241, 0.3)'
                }}>
                  v2.6
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                URL Redirection & Live Tracking Engine
              </div>
            </div>
          </div>

          {/* Workspace / Folder Selector Dropdown */}
          {workspaces.length > 0 && role !== 'visitor' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.5rem' }}>
              <Folder size={14} color="var(--text-dim)" />
              <select
                value={selectedWorkspace || 'all'}
                onChange={e => setSelectedWorkspace && setSelectedWorkspace(e.target.value)}
                className="glass-input"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', width: 'auto' }}
              >
                <option value="all" style={{ background: '#0f172a' }}>All Workspaces</option>
                {workspaces.map(w => (
                  <option key={w.id} value={w.id} style={{ background: '#0f172a' }}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '0.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          overflowX: 'auto'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 0.85rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.2))' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  borderBottom: isActive ? '2px solid #818cf8' : '2px solid transparent',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={15} color={isActive ? '#818cf8' : 'currentColor'} />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span style={{
                    fontSize: '0.68rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                    background: '#ef4444',
                    color: 'white',
                    fontWeight: 700
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Role Switcher, Simulator, Demo Guide, New Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Role Switcher Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '0.2rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-medium)',
            fontSize: '0.8rem'
          }}>
            <button
              onClick={() => setRole('user')}
              title="Standard User: Manage your own links, campaigns & bio"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.78rem',
                background: role === 'user' ? '#6366f1' : 'transparent',
                color: role === 'user' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
            >
              <User size={13} />
              <span>User</span>
            </button>

            <button
              onClick={() => setRole('admin')}
              title="Administrator: Full platform visibility, abuse takedowns & blocklist"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.78rem',
                background: role === 'admin' ? '#ef4444' : 'transparent',
                color: role === 'admin' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
            >
              <Shield size={13} />
              <span>Admin</span>
            </button>

            <button
              onClick={() => setRole('visitor')}
              title="Visitor: Anonymous testing mode"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.78rem',
                background: role === 'visitor' ? '#10b981' : 'transparent',
                color: role === 'visitor' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
            >
              <Globe size={13} />
              <span>Visitor</span>
            </button>
          </div>

          {/* Demo Guide Walkthrough Button */}
          <button
            onClick={onOpenDemoGuide}
            className="btn-secondary"
            title="Open 5-Minute Guided Demo Walkthrough"
            style={{ padding: '0.5rem 0.8rem', fontSize: '0.825rem' }}
          >
            <Sparkles size={14} color="#c084fc" />
            <span>Walkthrough</span>
          </button>

          {/* Test Simulator Button */}
          <button 
            onClick={onOpenSimulator}
            className="btn-secondary"
            title="Simulate live clicks from various devices and countries"
            style={{ padding: '0.5rem 0.8rem', fontSize: '0.825rem' }}
          >
            <Play size={13} color="#10b981" />
            <span>Simulate</span>
          </button>

          {/* Create Link Button */}
          {role !== 'visitor' && (
            <button 
              onClick={onOpenCreate}
              className="btn-primary"
              style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>New Link</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
