import React, { useState } from 'react';
import { 
  FolderPlus, 
  Trash2, 
  ArrowRight 
} from 'lucide-react';

export default function CampaignsView({ 
  campaigns = [], 
  onRefresh, 
  onFilterCampaign, 
  notify 
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [loading, setLoading] = useState(false);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      notify('Campaign name is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, color })
      });
      if (!res.ok) throw new Error('Failed to create campaign');
      notify(`Campaign "${name}" created!`, 'success');
      setName('');
      setDescription('');
      setShowCreate(false);
      onRefresh();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async (camp) => {
    if (!window.confirm(`Delete campaign "${camp.name}"? Links inside this campaign will remain active but become unassigned.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/campaigns/${camp.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete campaign');
      notify(`Campaign "${camp.name}" removed`, 'success');
      onRefresh();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const sampleColors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header with Title and Create Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'rgba(15, 23, 42, 0.6)',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-medium)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Marketing Campaigns & Initiatives</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Group short links by marketing initiatives, track multi-channel aggregate velocity, and isolate performance.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary"
          style={{ padding: '0.65rem 1.25rem' }}
        >
          <FolderPlus size={16} />
          <span>New Campaign</span>
        </button>
      </div>

      {/* New Campaign Collapsible Form */}
      {showCreate && (
        <form 
          onSubmit={handleCreateCampaign}
          className="glass-panel"
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #818cf8' }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Create New Campaign</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Campaign Name *</label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. Q4 Growth Sprint"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Theme Accent Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {sampleColors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: c,
                      border: color === c ? '3px solid white' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Objective / Description</label>
            <input
              type="text"
              className="glass-input"
              placeholder="e.g. Multi-channel product announcement across LinkedIn, X, and direct email"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      )}

      {/* Campaigns Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        {campaigns.map(camp => (
          <div 
            key={camp.id}
            className="glass-panel"
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              borderTop: `4px solid ${camp.color || '#6366f1'}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: camp.color || '#6366f1' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'white' }}>{camp.name}</h3>
              </div>

              <button
                onClick={() => handleDeleteCampaign(camp)}
                className="btn-ghost"
                title="Delete campaign"
                style={{ padding: '0.35rem', color: '#f87171' }}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', minHeight: '38px', lineHeight: '1.5' }}>
              {camp.description || 'No description provided.'}
            </p>

            {/* Campaign Stats Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              padding: '0.85rem',
              background: 'rgba(15, 23, 42, 0.5)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Total Links</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'white' }}>{camp.link_count}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Total Clicks</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: camp.color || '#818cf8' }}>{camp.total_clicks}</div>
              </div>
            </div>

            {/* Top Link Preview */}
            {camp.topLink ? (
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                  🏆 <strong>Top:</strong> /{camp.topLink.short_code}
                </div>
                <span style={{ fontWeight: 700, color: 'white' }}>{camp.topLink.click_count} clicks</span>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1.25rem' }}>
                No links yet in this campaign.
              </div>
            )}

            {/* Filter Links by Campaign button */}
            <button
              onClick={() => onFilterCampaign && onFilterCampaign(camp.id)}
              className="btn-secondary"
              style={{ marginTop: 'auto', width: '100%', justifyContent: 'center' }}
            >
              <span>Explore Campaign Links</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
