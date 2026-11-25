import React, { useState } from 'react';
import { api } from '../services/api';
import { UploadCloud, AlertCircle, X, Download } from 'lucide-react';

export default function UploadCsvModal({ isOpen, onClose, projectId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Please drop a valid .csv file');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file first');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await api.uploadCSV(projectId, file);
      onUploadSuccess(result);
      onClose();
    } catch (err) {
      setError(err.message || 'CSV upload failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent =
      'text,isGoldStandard,goldLabel,source\n' +
      '"The onboarding was exceptionally smooth!",true,"Positive","Customer Survey"\n' +
      '"The app crashed when I pressed the export button.",true,"Negative","Bug Report"\n' +
      '"How do I update my billing email address?",false,"","Support Ticket"\n' +
      '"Great experience with the support specialist.",false,"","Intercom Chat"\n';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_tasks.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff' }}>
              Import Tasks via CSV
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Bulk upload items for labeling with optional gold benchmark labels
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            fontSize: '0.85rem',
            color: '#fda4af',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '36px 20px',
            textAlign: 'center',
            background: dragOver ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-elevated)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '16px'
          }}
          onClick={() => document.getElementById('csv-file-input').click()}
        >
          <input
            id="csv-file-input"
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <UploadCloud size={42} color={dragOver ? 'var(--accent-cyan)' : 'var(--accent-primary)'} style={{ margin: '0 auto 12px' }} />
          {file ? (
            <div>
              <p style={{ fontWeight: 600, color: '#fff', fontSize: '1rem' }}>{file.name}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                {(file.size / 1024).toFixed(1)} KB — Click to change file
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>
                Drag & Drop your CSV file here, or browse
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Requires a <code>text</code> column in header row
              </p>
            </div>
          )}
        </div>

        {/* Template download & format tip */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Need the CSV format template?</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Includes columns: text, isGoldStandard, goldLabel, metadata</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={downloadSampleCSV}>
            <Download size={14} /> Download Sample
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? 'Importing Tasks...' : 'Import CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
