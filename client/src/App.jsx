import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
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
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('analytics');
  const [role, setRole] = useState('user'); // 'user' | 'admin' | 'visitor'
  const [period, setPeriod] = useState('30d');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('all');

  // Data State
  const [links, setLinks] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Fetch all core data
  const fetchData = async () => {
    try {
      const roleParam = role === 'admin' ? 'admin' : 'user';
      const userParam = role === 'admin' ? '2' : '1';
      const authHeaders = {
        'x-role': roleParam,
        'x-user-id': userParam
      };

      const queryParams = new URLSearchParams({
        period,
        role: roleParam,
        userId: userParam,
        ...(selectedCampaign ? { campaignId: selectedCampaign } : {})
      });

      const linksParams = new URLSearchParams({
        role: roleParam,
        userId: userParam,
        ...(selectedWorkspace && selectedWorkspace !== 'all' ? { workspaceId: selectedWorkspace } : {})
      });

      const [resLinks, resCampaigns, resWorkspaces, resAnalytics] = await Promise.all([
        fetch(`/api/links?${linksParams}`, { headers: authHeaders }),
        fetch(`/api/campaigns?role=${roleParam}&userId=${userParam}`, { headers: authHeaders }),
        fetch('/api/workspaces', { headers: authHeaders }),
        fetch(`/api/analytics?${queryParams}`, { headers: authHeaders })
      ]);

      const dataLinks = await resLinks.json();
      const dataCampaigns = await resCampaigns.json();
      const dataWorkspaces = await resWorkspaces.json();
      const dataAnalytics = await resAnalytics.json();

      setLinks(dataLinks.links || []);
      setCampaigns(dataCampaigns.campaigns || []);
      setWorkspaces(dataWorkspaces.workspaces || []);
      setAnalytics(dataAnalytics);
    } catch (err) {
      console.error('Failed to load LinkPulse data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, selectedCampaign, selectedWorkspace, role]);

  // When role changes to visitor, switch tab to visitor portal
  useEffect(() => {
    if (role === 'visitor') {
      setCurrentTab('visitor');
    } else if (currentTab === 'visitor') {
      setCurrentTab('analytics');
    }
  }, [role]);

  const handleLinkCreated = (newLink) => {
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

  const abuseCount = links.filter(l => l.status === 'disabled_abuse').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header & Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        role={role}
        setRole={setRole}
        onOpenCreate={() => setCreateModalOpen(true)}
        onOpenSimulator={() => setSimulatorOpen(true)}
        onOpenDemoGuide={() => setDemoGuideOpen(true)}
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        setSelectedWorkspace={setSelectedWorkspace}
        abuseCount={abuseCount}
      />

      {/* Main App Container */}
      <main style={{
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        flex: '1'
      }}>
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
                onSwitchRole={(newRole) => setRole(newRole)}
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

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(7, 9, 19, 0.95)',
        padding: '1.5rem',
        textAlign: 'center',
        fontSize: '0.825rem',
        color: 'var(--text-dim)'
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>LinkPulse</span>
            <span>•</span>
            <span>Enterprise URL Shortening & Analytics Platform</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span>SQLite Embedded Database</span>
            <span>•</span>
            <span>Async Non-Blocking Redirects</span>
            <span>•</span>
            <span style={{ color: '#10b981' }}>● System Healthy</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateLinkModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onLinkCreated={handleLinkCreated}
        campaigns={campaigns}
        notify={notify}
      />

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
        onSetRole={(r) => setRole(r)}
      />

      <LinkDetailsModal
        isOpen={Boolean(detailsLink)}
        link={detailsLink}
        onClose={() => setDetailsLink(null)}
        onOpenQr={handleOpenQrForLink}
        onRefresh={fetchData}
        campaigns={campaigns}
        notify={notify}
        role={role}
      />

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
