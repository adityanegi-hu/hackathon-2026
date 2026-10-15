import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Copy, 
  Check, 
  ExternalLink, 
  QrCode, 
  BarChart2, 
  Lock, 
  Smartphone, 
  Clock, 
  MousePointerClick, 
  ShieldAlert, 
  Play, 
  Pause, 
  Trash2, 
  Tag, 
  Layers, 
  AlertTriangle 
} from 'lucide-react';

export default function LinksView({ 
  links = [], 
  onRefresh, 
  onSelectLink, 
  onShowQr, 
  campaigns = [],
  notify,
  role 
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (code, id) => {
    const fullUrl = `${window.location.origin}/${code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    notify(`Copied short link to clipboard: ${fullUrl}`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (link) => {
    if (link.status === 'disabled_abuse') {
      notify('This link was suspended by an administrator for abuse policy violation and cannot be unpaused.', 'error');
      return;
    }

    const nextStatus = link.status === 'active' ? 'inactive' : 'active';
    const authHeaders = {
      'Content-Type': 'application/json',
      'x-role': role === 'admin' ? 'admin' : 'user',
      'x-user-id': role === 'admin' ? '2' : '1'
    };
    try {
      const res = await fetch(`/api/links/${link.id}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error('Failed to update link status');
      notify(`Link status changed to ${nextStatus}`, 'success');
      onRefresh();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDelete = async (link) => {
    if (!window.confirm(`Are you sure you want to permanently delete /${link.short_code}? All associated click analytics will also be cleared.`)) {
      return;
    }

    const authHeaders = {
      'x-role': role === 'admin' ? 'admin' : 'user',
      'x-user-id': role === 'admin' ? '2' : '1'
    };

    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (!res.ok) throw new Error('Failed to delete link');
      notify(`Link /${link.short_code} deleted successfully`, 'success');
      onRefresh();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Filter links
  const filteredLinks = links.filter(l => {
    const matchesSearch = 
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.short_code.toLowerCase().includes(search.toLowerCase()) ||
      l.original_url.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'expired' ? l.isExpired :
      statusFilter === 'limit' ? l.isLimitExceeded :
      l.status === statusFilter;

    const matchesCampaign = 
      campaignFilter === 'all' ? true :
      String(l.campaign_id) === String(campaignFilter);

    return matchesSearch && matchesStatus && matchesCampaign;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Search & Filter Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'rgba(15, 23, 42, 0.6)',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-medium)'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '420px' }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="glass-input"
            placeholder="Search links by title, code, or destination..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="glass-input"
            style={{ width: 'auto', fontSize: '0.85rem', padding: '0.6rem 0.9rem' }}
          >
            <option value="all" style={{ background: '#0f172a' }}>All Statuses</option>
            <option value="active" style={{ background: '#0f172a' }}>Active</option>
            <option value="inactive" style={{ background: '#0f172a' }}>Paused</option>
            <option value="expired" style={{ background: '#0f172a' }}>Expired</option>
            <option value="limit" style={{ background: '#0f172a' }}>Cap Limit Hit</option>
            <option value="disabled_abuse" style={{ background: '#0f172a' }}>Suspended (Abuse)</option>
          </select>

          {/* Campaign Filter */}
          <select
            value={campaignFilter}
            onChange={e => setCampaignFilter(e.target.value)}
            className="glass-input"
            style={{ width: 'auto', fontSize: '0.85rem', padding: '0.6rem 0.9rem' }}
          >
            <option value="all" style={{ background: '#0f172a' }}>All Campaigns</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id} style={{ background: '#0f172a' }}>
                {c.name}
              </option>
            ))}
          </select>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginLeft: '0.5rem' }}>
            Showing <strong>{filteredLinks.length}</strong> of {links.length} links
          </span>
        </div>
      </div>

      {/* Links List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filteredLinks.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Layers size={36} color="var(--text-dim)" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'white', marginBottom: '0.35rem' }}>No Links Matched Your Criteria</h3>
            <p style={{ fontSize: '0.85rem' }}>Try clearing your search query or status filter.</p>
          </div>
        ) : (
          filteredLinks.map(link => {
            const isSuspended = link.status === 'disabled_abuse';
            const isPaused = link.status === 'inactive';
            const isExpired = link.isExpired;
            const isLimitHit = link.isLimitExceeded;

            return (
              <div 
                key={link.id}
                className="glass-panel"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  borderLeft: isSuspended ? '4px solid #ef4444' : isExpired ? '4px solid #f59e0b' : isLimitHit ? '4px solid #f97316' : isPaused ? '4px solid #64748b' : '4px solid #10b981'
                }}
              >
                {/* Left: Info, Badges, URLs */}
                <div style={{ flex: '1', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                    <h3 
                      onClick={() => onSelectLink && onSelectLink(link)}
                      style={{ fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', color: 'white' }}
                      className="hover-bright"
                    >
                      {link.title}
                    </h3>

                    {/* Status Badges */}
                    {isSuspended && (
                      <span className="badge badge-abuse">
                        <AlertTriangle size={12} /> Suspended (Abuse)
                      </span>
                    )}
                    {isExpired && (
                      <span className="badge badge-expired">
                        <Clock size={12} /> Expired
                      </span>
                    )}
                    {isLimitHit && (
                      <span className="badge badge-limit">
                        <MousePointerClick size={12} /> Cap Limit Reached
                      </span>
                    )}
                    {!isSuspended && !isExpired && !isLimitHit && isPaused && (
                      <span className="badge badge-inactive">
                        <Pause size={12} /> Paused
                      </span>
                    )}
                    {!isSuspended && !isExpired && !isLimitHit && !isPaused && (
                      <span className="badge badge-active">
                        <Check size={12} /> Active
                      </span>
                    )}

                    {/* Campaign Pill */}
                    {link.campaign_name && (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: link.campaign_color || '#818cf8',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px'
                      }}>
                        📁 {link.campaign_name}
                      </span>
                    )}
                  </div>

                  {/* Short Link & Original Destination */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span className="code-chip">/{link.short_code}</span>
                      <button
                        onClick={() => handleCopy(link.short_code, link.id)}
                        title="Copy short link"
                        className="btn-ghost"
                        style={{ padding: '0.2rem 0.45rem' }}
                      >
                        {copiedId === link.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      </button>
                    </div>

                    <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>→</span>

                    <a 
                      href={link.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        maxWidth: '380px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      className="hover-bright"
                    >
                      <span>{link.original_url}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  {/* Redirection Rule Indicators */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {link.is_password_protected === 1 && (
                      <span style={{ fontSize: '0.72rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Lock size={12} /> Password Protected
                      </span>
                    )}
                    {link.mobile_url && (
                      <span style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Smartphone size={12} /> Mobile Device Override
                      </span>
                    )}
                    {link.click_limit && (
                      <span style={{ fontSize: '0.72rem', color: '#fb923c', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MousePointerClick size={12} /> Cap: {link.click_count}/{link.click_limit}
                      </span>
                    )}
                    {link.expires_at && (
                      <span style={{ fontSize: '0.72rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> Expires: {new Date(link.expires_at).toLocaleDateString()}
                      </span>
                    )}
                    {link.tags && link.tags.map(t => (
                      <span key={t} style={{ fontSize: '0.7rem', color: 'var(--text-dim)', background: 'rgba(255, 255, 255, 0.04)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: Click Count & Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  {/* Clicks Badge */}
                  <div style={{ textAlign: 'right', minWidth: '70px' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#818cf8' }}>
                      {link.click_count}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>clicks</div>
                  </div>

                  {/* Actions Button Group */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {/* Test Redirect button */}
                    <a
                      href={`/${link.short_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost"
                      title="Test live redirect in new tab"
                      style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}
                    >
                      <ExternalLink size={16} />
                    </a>

                    {/* QR Code */}
                    <button
                      onClick={() => onShowQr && onShowQr(link)}
                      className="btn-ghost"
                      title="Generate customizable QR Code"
                      style={{ padding: '0.5rem' }}
                    >
                      <QrCode size={16} />
                    </button>

                    {/* Analytics Deep Dive */}
                    <button
                      onClick={() => onSelectLink && onSelectLink(link)}
                      className="btn-ghost"
                      title="View individual link telemetry"
                      style={{ padding: '0.5rem' }}
                    >
                      <BarChart2 size={16} />
                    </button>

                    {/* Pause / Resume */}
                    {!isSuspended && (
                      <button
                        onClick={() => handleToggleStatus(link)}
                        className="btn-ghost"
                        title={link.status === 'active' ? 'Pause Redirection' : 'Activate Redirection'}
                        style={{ padding: '0.5rem' }}
                      >
                        {link.status === 'active' ? <Pause size={16} /> : <Play size={16} color="#10b981" />}
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(link)}
                      className="btn-ghost"
                      title="Delete link"
                      style={{ padding: '0.5rem', color: '#f87171' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
