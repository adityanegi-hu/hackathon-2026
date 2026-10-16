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
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  User,
  ExternalLink,
  Folder
} from 'lucide-react';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  role, 
  setRole, 
  onOpenCreate, 
  workspaces = [],
  selectedWorkspace,
  setSelectedWorkspace,
  abuseCount = 0,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen = false
}) {
  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: null, desc: 'Real-time telemetry' },
        { id: 'links', label: 'Links Hub', icon: Link2, badge: null, desc: 'Manage short links' },
        { id: 'campaigns', label: 'Campaigns', icon: Layers, badge: null, desc: 'UTM attribution' }
      ]
    },
    {
      title: 'GROWTH SUITE',
      items: [
        { id: 'qr', label: 'QR Studio', icon: QrCode, badge: null, desc: 'Dynamic QR codes' },
        { id: 'bio', label: 'Link-in-Bio', icon: Sparkles, badge: 'New', desc: 'Social landing page' },
        { id: 'import', label: 'Bulk Import', icon: UploadCloud, badge: null, desc: 'CSV & JSON migration' }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        ...(role === 'admin' ? [{ id: 'admin', label: 'Abuse & Safety', icon: ShieldAlert, badge: abuseCount > 0 ? abuseCount : null, alert: abuseCount > 0, desc: 'Security enforcement' }] : []),
        { id: 'settings', label: 'Settings', icon: Settings, badge: null, desc: 'Domain & preferences' }
      ]
    }
  ];

  return (
    <aside 
      className={`sidebar-glass ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
      aria-label="Application Navigation"
    >
      {/* Top Branding & Collapse Button */}
      <div className="sidebar-brand-wrapper">
        <div 
          onClick={() => setCurrentTab('analytics')}
          className="sidebar-brand"
        >
          <div className="brand-logo-icon">
            <Zap size={22} color="#ffffff" className="brand-zap" />
          </div>
          {!isCollapsed && (
            <div className="brand-text-container">
              <div className="brand-title-row">
                <span className="brand-name">
                  Link<span className="brand-highlight">Pulse</span>
                </span>
                <span className="brand-badge">PRO</span>
              </div>
              <span className="brand-subtitle">Telemetry & URL Engine</span>
            </div>
          )}
        </div>

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="sidebar-toggle-btn"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Quick Action Button */}
      <div className="sidebar-action-wrap">
        <button 
          onClick={onOpenCreate}
          className="sidebar-create-btn"
          title="Create New Link"
        >
          <Plus size={18} className="create-icon-spin" />
          {!isCollapsed && <span>Create Short Link</span>}
        </button>
      </div>

      {/* Workspace Selector (if not collapsed) */}
      {!isCollapsed && workspaces.length > 0 && role !== 'visitor' && (
        <div className="sidebar-workspace-card">
          <div className="workspace-header">
            <Folder size={13} color="#a5b4fc" />
            <span>Active Workspace</span>
          </div>
          <select
            value={selectedWorkspace || 'all'}
            onChange={e => setSelectedWorkspace && setSelectedWorkspace(e.target.value)}
            className="sidebar-workspace-select"
          >
            <option value="all">Global (All Workspaces)</option>
            {workspaces.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="sidebar-nav-scroll">
        {navSections.map((section, idx) => (
          <div key={idx} className="sidebar-section">
            {!isCollapsed && (
              <div className="sidebar-section-title">
                {section.title}
              </div>
            )}
            <div className="sidebar-nav-list">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''} ${item.alert ? 'has-alert' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="nav-item-icon-wrap">
                      <Icon size={18} className="nav-icon" />
                    </div>
                    {!isCollapsed && (
                      <div className="nav-item-content">
                        <span className="nav-item-label">{item.label}</span>
                        {item.badge && (
                          <span className={`nav-item-badge ${item.alert ? 'alert' : ''}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                    {isActive && <div className="active-glow-pill" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer with Role Switcher */}
      <div className="sidebar-footer">
        {!isCollapsed ? (
          <div className="role-switcher-card">
            <div className="role-switcher-header">
              <span className="role-label">Current Role:</span>
              <span className="role-badge">{role.toUpperCase()}</span>
            </div>
            <div className="role-toggle-group">
              <button
                onClick={() => setRole('user')}
                className={`role-btn ${role === 'user' ? 'selected' : ''}`}
                title="Marketer view"
              >
                <User size={12} />
                <span>Marketer</span>
              </button>
              <button
                onClick={() => setRole('admin')}
                className={`role-btn ${role === 'admin' ? 'selected' : ''}`}
                title="Admin view with abuse controls"
              >
                <Shield size={12} />
                <span>Admin</span>
              </button>
              <button
                onClick={() => setRole('visitor')}
                className={`role-btn ${role === 'visitor' ? 'selected' : ''}`}
                title="Public visitor preview"
              >
                <ExternalLink size={12} />
                <span>Visitor</span>
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setRole(role === 'admin' ? 'user' : 'admin')}
            className="collapsed-role-icon"
            title={`Active: ${role}. Click to switch role.`}
          >
            {role === 'admin' ? <Shield size={18} color="#f59e0b" /> : <User size={18} color="#818cf8" />}
          </div>
        )}
      </div>
    </aside>
  );
}
