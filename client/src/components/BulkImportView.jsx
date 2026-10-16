import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { staticStore } from '../staticStore';

const SAMPLE_CSV = `url,alias,title,campaign,tags
https://stripe.com/docs,stripe-dev,Stripe Integration Docs,Summer Launch 2026,payments;dev
https://malware-drop-test.xyz/hack,phish-link,Unsafe Threat Link,Tech Summit Keynote,malware
https://github.com/trending,summer26,Duplicate Summer Alias,Summer Launch 2026,code;trending
https://linear.app/features,linear-app,Linear Product Features,Mobile App Acquisition,product;saas
https://vercel.com/analytics,vercel-stats,Vercel Web Analytics,Summer Launch 2026,hosting;analytics`;

export default function BulkImportView({ onRefresh, notify }) {
  const [csvText, setCsvText] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleLoadSample = () => {
    setCsvText(SAMPLE_CSV);
    notify('Sample marketing links loaded into CSV editor', 'info');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target.result);
      notify(`Loaded "${file.name}"`, 'info');
    };
    reader.readAsText(file);
  };

  const handlePreview = async () => {
    if (!csvText.trim()) {
      notify('Please upload a file or paste CSV content', 'error');
      return;
    }

    setLoadingPreview(true);
    try {
      const data = await staticStore.previewBulkImport(csvText);
      setPreviewData(data);
      notify(`Preview generated: ${data.validCount} valid, ${data.invalidCount} rejected`, 'info');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!previewData || previewData.validCount === 0) {
      notify('No valid rows available to import', 'error');
      return;
    }

    setImporting(true);
    try {
      const validRows = previewData.rows.filter(r => r.isValid);
      const data = await staticStore.executeBulkImport(validRows);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      notify(`Successfully imported ${data.importedCount} short links in batch!`, 'success');
      setPreviewData(null);
      setCsvText('');
      onRefresh();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
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
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Bulk Link Import & Dry-Run Validation</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Upload CSV spreadsheets, preview collision checks & domain safety scans, and import in batch.
          </p>
        </div>

        <button
          onClick={handleLoadSample}
          className="btn-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          <Sparkles size={15} color="#818cf8" />
          <span>Load Test CSV Sample</span>
        </button>
      </div>

      {/* CSV Input Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>
            CSV Spreadsheet Content (Columns: <code>url, alias, title, campaign, tags</code>)
          </label>
          <label style={{
            fontSize: '0.8rem',
            cursor: 'pointer',
            color: '#818cf8',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <FileSpreadsheet size={15} />
            <span>Upload .csv File</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>

        <textarea
          className="glass-input"
          rows={7}
          placeholder="url,alias,title,campaign,tags&#10;https://stripe.com,stripe-dev,Stripe Docs,Summer 2026,api;docs"
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: '1.6' }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            onClick={handlePreview}
            disabled={loadingPreview}
            className="btn-primary"
            style={{ padding: '0.65rem 1.4rem' }}
          >
            {loadingPreview ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Validating Rows...</span>
              </>
            ) : (
              <>
                <span>Run Dry-Run Pre-Validation</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Table & Validation Diagnostics */}
      {previewData && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Summary Metric Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Pre-Validation Results</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Review rule diagnostics before executing database writes.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <span className="badge badge-active">{previewData.validCount} Valid</span>
                <span className="badge badge-abuse">{previewData.invalidCount} Rejected</span>
              </div>

              <button
                onClick={handleExecuteImport}
                disabled={importing || previewData.validCount === 0}
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
                }}
              >
                {importing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Import {previewData.validCount} Valid Links</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Rows List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {previewData.rows.map((row) => (
              <div
                key={row.rowIndex}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: row.isValid ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.08)',
                  border: row.isValid ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.25)',
                  fontSize: '0.85rem',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1', minWidth: 0 }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: row.isValid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: row.isValid ? '#34d399' : '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {row.rowIndex}
                  </span>

                  <div style={{ minWidth: 0, flex: '1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <strong style={{ color: 'white' }}>{row.title}</strong>
                      <span className="code-chip">/{row.alias}</span>
                    </div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.url}
                    </div>
                  </div>
                </div>

                {/* Validation Status & Issues */}
                <div style={{ textAlign: 'right' }}>
                  {row.isValid ? (
                    <span className="badge badge-active">
                      <CheckCircle size={12} /> Ready to Import
                    </span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                      <span className="badge badge-abuse">
                        <AlertTriangle size={12} /> Blocked
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
                        {row.issues.join(' | ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
