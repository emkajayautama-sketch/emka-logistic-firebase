import React from 'react';
import { Bell, Search, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header style={styles.header} className="glass-panel">
      <div style={styles.searchContainer}>
        <Search size={18} color="var(--color-text-muted)" style={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Cari manifest, plat nomor, dokumen..." 
          style={styles.searchInput}
        />
      </div>

      <div style={styles.actions}>
        <button style={styles.iconButton} className="btn-outline">
          <Bell size={20} />
          <span style={styles.badge}>3</span>
        </button>
        <div style={styles.userProfile}>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.email || 'Admin Utama'}</span>
            <span style={styles.userRole}>{user?.role || 'Superadmin'}</span>
          </div>
          <div style={styles.avatar}>
            <User size={20} color="var(--color-primary)" />
          </div>
        </div>
        <button onClick={handleLogout} className="btn-outline" style={{ padding: '8px', borderRadius: '8px' }} title="Logout">
          <LogOut size={20} color="var(--color-danger)" />
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: '80px',
    padding: '0 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--color-border)',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderRadius: '0',
    backgroundColor: 'var(--color-bg)',
    zIndex: 5,
  },
  searchContainer: {
    position: 'relative',
    width: '400px',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px 12px 48px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    transition: 'border-color var(--transition-fast)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  iconButton: {
    position: 'relative',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: 'var(--color-danger)',
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid var(--color-bg)',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  userName: {
    fontWeight: 600,
    fontSize: '0.9rem',
  },
  userRole: {
    color: 'var(--color-primary)',
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(59, 130, 246, 0.2)',
  }
};
