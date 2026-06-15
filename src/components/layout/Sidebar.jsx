import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  Container, 
  ScanLine, 
  Globe2, 
  FileBarChart, 
  Wallet, 
  Database,
  Anchor
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard Monitoring', icon: LayoutDashboard },
  { path: '/operasional-jpt', label: 'Operasional JPT', icon: Truck },
  { path: '/operasional-pbm', label: 'Operasional PBM', icon: Container },
  { path: '/gate-scanner', label: 'Gate & Scanner', icon: ScanLine },
  { path: '/inaportnet', label: 'Inaportnet Access', icon: Globe2 },
  { path: '/laporan', label: 'Laporan Regulasi', icon: FileBarChart },
  { path: '/keuangan', label: 'Biro Keuangan', icon: Wallet },
  { path: '/master-data', label: 'Master Data', icon: Database },
];

export default function Sidebar() {
  return (
    <aside style={styles.sidebar} className="glass-panel">
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>
          <Anchor size={24} color="var(--color-primary)" />
        </div>
        <h2 style={styles.logoText} className="text-gradient">SILOP</h2>
      </div>
      
      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {})
              })}
            >
              <Icon size={20} style={{ opacity: 0.8 }} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      
      <div style={styles.footer}>
        <p className="text-muted" style={{ fontSize: '0.75rem' }}>© 2026 EMKA JAYA UTAMA</p>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '280px',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid var(--color-border)',
    borderTop: 'none',
    borderBottom: 'none',
    borderLeft: 'none',
    borderRadius: '0',
    backgroundColor: 'var(--color-surface)',
    zIndex: 10,
  },
  logoContainer: {
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid var(--color-border)',
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 700,
    letterSpacing: '1px',
  },
  nav: {
    flex: 1,
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    color: 'var(--color-text-secondary)',
    fontWeight: 500,
    transition: 'all var(--transition-fast)',
  },
  navItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: 'var(--color-primary)',
    fontWeight: 600,
  },
  footer: {
    padding: '24px',
    borderTop: '1px solid var(--color-border)',
    textAlign: 'center',
  }
};
