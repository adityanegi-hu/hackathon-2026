import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart3, Link2, Layers, QrCode, Sparkles, Settings } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import AnalyticsView from './components/AnalyticsView';
import LinksView from './components/LinksView';
import CampaignsView from './components/CampaignsView';
import QRStudioView from './components/QRStudioView';
import BulkImportView from './components/BulkImportView';
import BioBuilderView from './components/BioBuilderView';
import AdminAbuseView from './components/AdminAbuseView';
import VisitorPortalView from './components/VisitorPortalView';
import SettingsView from './components/SettingsView';
import CreateLinkModal from './components/CreateLinkModal';
import SimulatorModal from './components/SimulatorModal';
import LinkDetailsModal from './components/LinkDetailsModal';
import DemoGuideModal from './components/DemoGuideModal';
import PublicVisitorView from './components/PublicVisitorView';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { staticStore } from './staticStore';

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname || '/');
  const [currentTab, setCurrentTab] = useState('analytics');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [role, setRole] = useState('user'); // 'user' | 'admin' | 'visitor'
  const [period, setPeriod] = useState('30d');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('all');

  // Direct synchronous initialization from staticStore eliminates initial layout shifts & warnings
  const [links, setLinks] = useState(() => staticStore.getLinks({ role: 'user', userId: 1, workspaceId: 'all' }).links || []);
  const [campaigns, setCampaigns] = useState(() => staticStore.getCampaigns({ role: 'user', userId: 1 }).campaigns || []);
  const [workspaces, setWorkspaces] = useState(() => staticStore.getWorkspaces().workspaces || []);
  const [analytics, setAnalytics] = useState(() => staticStore.getAnalytics({ period: '30d', workspaceId: 'all', role: 'user' }));
  const [loading, setLoading] = useState(false);

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [demoGuideOpen, setDemoGuideOpen] = useState(false);
  const [detailsLink, setDetailsLink] = useState(null);
  const [qrActiveLink, setQrActiveLink] = useState(null);

  // Toast System
  const [toasts, setToasts] = useState([]);

  const notify = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Fetch all core data from static store
  const fetchData = useCallback(() => {
    try {
      const roleParam = role === 'admin' ? 'admin' : 'user';
      const userParam = role === 'admin' ? 2 : 1;

      const dataLinks = staticStore.getLinks({
        role: roleParam,
        userId: userParam,
        workspaceId: selectedWorkspace
      });
      const dataCampaigns = staticStore.getCampaigns({
        role: roleParam,
        userId: userParam
      });
      const dataWorkspaces = staticStore.getWorkspaces();
      const dataAnalytics = staticStore.getAnalytics({
        period,
        campaignId: selectedCampaign,
        workspaceId: selectedWorkspace,
        role: roleParam
      });

      setLinks(dataLinks.links || []);
      setCampaigns(dataCampaigns.campaigns || []);
      setWorkspaces(dataWorkspaces.workspaces || []);
      setAnalytics(dataAnalytics);
    } catch (err) {
      console.error('Failed to load LinkPulse static data:', err);
    } finally {
      setLoading(false);
    }
  }, [role, selectedWorkspace, period, selectedCampaign]);

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchData();
  }, [fetchData]);

  // When role changes, switch tab cleanly via handler
  const handleSetRole = (newRole) => {
    setRole(newRole);
    if (newRole === 'visitor') {
      setCurrentTab('visitor');
    } else if (currentTab === 'visitor') {
      setCurrentTab('analytics');
    }
  };

  const handleLinkCreated = () => {
    fetchData();
  };

  const handleFilterCampaignFromCard = (campaignId) => {
    setSelectedCampaign(campaignId);
    setCurrentTab('links');
  };

  const handleOpenQrForLink = (link) => {
    setQrActiveLink(link);
    setCurrentTab('qr');
  };

  const handleReturnHome = () => {
    window.history.pushState(null, '', '/');
    setPathname('/');
  };

  const abuseCount = links.filter(l => l.status === 'disabled_abuse').length;

  if (pathname !== '/' && pathname.length > 1) {
    return <PublicVisitorView onReturnHome={handleReturnHome} />;
  }

  // Mobile bottom-nav tabs
  const mobileNavItems = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'links',     label: 'Links',     icon: Link2 },
    { id: 'campaigns', label: 'Campaigns', icon: Layers },
    { id: 'qr',        label: 'QR Studio', icon: QrCode },
    { id: 'bio',       label: 'Bio',       icon: Sparkles },
    { id: 'settings',  label: 'Settings',  icon: Settings },
  ];

  return (
    <div className="app-shell">
      {/* Mobile sidebar scrim */}
      {isMobileMenuOpen && (
        <div
          className="mobile-sidebar-scrim"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sleek Collapsible Frosted Glass Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => { setCurrentTab(tab); setIsMobileMenuOpen(false); }}
        role={role}
        setRole={handleSetRole}
        onOpenCreate={() => { setCreateModalOpen(true); setIsMobileMenuOpen(false); }}
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        setSelectedWorkspace={setSelectedWorkspace}
        abuseCount={abuseCount}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
      />

      {/* Main Content Layout */}
      <div className="main-content-layout">
        {/* Top Header Bar */}
        <TopHeader
          currentTab={currentTab}
          onOpenSimulator={() => setSimulatorOpen(true)}
          onOpenDemoGuide={() => setDemoGuideOpen(true)}
          totalLinksCount={links.length}
          totalClicksCount={analytics?.kpis?.totalVisits || analytics?.kpis?.totalClicks || 0}
          onMobileMenuToggle={() => setIsMobileMenuOpen(prev => !prev)}
        />

        {/* Scrollable Main Canvas */}
        <main className="main-canvas-scroll">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-muted)' }}>
              <div className="live-dot" style={{ width: '20px', height: '20px', margin: '0 auto 1.5rem' }} />
              <h2 style={{ fontSize: '1.25rem', color: 'white' }}>Initializing LinkPulse Hub...</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>Loading redirection telemetry and campaigns</p>
            </div>
          ) : (
            <>
              {currentTab === 'visitor' && (
                <VisitorPortalView
                  links={links}
                  onSwitchRole={handleSetRole}
                />
              )}

              {currentTab === 'analytics' && (
                <AnalyticsView
                  analytics={analytics}
                  period={period}
                  setPeriod={setPeriod}
                  selectedCampaign={selectedCampaign}
                  setSelectedCampaign={setSelectedCampaign}
                  campaigns={campaigns}
                  onOpenSimulator={() => setSimulatorOpen(true)}
                  onSelectLink={(link) => setDetailsLink(link)}
                />
              )}

              {currentTab === 'links' && (
                <LinksView
                  links={links}
                  campaigns={campaigns}
                  onRefresh={fetchData}
                  onSelectLink={(link) => setDetailsLink(link)}
                  onShowQr={handleOpenQrForLink}
                  notify={notify}
                  role={role}
                />
              )}

              {currentTab === 'campaigns' && (
                <CampaignsView
                  campaigns={campaigns}
                  onRefresh={fetchData}
                  onFilterCampaign={handleFilterCampaignFromCard}
                  notify={notify}
                />
              )}

              {currentTab === 'qr' && (
                <QRStudioView
                  links={links}
                  initialLink={qrActiveLink}
                  notify={notify}
                />
              )}

              {currentTab === 'import' && (
                <BulkImportView
                  campaigns={campaigns}
                  onRefresh={fetchData}
                  notify={notify}
                />
              )}

              {currentTab === 'bio' && (
                <BioBuilderView
                  notify={notify}
                />
              )}

              {currentTab === 'admin' && (
                <AdminAbuseView
                  links={links}
                  onRefresh={fetchData}
                  notify={notify}
                  role={role}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsView
                  workspaces={workspaces}
                  onRefresh={fetchData}
                  notify={notify}
                  role={role}
                />
              )}
            </>
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          {mobileNavItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`mobile-nav-item ${currentTab === id ? 'active' : ''}`}
              onClick={() => setCurrentTab(id)}
              aria-label={label}
            >
              {currentTab === id && <span className="mobile-nav-active-dot" />}
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Modals */}
      {createModalOpen && (
        <CreateLinkModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onLinkCreated={handleLinkCreated}
          campaigns={campaigns}
          notify={notify}
        />
      )}

      <SimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        links={links}
        onSimulated={fetchData}
        notify={notify}
      />

      <DemoGuideModal
        isOpen={demoGuideOpen}
        onClose={() => setDemoGuideOpen(false)}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenCreate={() => setCreateModalOpen(true)}
        onOpenSimulator={() => setSimulatorOpen(true)}
        onSetRole={(r) => handleSetRole(r)}
      />

      {detailsLink && (
        <LinkDetailsModal
          key={detailsLink.id}
          isOpen={Boolean(detailsLink)}
          link={detailsLink}
          onClose={() => setDetailsLink(null)}
          onOpenQr={handleOpenQrForLink}
          onRefresh={fetchData}
          campaigns={campaigns}
          notify={notify}
          role={role}
        />
      )}

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            {t.type === 'success' && <CheckCircle2 size={18} color="#10b981" />}
            {t.type === 'error' && <AlertCircle size={18} color="#ef4444" />}
            {t.type === 'info' && <Info size={18} color="#818cf8" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
