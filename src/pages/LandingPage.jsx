import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Ship, 
  Truck, 
  Search, 
  ArrowRight, 
  PackageCheck, 
  Anchor, 
  CheckCircle2,
  FileText,
  Clock,
  ShieldCheck,
  Building2,
  Users,
  Compass,
  Target,
  Home,
  Phone
} from 'lucide-react';
import { supabase } from '../config/supabaseClient';

const LandingPage = () => {
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingStatus, setTrackingStatus] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setTrackingStatus(null);

    try {
      const { data, error } = await supabase
        .from('manifests')
        .select('*')
        .eq('manifest_number', trackingNumber.trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setSearchError('Manifest tidak ditemukan. Pastikan nomor sudah benar.');
        } else {
          setSearchError('Terjadi kesalahan saat melacak manifest.');
        }
      } else if (data) {
        setTrackingStatus(data);
      }
    } catch (err) {
      setSearchError('Terjadi kesalahan jaringan.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="landing-page" style={{ overflowY: 'auto', height: '100vh', scrollBehavior: 'smooth', backgroundColor: '#ffffff', color: '#1e293b' }}>
      <style>{`
        /* Floating illustrations for PBM (ship) and JPT (truck) */
        .float-ship, .float-truck {
          position: absolute;
          opacity: 0.12;
          filter: drop-shadow(0 8px 20px rgba(0,0,0,0.06));
          transform-origin: center;
        }
        .float-ship { left: 6%; top: 18%; width: 220px; animation: floatY 6s ease-in-out infinite, rotateZ 12s linear infinite; }
        .float-truck { right: 6%; bottom: 8%; width: 200px; animation: floatY 5s ease-in-out infinite reverse, rotateZ 14s linear infinite; }
        .hero-content { transition: all 0.3s ease; }
        .hero-title { transition: all 0.3s ease; }
        .hero-subtitle { transition: all 0.3s ease; }
        .nav-links { transition: all 0.3s ease; }
        .tracking-card, .service-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .cta-buttons { transition: all 0.3s ease; }
        .hamburger-btn { display: none; border: none; background: transparent; padding: 0.6rem; cursor: pointer; }
        .hamburger-line { display: block; width: 26px; height: 3px; margin: 5px 0; background: #334155; border-radius: 999px; }
        .nav-open { display: flex !important; }
        .mobile-menu-overlay { display: none; }
        /* mobile dropdown removed; navigation uses horizontal scroll on small screens */
        @keyframes floatY { 0% { transform: translateY(0px); } 50% { transform: translateY(-18px); } 100% { transform: translateY(0px); } }
        @keyframes rotateZ { 0% { transform: rotate(0deg); } 50% { transform: rotate(3deg); } 100% { transform: rotate(0deg); } }
        @media (max-width: 1024px) {
          .hamburger-btn { display: none; }
          .nav-links { gap: 1rem; justify-content: flex-start; flex-wrap: nowrap; overflow-x: auto; padding: 0 1rem; width: 100%; background: rgba(255,255,255,0.96); position: sticky; top: 0; left: 0; right: 0; z-index: 200; }
          .nav-links a, .nav-links button { flex: 0 0 auto; }
          .hero { padding: 6rem 1.5rem 3rem; }
          .hero-content { padding: 2rem 1.2rem; border-radius: 24px; }
          .hero-title { font-size: 3rem !important; }
          .hero-subtitle { font-size: 1.05rem !important; max-width: 100% !important; }
          .cta-buttons { flex-direction: column; gap: 0.9rem; }
          .cta-buttons button, .cta-buttons a { width: 100% !important; }
          .tracking-card { width: 100%; }
          .services-grid { grid-template-columns: 1fr !important; }
          .service-card { width: 100%; }
        }
        @media (max-width: 640px) {
          .hero-title { font-size: 2.4rem !important; }
          .hero-subtitle { font-size: 1rem !important; }
          .hero { padding: 5.5rem 1rem 2rem; }
          .login-btn-mobile { width: 100%; justify-content: center; }
          .nav-links { display: none; }
          /* dropdown removed; nav-links will show as horizontal scroll */
          .trackingForm { flex-direction: column !important; }
          .trackingInput { width: 100% !important; }
          .cta-buttons { gap: 0.75rem; }
          .ctaPrimary, .ctaSecondary { width: 100% !important; }
        }
        @media (max-width: 480px) {
          .hero-title { font-size: 2rem !important; }
          .hero { padding: 5rem 0.8rem 2rem; }
          .hero-content { padding: 1.8rem 1rem; }
        }
      `}</style>

      {/* Navbar */}
      <nav style={styles.navbar} className="navbar-light">
        <div style={styles.navContainer}>
          <div style={styles.logoContainer}>
            <img src="/logo_emka.png" alt="Logo PT. Emka Jaya Utama" style={{ height: '40px' }} />
          </div>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} style={styles.hamburgerBtn} className="hamburger-btn">
            <span style={styles.hamburgerLine}></span>
            <span style={styles.hamburgerLine}></span>
            <span style={styles.hamburgerLine}></span>
          </button>
          <div className={`nav-links ${menuOpen ? 'nav-open' : ''}`} style={styles.navLinks}>
            <a href="#home" style={styles.navLink} onClick={() => setMenuOpen(false)}>Home</a>
            <a href="#tentang" style={styles.navLink} onClick={() => setMenuOpen(false)}>Tentang Kami</a>
            <a href="#layanan" style={styles.navLink} onClick={() => setMenuOpen(false)}>Layanan</a>
            <a href="#kontak" style={styles.navLink} onClick={() => setMenuOpen(false)}>Kontak</a>
            <button 
              onClick={() => { setMenuOpen(false); navigate('/login'); }}
              className="login-btn-mobile"
              style={styles.loginBtn}
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header id="home" style={styles.hero}>
        <div style={styles.heroBackground}>
          <div className="float-ship">
            <Ship size={220} color="#1976D2" />
          </div>
          <div className="float-truck">
            <Truck size={200} color="#D32F2F" />
          </div>
        </div>
        <div style={styles.heroContent} className="animate-fade-in hero-content">
          <div style={styles.badgeWrapper}>
            <span style={styles.badgePrimary}>
              Mitra Tepercaya Anda
            </span>
          </div>
          <h1 style={styles.heroTitle} className="hero-title">
            Solusi Inovatif untuk <br/>
            <span style={{ color: '#D32F2F' }}>Logistik</span> & <span style={{ color: '#1976D2' }}>Maritim</span>
          </h1>
          <p style={styles.heroSubtitle} className="hero-subtitle">
            PT. Emka Jaya Utama menyediakan layanan prima di bidang Penanganan Kargo, Jasa Pengurusan Transportasi, secara profesional dengan integritas penuh.
          </p>

          {/* CTA Buttons */}
          <div style={styles.ctaGroup} className="cta-buttons">
            <button
              onClick={() => document.getElementById('tracking')?.scrollIntoView({ behavior: 'smooth' })}
              style={styles.ctaPrimary}
            >
              Lacak Manifest
            </button>
            <a href="#layanan" style={styles.ctaSecondary}>Pelajari Layanan</a>
          </div>
          {/* Quick Tracking Card */}
          <div id="tracking" style={styles.trackingCard}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
              <Search size={20} color="#1976D2" />
              Lacak Manifest Anda
            </h3>
            <form onSubmit={handleTrack} style={styles.trackingForm} className="trackingForm">
              <input 
                type="text" 
                placeholder="Masukkan Nomor BL / Manifest (Contoh: BL-2026/06/0002)"
                style={styles.trackingInput}
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="trackingInput"
              />
              <button type="submit" disabled={isSearching} style={styles.trackBtn}>
                {isSearching ? 'Mencari...' : 'Lacak Status'}
              </button>
            </form>

            {/* Tracking Result */}
            {searchError && (
              <div style={styles.errorAlert}>
                <p style={{ margin: 0, color: '#D32F2F' }}>{searchError}</p>
              </div>
            )}
            
            {trackingStatus && (
              <div className="animate-fade-in" style={styles.trackingResult}>
                <div style={styles.resultHeader}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>No. Manifest</span>
                    <h4 style={{ margin: 0, color: '#1e293b' }}>{trackingStatus.manifest_number}</h4>
                  </div>
                  <span style={trackingStatus.status_do === 'DO DIRILIS' ? styles.statusSuccess : styles.statusWarning}>
                    {trackingStatus.status_do}
                  </span>
                </div>
                <div style={styles.resultBody}>
                  <div style={styles.resultItem}>
                    <PackageCheck size={16} color="#64748b" />
                    <span style={{ color: '#64748b' }}>Komoditas:</span>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{trackingStatus.komoditas}</span>
                  </div>
                  <div style={styles.resultItem}>
                    <Building2 size={16} color="#64748b" />
                    <span style={{ color: '#64748b' }}>Consignee:</span>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{trackingStatus.consignee}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Visi Misi Section */}
      <section id="tentang" style={styles.visiMisiSection}>
        <div style={styles.visiMisiContainer}>
          <div style={styles.visiCard}>
            <div style={styles.visiIcon}>
              <Compass size={32} color="#D32F2F" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#D32F2F' }}>Visi Kami</h3>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.6, fontWeight: 500, color: '#334155' }}>
              Menjadi Perusahaan Yang Berkembang dan Bermanfaat untuk Memenuhi Kebutuhan Masyarakat, Bangsa, dan Negara.
            </p>
          </div>
          
          <div style={styles.misiCard}>
            <div style={styles.misiIcon}>
              <Target size={32} color="#1976D2" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1976D2' }}>Misi Kami</h3>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.6, fontWeight: 500, color: '#334155' }}>
              Membangun Bisnis dan Aset Produktif secara terintegrasi guna memberikan Manfaat & Pelayanan yang Luas Kepada Masyarakat, Bangsa dan Negara.
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="layanan" style={styles.servicesSection}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#1e293b' }}>Lingkup Kegiatan</h2>
          <p style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.1rem', color: '#64748b' }}>
            Kami menyediakan solusi yang inovatif, mengutamakan mutu serta kepercayaan demi kelangsungan yang harmonis dan berkelanjutan.
          </p>
        </div>

        <div style={styles.servicesGrid} className="services-grid">
          {/* Service Card 1 */}
          <div style={{...styles.serviceCard, borderTop: '4px solid #D32F2F'}} className="service-card">
            <div style={{...styles.iconWrapper, backgroundColor: 'rgba(211, 47, 47, 0.1)'}}>
              <PackageCheck size={32} color="#D32F2F" />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#1e293b' }}>Penanganan Kargo (PBM)</h3>
            <p style={{ marginBottom: '1.5rem', minHeight: '80px', color: '#475569' }}>
              Kegiatan bongkar muat barang dari dan ke kapal di pelabuhan meliputi kegiatan stevedoring, cargodoring, dan receiving/delivery.
            </p>
            <ul style={styles.featureList}>
              <li style={styles.featureItem}><CheckCircle2 size={16} color="#D32F2F" /> Stevedoring (Dari Kapal ke Dermaga)</li>
              <li style={styles.featureItem}><CheckCircle2 size={16} color="#D32F2F" /> Cargodoring (Dermaga ke Gudang)</li>
              <li style={styles.featureItem}><CheckCircle2 size={16} color="#D32F2F" /> Receiving / Delivery</li>
            </ul>
          </div>

          {/* Service Card 2 */}
          <div style={{...styles.serviceCard, borderTop: '4px solid #1976D2'}} className="service-card">
            <div style={{...styles.iconWrapper, backgroundColor: 'rgba(25, 118, 210, 0.1)'}}>
              <Truck size={32} color="#1976D2" />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#1e293b' }}>Jasa Pengurusan Transportasi (JPT)</h3>
            <p style={{ marginBottom: '1.5rem', minHeight: '80px', color: '#475569' }}>
              Mewakili kepentingan pemilik barang dengan mengurus semua kegiatan pengiriman serta penerimaan barang.
            </p>
            <ul style={styles.featureList}>
              <li style={styles.featureItem}><CheckCircle2 size={16} color="#1976D2" /> Pengurusan Dokumen Terpadu</li>
              <li style={styles.featureItem}><CheckCircle2 size={16} color="#1976D2" /> Pengiriman Darat, Laut, Udara</li>
              <li style={styles.featureItem}><CheckCircle2 size={16} color="#1976D2" /> Door to Door Service</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer / Kontak */}
      <footer id="kontak" style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerBrand}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <img src="/logo_emka.png" alt="Logo PT. Emka Jaya Utama" style={{ height: '50px' }} />
            </div>
            <p style={{ maxWidth: '350px', marginTop: '1rem', lineHeight: 1.6, color: '#f8fafc' }}>
              Menjadi pilihan utama bagi mitra kami dengan memberikan kontribusi lebih melalui pelayanan istimewa secara profesional dan integritas penuh.
            </p>
          </div>
          <div style={styles.footerLinks}>
            <h4 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: '#ffffff' }}>Hubungi Kami</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Building2 size={20} color="#fca5a5" style={{ marginTop: '3px' }} />
                <span style={{ color: '#f1f5f9' }}>Kantor Pusat PT. Emka Jaya Utama</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileText size={20} color="#93c5fd" />
                <span style={{ color: '#f1f5f9' }}>Email: <strong>pt.emkajayautama@gmail.com</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Phone size={20} color="#86efac" />
                <span style={{ color: '#f1f5f9' }}>Telepon: <strong>0812 3982 0000</strong></span>
              </div>
            </div>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p style={{ color: '#94a3b8' }}>&copy; {new Date().getFullYear()} PT EMKA JAYA UTAMA. All rights reserved. | NIB: 9120319120253</p>
        </div>
      </footer>
    </div>
  );
};

// Light Theme Styles
const styles = {
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: '1rem 2rem',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
  },
  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '2.5rem',
  },
  navLink: {
    fontWeight: 600,
    color: '#334155',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    fontSize: '0.95rem'
  },
  loginBtn: {
    backgroundColor: '#D32F2F', 
    color: 'white', 
    border: 'none', 
    padding: '10px 24px', 
    borderRadius: '8px', 
    fontWeight: 'bold', 
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(211, 47, 47, 0.3)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  hero: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8rem 2rem 4rem',
    backgroundColor: '#0f172a'
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.82)), url("/FB_IMG_1781485302003.jpg.jpeg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundBlendMode: 'overlay',
    zIndex: 0,
  },
  heroContent: {
    maxWidth: '850px',
    width: '100%',
    textAlign: 'center',
    zIndex: 1,
    padding: '2.5rem 2rem',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderRadius: '28px',
    boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
  },
  badgeWrapper: {
    marginBottom: '1.5rem',
  },
  badgePrimary: {
    display: 'inline-block',
    padding: '6px 16px',
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    color: '#D32F2F',
    border: '1px solid rgba(211, 47, 47, 0.2)',
    borderRadius: '99px',
    fontWeight: 'bold',
    fontSize: '0.85rem'
  },
  heroTitle: {
    fontSize: '3.8rem',
    lineHeight: 1.2,
    marginBottom: '1.5rem',
    fontWeight: 800,
    color: '#f8fafc',
    textShadow: '0 24px 40px rgba(15, 23, 42, 0.5)'
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: '#e2e8f0',
    marginBottom: '3rem',
    maxWidth: '700px',
    margin: '0 auto 3rem',
    lineHeight: 1.75
  },
  trackingCard: {
    padding: '2rem',
    textAlign: 'left',
    marginTop: '2rem',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
    border: '1px solid rgba(0,0,0,0.05)'
  },

  ctaGroup: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginBottom: '2rem'
  },
  ctaPrimary: {
    backgroundColor: '#D32F2F',
    color: '#fff',
    padding: '12px 22px',
    borderRadius: '12px',
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(211,47,47,0.18)',
    transition: 'transform 0.15s ease'
  },
  ctaSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 18px',
    borderRadius: '12px',
    background: 'transparent',
    color: '#1976D2',
    fontWeight: 700,
    textDecoration: 'none',
    border: '2px solid rgba(25,118,210,0.08)'
  },
  trackingForm: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  },
  trackingInput: {
    flex: 1,
    padding: '14px 18px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#1e293b',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  trackBtn: {
    minWidth: '150px',
    borderRadius: '10px',
    fontWeight: 'bold',
    cursor: 'pointer',
    backgroundColor: '#1976D2',
    color: 'white',
    border: 'none',
    boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)'
  },
  errorAlert: {
    padding: '1rem',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    marginTop: '1rem',
  },
  trackingResult: {
    marginTop: '1.5rem',
    padding: '1.5rem',
    backgroundColor: '#f1f5f9',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #cbd5e1',
  },
  statusSuccess: {
    padding: '4px 12px',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#059669',
    borderRadius: '99px',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  statusWarning: {
    padding: '4px 12px',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    color: '#d97706',
    borderRadius: '99px',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  resultBody: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  visiMisiSection: {
    padding: '5rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#ffffff'
  },
  visiMisiContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
  },
  visiCard: {
    padding: '3rem',
    textAlign: 'center',
    borderRadius: '20px',
    backgroundColor: '#ffffff',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    border: '1px solid rgba(211, 47, 47, 0.1)',
  },
  misiCard: {
    padding: '3rem',
    textAlign: 'center',
    borderRadius: '20px',
    backgroundColor: '#ffffff',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    border: '1px solid rgba(25, 118, 210, 0.1)',
  },
  visiIcon: {
    width: '80px',
    height: '80px',
    margin: '0 auto 1.5rem',
    backgroundColor: 'rgba(211, 47, 47, 0.08)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  misiIcon: {
    width: '80px',
    height: '80px',
    margin: '0 auto 1.5rem',
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  servicesSection: {
    padding: '5rem 2rem 8rem',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#ffffff'
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '2.5rem',
    justifyContent: 'center'
  },
  serviceCard: {
    padding: '2.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    border: '1px solid #f1f5f9'
  },
  iconWrapper: {
    width: '70px',
    height: '70px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
    color: '#475569',
    fontSize: '0.95rem',
    fontWeight: 500
  },
  footer: {
    backgroundColor: '#0f172a', /* Dark slate for contrast at the bottom */
    padding: '5rem 2rem 2rem',
    borderTop: '5px solid #D32F2F'
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '3rem',
    marginBottom: '3rem',
  },
  footerBrand: {
    flex: '1 1 400px',
  },
  footerLinks: {
    flex: '1 1 300px',
  },
  footerBottom: {
    maxWidth: '1200px',
    margin: '0 auto',
    paddingTop: '2rem',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    textAlign: 'center',
  }
};

export default LandingPage;
