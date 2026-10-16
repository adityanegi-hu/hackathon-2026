import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  ShieldAlert, 
  QrCode, 
  Link2, 
  Smartphone, 
  Monitor, 
  Tablet,
  Filter,
  Play 
} from 'lucide-react';

export default function AnalyticsView({ 
  analytics, 
  period, 
  setPeriod, 
  selectedCampaign, 
  setSelectedCampaign, 
  campaigns = [], 
  onOpenSimulator, 
  onSelectLink 
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [showAlertsDetails, setShowAlertsDetails] = useState(false);

  useEffect(() => {
    fetch('/api/alerts')
      .then(r => r.json())
      .then(data => setAlerts(data))
      .catch(err => console.error('Failed to load alerts:', err));
  }, []);

  if (!analytics) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
        <div className="live-dot" style={{ margin: '0 auto 1rem', width: '16px', height: '16px' }} />
        <h3>Loading Real-Time Analytics...</h3>
      </div>
    );
  }

  const { kpis, timeSeries = [], devices = [], referrers = [], countries = [], topLinks = [], recentClicks = [] } = analytics;

  // Compute Max for SVG timeline scaling
  const maxClicks = Math.max(...timeSeries.map(t => t.clicks), 10);
  const chartHeight = 180;
  const chartWidth = 720;

  // Calculate SVG line points
  const points = timeSeries.map((t, idx) => {
    const x = (idx / Math.max(timeSeries.length - 1, 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - 20 - (t.clicks / maxClicks) * (chartHeight - 50);
    return { x, y, ...t };
  });

  const svgPath = points.length > 0 
    ? points.reduce((acc, curr, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '')
    : '';

  const svgArea = points.length > 0
    ? `${svgPath} L ${points[points.length - 1].x} ${chartHeight - 10} L ${points[0].x} ${chartHeight - 10} Z`
    : '';

  // Calculate device percentages
  const totalDeviceClicks = devices.reduce((acc, d) => acc + d.count, 0) || 1;
  const getDeviceIcon = (type) => {
    if (type === 'mobile') return <Smartphone size={16} color="#06b6d4" />;
    if (type === 'tablet') return <Tablet size={16} color="#a855f7" />;
    return <Monitor size={16} color="#6366f1" />;
  };

  // Helper for country flags
  const getFlagEmoji = (countryCode) => {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Top Controls: Period Selector, Campaign Filter, Live Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'rgba(15, 23, 42, 0.5)',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span className="live-dot" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#34d399' }}>
              Live Telemetry
            </span>
          </div>
          <span style={{ color: 'var(--border-medium)' }}>|</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Data streams asynchronously without slowing redirects
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Campaign Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={15} color="var(--text-dim)" />
            <select
              value={selectedCampaign || ''}
              onChange={e => setSelectedCampaign(e.target.value)}
              className="glass-input"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem', width: 'auto' }}
            >
              <option value="" style={{ background: '#0f172a' }}>All Campaigns</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id} style={{ background: '#0f172a' }}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selector Pills */}
          <div style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '0.2rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-medium)'
          }}>
            {[
              { id: '24h', label: '24 Hours' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'all', label: 'All Time' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                style={{
                  border: 'none',
                  background: period === p.id ? '#6366f1' : 'transparent',
                  color: period === p.id ? 'white' : 'var(--text-muted)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Quick Simulate Button */}
          <button
            onClick={onOpenSimulator}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
          >
            <Play size={13} color="#10b981" />
            <span>Simulate Visit</span>
          </button>
        </div>
      </div>

      {/* Link Alerts & Health Center */}
      {alerts && alerts.totalAlerts > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '0.4rem', borderRadius: '8px' }}>
                <ShieldAlert size={18} color="#f59e0b" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <strong style={{ color: '#fbbf24', fontSize: '0.9rem' }}>Link Alerts & Health Center</strong>
                  <span style={{ fontSize: '0.72rem', background: '#f59e0b', color: '#000', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
                    {alerts.totalAlerts} Active
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#fde68a' }}>
                  {alerts.capAlerts.length} near cap limit, {alerts.expiryAlerts.length} expiring soon, {alerts.abuseAlerts.length} suspended
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAlertsDetails(!showAlertsDetails)}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              <span>{showAlertsDetails ? 'Hide Diagnostics' : 'Inspect Alert Details'}</span>
            </button>
          </div>

          {/* Expandable Alert Items */}
          {showAlertsDetails && (
            <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {alerts.capAlerts.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#fde68a' }}>
                  <span>🎯 Cap Alert: <strong>/{a.short_code}</strong> has reached {a.click_count} of {a.click_limit} allowed visits</span>
                  <button onClick={() => onSelectLink && onSelectLink(a)} className="btn-ghost" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>View Link →</button>
                </div>
              ))}
              {alerts.expiryAlerts.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#fde68a' }}>
                  <span>⏳ Expiry Alert: <strong>/{a.short_code}</strong> expires on {new Date(a.expires_at).toLocaleDateString()}</span>
                  <button onClick={() => onSelectLink && onSelectLink(a)} className="btn-ghost" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>View Link →</button>
                </div>
              ))}
              {alerts.abuseAlerts.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#fca5a5' }}>
                  <span>🛑 Safety Alert: <strong>/{a.short_code}</strong> was disabled ({a.abuse_reason || 'Policy violation'})</span>
                  <button onClick={() => onSelectLink && onSelectLink(a)} className="btn-ghost" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>View Link →</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Total Clicks */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Tracked Visits</span>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
              <BarChart3 size={18} color="#818cf8" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'white' }}>
            {kpis.totalClicks?.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: '#34d399', fontWeight: 600 }}>{kpis.humanClicks} human</span>
            <span>•</span>
            <span>{kpis.botClicks} bot filtered</span>
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)' }}>Unique Visitors</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
              <Users size={18} color="#34d399" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'white' }}>
            {kpis.uniqueVisitors?.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
            Uniqueness Ratio: <strong style={{ color: '#34d399' }}>{kpis.totalClicks > 0 ? Math.round((kpis.uniqueVisitors / kpis.totalClicks) * 100) : 0}%</strong>
          </div>
        </div>

        {/* QR Code Scans */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)' }}>QR Code Scans</span>
            <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
              <QrCode size={18} color="#c084fc" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'white' }}>
            {kpis.qrClicks?.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
            Mobile scan conversion: <strong style={{ color: '#c084fc' }}>{kpis.totalClicks > 0 ? Math.round((kpis.qrClicks / kpis.totalClicks) * 100) : 0}%</strong>
          </div>
        </div>

        {/* Bot Traffic Filtered */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)' }}>Bot Scrapers Blocked</span>
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
              <ShieldAlert size={18} color="#f87171" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'white' }}>
            {kpis.botClicks?.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
            Filtered from real human metrics
          </div>
        </div>

        {/* Active Short Links */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active Short Links</span>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
              <Link2 size={18} color="#38bdf8" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'white' }}>
            {kpis.activeLinks?.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
            Out of {kpis.totalLinks} total links in system
          </div>
        </div>
      </div>

      {/* Main Charts Row: Timeline Chart & Devices */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2.2fr 1fr',
        gap: '1.25rem',
        alignItems: 'stretch'
      }}>
        {/* Timeline Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Click Trajectory Over Time</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Aggregated telemetry for period: {period}</p>
            </div>
            {hoveredPoint && (
              <div style={{
                background: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid var(--border-medium)',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.8rem'
              }}>
                <span style={{ color: 'var(--text-dim)' }}>{hoveredPoint.label}: </span>
                <strong style={{ color: '#818cf8' }}>{hoveredPoint.clicks} clicks</strong>
                <span style={{ color: 'var(--text-dim)' }}> ({hoveredPoint.uniques} unique)</span>
              </div>
            )}
          </div>

          {/* SVG Smooth Area Line Chart */}
          <div style={{ position: 'relative', width: '100%', height: '220px', marginTop: 'auto' }}>
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              preserveAspectRatio="none"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                  <stop offset="80%" stopColor="#6366f1" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = chartHeight - 20 - ratio * (chartHeight - 50);
                return (
                  <line 
                    key={i} 
                    x1="20" 
                    y1={y} 
                    x2={chartWidth - 20} 
                    y2={y} 
                    stroke="rgba(255, 255, 255, 0.06)" 
                    strokeDasharray="4 4" 
                  />
                );
              })}

              {/* Area & Line */}
              {svgArea && <path d={svgArea} fill="url(#chartGradient)" />}
              {svgPath && (
                <path 
                  d={svgPath} 
                  fill="none" 
                  stroke="#818cf8" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}

              {/* Data points */}
              {points.map((pt, idx) => (
                <g key={idx} onMouseEnter={() => setHoveredPoint(pt)} onMouseLeave={() => setHoveredPoint(null)}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint?.label === pt.label ? 6 : 3.5}
                    fill={hoveredPoint?.label === pt.label ? '#c084fc' : '#818cf8'}
                    stroke="#0f172a"
                    strokeWidth="2"
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  />
                </g>
              ))}
            </svg>

            {/* X-axis labels */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.4rem 1rem 0',
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
              fontFamily: 'var(--font-mono)'
            }}>
              {timeSeries.filter((_, i) => i % Math.ceil(timeSeries.length / 6) === 0).map((t, idx) => (
                <span key={idx}>{t.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Devices Breakdown Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>Device Breakdown</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Client device distribution</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 'auto', marginBottom: 'auto' }}>
            {devices.map(d => {
              const pct = Math.round((d.count / totalDeviceClicks) * 100);
              return (
                <div key={d.device_type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'capitalize' }}>
                      {getDeviceIcon(d.device_type)}
                      <span style={{ fontWeight: 600 }}>{d.device_type}</span>
                    </div>
                    <div>
                      <strong style={{ color: 'white' }}>{pct}%</strong>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginLeft: '0.4rem' }}>({d.count})</span>
                    </div>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: d.device_type === 'mobile' ? '#06b6d4' : d.device_type === 'tablet' ? '#a855f7' : '#6366f1',
                      borderRadius: '9999px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{
            marginTop: '1.25rem',
            padding: '0.75rem',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.78rem',
            color: 'var(--text-muted)'
          }}>
            💡 <strong>Targeting tip:</strong> Mobile visits can be routed to App Stores via LinkPulse Device Rules.
          </div>
        </div>
      </div>

      {/* Middle Row: Referrers & Geographic Distribution */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.25rem'
      }}>
        {/* Top Referrers */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>Traffic Sources & Referrers</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1.25rem' }}>Top origin platforms</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {referrers.map((ref, idx) => (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-dim)'
                  }}>
                    {idx + 1}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>{ref.referrer}</div>
                    <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 500 }}>{ref.referrer_type}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{ref.count}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>visits</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>Geographic Distribution</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1.25rem' }}>Visitor location telemetry</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {countries.map((geo, idx) => (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>{getFlagEmoji(geo.country_code)}</span>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>{geo.country}</div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Region Code: {geo.country_code}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{geo.count}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>visits</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Performing Links & Live Click Stream */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.3fr 1fr',
        gap: '1.25rem'
      }}>
        {/* Top Performing Links Table */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Top Performing Links</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Highest converting campaigns</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {topLinks.map((link) => (
              <div
                key={link.id}
                onClick={() => onSelectLink && onSelectLink(link)}
                style={{
                  padding: '0.85rem 1rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                className="hover-bright"
              >
                <div style={{ maxWidth: '65%' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {link.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span className="code-chip">/{link.short_code}</span>
                    {link.campaign_name && (
                      <span style={{ fontSize: '0.72rem', color: '#c084fc', background: 'rgba(168, 85, 247, 0.12)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {link.campaign_name}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#818cf8' }}>
                    {link.click_count}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>total clicks</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Click Stream Feed */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span className="live-dot" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Live Click Stream</h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Recent incoming redirects</p>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Real-time</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '360px', paddingRight: '0.3rem' }}>
            {recentClicks.slice(0, 10).map((click) => (
              <div
                key={click.id}
                style={{
                  padding: '0.6rem 0.8rem',
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{getFlagEmoji(click.country_code)}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: 'white' }}>
                      /{click.short_code}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      {click.city}, {click.country}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
                    {click.is_qr === 1 && <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>QR</span>}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{click.device_type}</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                    {new Date(click.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
