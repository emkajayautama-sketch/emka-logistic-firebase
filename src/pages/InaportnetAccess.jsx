import React from 'react';
import { Globe2, ExternalLink, FileText, Anchor } from 'lucide-react';

export default function InaportnetAccess() {
  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '4px' }}>Portal Inaportnet Access</h1>
          <p className="text-muted">Shortcut Link & Embedded Webview untuk integrasi pemerintah</p>
        </div>
      </div>

      <div style={styles.grid}>
        <div className="card glass-panel" style={{ gridColumn: 'span 4' }}>
          <h3 style={styles.cardTitle}>Jalur Pintas (Shortcut Links)</h3>
          
          <div style={styles.shortcutList}>
            <a href="#" style={styles.shortcutItem} className="hover-lift">
              <div style={styles.shortcutIcon}><Anchor size={20} color="var(--color-primary)" /></div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Pengajuan Layanan Kapal</h4>
                <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>Short-link PKK / PPKB</p>
              </div>
              <ExternalLink size={16} color="var(--color-text-muted)" />
            </a>
            
            <a href="#" style={styles.shortcutItem} className="hover-lift">
              <div style={styles.shortcutIcon}><FileText size={20} color="var(--color-success)" /></div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>e-Tally & Warta Kapal</h4>
                <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>Laporan Warta Harian</p>
              </div>
              <ExternalLink size={16} color="var(--color-text-muted)" />
            </a>
          </div>

          <div style={styles.infoBox}>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              <strong>Tip:</strong> Gunakan tombol "Generate Copy-Paste Text" di Modul JPT untuk memudahkan pengisian form Inaportnet tanpa mengetik ulang.
            </p>
          </div>
        </div>

        <div className="card glass-panel" style={{ gridColumn: 'span 8', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Globe2 size={20} color="var(--color-primary)" />
            <span style={{ fontWeight: 600 }}>Embedded Inaportnet Webview</span>
          </div>
          <div style={{ flex: 1, backgroundColor: '#ffffff', minHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {/* Simulasi iframe */}
            <Globe2 size={64} color="#e2e8f0" style={{ marginBottom: '16px' }} />
            <h2 style={{ color: '#475569', margin: 0 }}>INAPORTNET PORTAL</h2>
            <p style={{ color: '#94a3b8' }}>Konten resmi akan dimuat di dalam iframe ini.</p>
            <button className="btn btn-primary" style={{ marginTop: '24px' }}>Muat Ulang Halaman</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { paddingBottom: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '24px',
  },
  cardTitle: {
    fontSize: '1.1rem',
    marginBottom: '20px',
  },
  shortcutList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  shortcutItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    transition: 'all var(--transition-fast)',
    textDecoration: 'none',
    color: 'inherit',
  },
  shortcutIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: 'var(--color-surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    padding: '16px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderLeft: '4px solid var(--color-primary)',
    borderRadius: '8px',
    color: 'var(--color-text-primary)',
  }
};
