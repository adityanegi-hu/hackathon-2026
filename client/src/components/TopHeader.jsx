import React from 'react';
import { 
  Play, 
  Sparkles, 
  ExternalLink, 
  BarChart3, 
  Link2, 
  Layers, 
  QrCode, 
  UploadCloud, 
  ShieldAlert, 
  Settings,
  Activity,
  Compass,
  Menu
} from 'lucide-react';

export default function TopHeader({ 
  currentTab, 
  onOpenSimulator, 
  onOpenDemoGuide,
  totalLinksCount = 0,
  totalClicksCount = 0,
  onMobileMenuToggle
}) {
  const tabMeta = {
    analytics: { title: 'Analytics & Live Telemetry', subtitle: 'Real-time performance and geographic visitor breakdown', icon: BarChart3 },
    links: { title: 'Links Hub', subtitle: 'Search, filter, inspect and configure active short URLs', icon: Link2 },
    campaigns: { title: 'Campaign Attribution', subtitle: 'Group links by marketing initiative and track aggregate ROI', icon: Layers },
    qr: { title: 'Dynamic QR Studio', subtitle: 'Generate, style and download vector & raster QR codes', icon: QrCode },
    import: { title: 'Bulk Migration Engine', subtitle: 'Import multiple links via CSV or batch payload instantly', icon: UploadCloud },
    bio: { title: 'Link-in-Bio Landing Page', subtitle: 'Curate a responsive social link-in-bio mobile showcase', icon: Sparkles },
    admin: { title: 'Abuse & Security Enforcement', subtitle: 'Manage domain quarantine, safety blocklists and user audits', icon: ShieldAlert },
    settings: { title: 'Workspace Settings', subtitle: 'Configure custom domains, default fallbacks and local storage', icon: Settings },
    visitor: { title: 'Visitor Experience Portal', subtitle: 'Interactive portal to simulate client redirects and bio views', icon: Compass }
  };

  const current = tabMeta[currentTab] || { title: 'LinkPulse Dashboard', subtitle: 'URL Redirection Engine', icon: Activity };
  const TabIcon = current.icon;

  return (
    <header className="top-header-glass">
      {/* Hamburger — only visible on mobile (≤768px) via CSS */}
      <button
        className="mobile-menu-btn"
        onClick={onMobileMenuToggle}
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      <div className="top-header-left">
        <div className="current-view-badge">
          <TabIcon size={16} className="view-icon" />
          <span>{current.title}</span>
        </div>
        <p className="current-view-subtitle">{current.subtitle}</p>
      </div>

      <div className="top-header-right">
        {/* Live Telemetry Status Pill */}
        <div className="system-live-pill" title="100% in-browser static database with localStorage persistence">
          <span className="live-dot" />
          <span className="live-label">Static Engine Active</span>
          <span className="live-divider">•</span>
          <span className="live-stats">{totalLinksCount} Links / {totalClicksCount.toLocaleString()} Clicks</span>
        </div>

        {/* Quick Simulator CTA */}
        <button
          onClick={onOpenSimulator}
          className="header-action-btn simulator"
          title="Simulate visitor traffic from various devices and countries"
        >
          <Play size={14} color="#10b981" />
          <span>Simulate Traffic</span>
        </button>

        {/* Demo Guide CTA */}
        <button
          onClick={onOpenDemoGuide}
          className="header-action-btn guide"
          title="Open interactive platform demo guide"
        >
          <Sparkles size={14} color="#c084fc" />
          <span>Demo Guide</span>
        </button>

        {/* Public Bio Page Direct Link */}
        <a
          href="/bio/alex-growth"
          target="_blank"
          rel="noopener noreferrer"
          className="header-action-btn bio"
          title="Open Public Link-in-Bio page"
        >
          <ExternalLink size={13} />
          <span>Public Bio</span>
        </a>
      </div>
    </header>
  );
}
