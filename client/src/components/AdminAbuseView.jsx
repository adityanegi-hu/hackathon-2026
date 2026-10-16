import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Trash2, 
  Ban,
  RotateCcw 
} from 'lucide-react';

import staticStore from '../staticStore';

export default function AdminAbuseView({ onRefresh, notify, links = [] }) {
  const [adminData, setAdminData] = useState(null);
  const [blocklist, setBlocklist] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [newReason, setNewReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [takedownId, setTakedownId] = useState('');
  const [takedownReason, setTakedownReason] = useState('');
  const [users, setUsers] = useState([]);

  const loadAdminData = () => {
    try {
      const dataOverview = staticStore.getAdminOverview();
      const dataBlocklist = staticStore.getAdminBlocklist();
      const dataUsers = staticStore.getAdminUsers();
      setAdminData(dataOverview);
      setBlocklist(dataBlocklist.blocklist || []);
      setUsers(dataUsers.users || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleAddBlocklist = async (e) => {
    e.preventDefault();
    if (!newDomain.trim()) {
      notify('Domain is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = staticStore.addAdminBlocklist({ domain: newDomain, reason: newReason });
      notify(`Domain "${res.entry.domain}" added to blocklist. ${res.quarantinedCount || 0} links neutralized.`, 'success');
      setNewDomain('');
      setNewReason('');
      loadAdminData();
      onRefresh();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBlocklist = (id, domain) => {
    try {
      staticStore.removeAdminBlocklist(id);
      notify(`Domain "${domain}" removed from safety blocklist`, 'info');
      loadAdminData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleRestoreLink = (linkId) => {
    try {
      staticStore.restoreLink(linkId);
      notify('Link restored to active status.', 'success');
      loadAdminData();
      onRefresh();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleTakedownLink = (e) => {
    e.preventDefault();
    if (!takedownId) {
      notify('Please select a link to take down', 'error');
      return;
    }

    try {
      staticStore.disableLinkAbuse(takedownId, takedownReason || 'Administrative takedown due to safety violation');
      notify('Link immediately deactivated and blocked from redirection.', 'success');
      setTakedownId('');
      setTakedownReason('');
      loadAdminData();
      onRefresh();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const metrics = adminData?.metrics || {};
  const flaggedLinks = adminData?.flaggedLinks || [];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '0.65rem', borderRadius: '12px' }}>
            <ShieldAlert size={28} color="#ef4444" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>Abuse Monitoring & Platform Governance</h2>
              <span className="badge badge-abuse">Administrator Level</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#fca5a5' }}>
              Enforce domain blocklists, investigate phishing attempts, and take down malicious links in real time.
            </p>
          </div>
        </div>
      </div>

      {/* Security Metrics Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem'
      }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Blocked Malicious Domains</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444', marginTop: '0.25rem' }}>
            {metrics.blockedDomains || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Auto-quarantine active</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Suspended Links</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f97316', marginTop: '0.25rem' }}>
            {metrics.disabledAbuseLinks || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Redirects stopped immediately</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Bot Crawlers Neutralized</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#a855f7', marginTop: '0.25rem' }}>
            {metrics.botClicks || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Filtered from user metrics</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Platform Registered Links</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginTop: '0.25rem' }}>
            {metrics.totalLinks || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>{metrics.activeLinks || 0} healthy active</div>
        </div>
      </div>

      {/* 2-Column Controls: Add Blocklist Domain & Instant Takedown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        
        {/* Domain Blocklist Console */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Domain Safety Blocklist</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Prevents short link creation to phishing or malware hostnames.
              </p>
            </div>
          </div>

          {/* Add Domain Form */}
          <form onSubmit={handleAddBlocklist} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input
                type="text"
                className="glass-input"
                placeholder="domain-to-block.xyz"
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                required
              />
              <input
                type="text"
                className="glass-input"
                placeholder="Reason (e.g. Phishing / Malware)"
                value={newReason}
                onChange={e => setNewReason(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-danger"
              style={{ alignSelf: 'flex-start' }}
            >
              <Ban size={15} />
              <span>Block Domain & Quarantine Links</span>
            </button>
          </form>

          {/* Blocklist Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
            {blocklist.map(b => (
              <div 
                key={b.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#fca5a5', fontFamily: 'var(--font-mono)' }}>
                    🚫 {b.domain}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {b.reason || 'Safety policy violation'}
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveBlocklist(b.id, b.domain)}
                  className="btn-ghost"
                  title="Remove from blocklist"
                  style={{ color: 'var(--text-dim)', padding: '0.3rem' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Immediate Link Takedown Action Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Immediate Link Takedown</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Instantly revoke redirection for any suspicious link on the platform.
            </p>
          </div>

          <form onSubmit={handleTakedownLink} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Select Target Link to Suspend
              </label>
              <select
                className="glass-input"
                value={takedownId}
                onChange={e => setTakedownId(e.target.value)}
                required
              >
                <option value="" style={{ background: '#0f172a' }}>Select a link...</option>
                {links.filter(l => l.status === 'active').map(l => (
                  <option key={l.id} value={l.id} style={{ background: '#0f172a' }}>
                    /{l.short_code} — {l.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Abuse Notice / Reason for Suspension
              </label>
              <textarea
                className="glass-input"
                rows={3}
                placeholder="e.g. Reported for credential phishing in user complaint #412"
                value={takedownReason}
                onChange={e => setTakedownReason(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-danger"
              style={{ padding: '0.7rem 1.25rem', width: '100%', justifyContent: 'center' }}
            >
              <Ban size={16} />
              <span>Suspend Link Immediately</span>
            </button>
          </form>
        </div>

      </div>

      {/* Flagged / Suspended Links Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Suspended Links Audit Trail</h3>
        
        {flaggedLinks.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', padding: '1rem 0' }}>
            No links currently under administrative suspension.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {flaggedLinks.map(link => (
              <div
                key={link.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  gap: '1rem'
                }}
              >
                <div style={{ flex: '1', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="badge badge-abuse">Suspended</span>
                    <strong style={{ color: 'white' }}>{link.title}</strong>
                    <span className="code-chip">/{link.short_code}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#fca5a5', marginBottom: '0.25rem' }}>
                    ⚠️ Reason: {link.abuse_reason || 'Policy violation'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Target: {link.original_url}
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => handleRestoreLink(link.id)}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                  >
                    <RotateCcw size={14} color="#10b981" />
                    <span>Restore Link</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform Users & Access Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Platform Users & Account Governance ({users.length})</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {users.map(u => (
            <div
              key={u.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ color: 'white' }}>{u.username}</strong>
                  <span className={u.role === 'admin' ? 'badge badge-abuse' : 'badge badge-active'} style={{ fontSize: '0.7rem' }}>
                    {u.role.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                  {u.email} • Joined {new Date(u.created_at).toLocaleDateString()}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#818cf8' }}>
                  {u.link_count} links ({u.total_clicks} clicks)
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  User ID: #{u.id}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
