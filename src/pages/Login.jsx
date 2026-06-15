import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Anchor, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Login gagal. Periksa kembali email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox} className="glass-panel">
        <div style={styles.logoContainer}>
          <div style={styles.logoIcon}>
            <Anchor size={32} color="white" />
          </div>
          <h1 className="text-gradient" style={{ margin: '16px 0 8px 0' }}>SILOP</h1>
          <p className="text-muted" style={{ marginBottom: '32px' }}>Sistem Informasi Logistik Pelabuhan Terpadu</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <Mail size={18} color="var(--color-text-muted)" style={styles.inputIcon} />
            <input
              type="email"
              placeholder="Email Operator / Admin"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div style={styles.inputGroup}>
            <Lock size={18} color="var(--color-text-muted)" style={styles.inputIcon} />
            <input
              type="password"
              placeholder="Password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading ? 'Memproses...' : 'Masuk ke Sistem'}
          </button>
        </form>

        <div style={styles.footer}>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>
            * Untuk keperluan demo tanpa Supabase Keys, masukkan email apa saja dan password acak untuk bypass login menggunakan fitur Mock Auth.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-bg)',
    backgroundImage: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
  },
  loginBox: {
    width: '100%',
    maxWidth: '400px',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  logoIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    backgroundColor: 'var(--color-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-glow)',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    position: 'relative',
    width: '100%',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 48px',
    borderRadius: '10px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    transition: 'all var(--transition-fast)',
    fontSize: '1rem',
  },
  loginButton: {
    width: '100%',
    padding: '14px',
    fontSize: '1rem',
    marginTop: '8px',
    borderRadius: '10px',
  },
  errorBox: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid var(--color-danger)',
    borderRadius: '8px',
    color: 'var(--color-danger)',
    fontSize: '0.85rem',
    marginBottom: '16px',
    textAlign: 'center',
  },
  footer: {
    marginTop: '32px',
    textAlign: 'center',
  }
};
