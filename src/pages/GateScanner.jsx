import React, { useState } from 'react';
import { ScanLine, LogIn, LogOut, CheckCircle, Search, Scale, AlertCircle } from 'lucide-react';
import { supabase } from '../config/supabaseClient';

export default function GateScanner() {
  const [activeTab, setActiveTab] = useState('gate-in');
  const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, success, not_found
  const [isLoading, setIsLoading] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active Record (from DB)
  const [activeRecord, setActiveRecord] = useState(null);

  // Form State for Manual Entry / Scan Result
  const [formData, setFormData] = useState({
    document_number: '',
    truck_plate: '',
    driver_name: '',
    commodity: '',
    bruto_weight: '',
    tarra_weight: ''
  });

  const handleSearch = async () => {
    if (!searchQuery) return;
    setScanStatus('scanning');
    setIsLoading(true);

    try {
      // Cari kendaraan yang sedang ada di dalam pelabuhan
      const { data, error } = await supabase
        .from('gate_logs')
        .select('*')
        .or(`truck_plate.ilike.%${searchQuery}%,document_number.ilike.%${searchQuery}%`)
        .eq('status', 'DI DALAM PELABUHAN')
        .single();

      if (data) {
        setScanStatus('success');
        setActiveRecord(data);
        setFormData({
          ...formData,
          document_number: data.document_number,
          truck_plate: data.truck_plate,
          driver_name: data.driver_name,
          commodity: data.commodity
        });
      } else {
        setScanStatus('not_found');
        setActiveRecord(null);
      }
    } catch (error) {
      console.error(error);
      setScanStatus('not_found');
      setActiveRecord(null);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateScan = () => {
    setScanStatus('scanning');
    
    setTimeout(() => {
      setScanStatus('success');
      // Simulate getting data from QR Code
      if (activeTab === 'gate-in') {
        const docNum = `SJ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        setFormData({
          document_number: docNum,
          truck_plate: 'B 1234 KJL',
          driver_name: 'Sopir Budi',
          commodity: 'Pasir Besi (Curah)',
          bruto_weight: '',
          tarra_weight: ''
        });
      } else {
        // For Gate Out, just trigger a search for the dummy data we inserted in SQL
        setSearchQuery('B 9012 KJL');
        setTimeout(handleSearch, 500);
      }
    }, 1500);
  };

  const handleGateIn = async () => {
    if (!formData.document_number || !formData.truck_plate) {
      alert('Nomor Dokumen dan Plat Truk wajib diisi!');
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.from('gate_logs').insert([{
        document_number: formData.document_number,
        truck_plate: formData.truck_plate,
        driver_name: formData.driver_name,
        commodity: formData.commodity,
        gate_in_time: new Date().toISOString(),
        status: 'DI DALAM PELABUHAN'
      }]);

      if (error) throw error;
      alert('Truk berhasil tercatat MASUK (Gate-In)!');
      resetState();
    } catch (error) {
      alert('Gagal mencatat Gate In: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGateOut = async () => {
    if (!activeRecord) return;
    if (!formData.bruto_weight || !formData.tarra_weight) {
      alert('Berat Bruto dan Tarra wajib diisi dari Jembatan Timbang!');
      return;
    }

    const netto = parseFloat(formData.bruto_weight) - parseFloat(formData.tarra_weight);

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('gate_logs')
        .update({
          bruto_weight: parseFloat(formData.bruto_weight),
          tarra_weight: parseFloat(formData.tarra_weight),
          netto_weight: netto,
          gate_out_time: new Date().toISOString(),
          status: 'SELESAI'
        })
        .eq('id', activeRecord.id);

      if (error) throw error;
      alert(`Truk berhasil tercatat KELUAR (Gate-Out)! Netto Muatan: ${netto} Kg`);
      resetState();
    } catch (error) {
      alert('Gagal mencatat Gate Out: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setScanStatus('idle');
    setActiveRecord(null);
    setSearchQuery('');
    setFormData({
      document_number: '',
      truck_plate: '',
      driver_name: '',
      commodity: '',
      bruto_weight: '',
      tarra_weight: ''
    });
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '4px' }}>Gate & QR Scanner</h1>
          <p className="text-muted">Pemindaian Surat Jalan Digital (Gate In / Gate Out)</p>
        </div>
      </div>

      <div style={styles.tabs} className="glass-panel">
        <button 
          style={{...styles.tab, ...(activeTab === 'gate-in' ? styles.activeTab : {})}}
          onClick={() => { setActiveTab('gate-in'); resetState(); }}
        >
          <LogIn size={18} /> Scanner Masuk (Gate-In)
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'gate-out' ? styles.activeTab : {})}}
          onClick={() => { setActiveTab('gate-out'); resetState(); }}
        >
          <LogOut size={18} /> Scanner Keluar (Gate-Out)
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.grid}>
          <div className="card glass-panel" style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <h3 style={styles.cardTitle}>Pindai QR Code Surat Jalan</h3>
            
            <div style={styles.scannerBox} onClick={simulateScan}>
              {scanStatus === 'idle' && (
                <>
                  <ScanLine size={64} color="var(--color-primary)" style={{ opacity: 0.5, marginBottom: '16px' }} />
                  <p className="text-muted">Klik area ini untuk simulasi scan</p>
                </>
              )}
              {scanStatus === 'scanning' && (
                <>
                  <div style={styles.scanLineAnim}></div>
                  <ScanLine size={64} color="var(--color-primary)" />
                  <p className="text-muted" style={{ marginTop: '16px' }}>Memindai QR...</p>
                </>
              )}
              {scanStatus === 'success' && (
                <>
                  <CheckCircle size={64} color="var(--color-success)" />
                  <p style={{ marginTop: '16px', color: 'var(--color-success)', fontWeight: 'bold' }}>Scan Berhasil!</p>
                </>
              )}
              {scanStatus === 'not_found' && (
                <>
                  <AlertCircle size={64} color="var(--color-danger)" />
                  <p style={{ marginTop: '16px', color: 'var(--color-danger)', fontWeight: 'bold' }}>Data Tidak Ditemukan!</p>
                </>
              )}
            </div>
            
            {activeTab === 'gate-out' && (
              <div style={{ marginTop: '24px', width: '100%', position: 'relative', display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '16px', top: '12px' }} />
                  <input 
                    type="text" 
                    style={{...styles.input, width: '100%', paddingLeft: '44px'}} 
                    placeholder="Cari Plat / No Dokumen..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button className="btn btn-secondary" onClick={handleSearch} disabled={isLoading}>Cari</button>
              </div>
            )}
          </div>

          <div className="card glass-panel" style={{ gridColumn: 'span 7' }}>
            <h3 style={styles.cardTitle}>Detail Kendaraan & Muatan</h3>
            {scanStatus === 'success' || (activeTab === 'gate-in' && scanStatus === 'idle') ? (
              <div className="animate-fade-in" style={styles.detailCard}>
                <div style={styles.detailHeader}>
                  <div>
                    {activeTab === 'gate-in' && scanStatus === 'idle' ? (
                      <h2 style={{ margin: 0, color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '1.2rem' }}>Input Manual / Tunggu Scan...</h2>
                    ) : (
                      <>
                        <h2 style={{ margin: 0, color: 'var(--color-primary)' }}>{formData.truck_plate || '-'}</h2>
                        <span className="text-muted">{formData.driver_name || '-'}</span>
                      </>
                    )}
                  </div>
                  <span className={`badge ${activeTab === 'gate-in' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '1rem', padding: '8px 16px' }}>
                    {activeTab === 'gate-in' ? 'GATE IN' : 'GATE OUT'}
                  </span>
                </div>
                
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Nomor Dokumen / SJ</label>
                    {activeTab === 'gate-in' ? (
                      <input type="text" style={styles.input} value={formData.document_number} onChange={e => setFormData({...formData, document_number: e.target.value})} placeholder="Input No SJ..." />
                    ) : (
                      <div style={styles.readOnlyText}>{formData.document_number}</div>
                    )}
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Plat Truk</label>
                    {activeTab === 'gate-in' ? (
                      <input type="text" style={styles.input} value={formData.truck_plate} onChange={e => setFormData({...formData, truck_plate: e.target.value})} placeholder="Input Plat Truk..." />
                    ) : (
                      <div style={styles.readOnlyText}>{formData.truck_plate}</div>
                    )}
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Nama Sopir</label>
                    {activeTab === 'gate-in' ? (
                      <input type="text" style={styles.input} value={formData.driver_name} onChange={e => setFormData({...formData, driver_name: e.target.value})} placeholder="Input Nama Sopir..." />
                    ) : (
                      <div style={styles.readOnlyText}>{formData.driver_name}</div>
                    )}
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Komoditas</label>
                    {activeTab === 'gate-in' ? (
                      <input type="text" style={styles.input} value={formData.commodity} onChange={e => setFormData({...formData, commodity: e.target.value})} placeholder="Input Komoditas..." />
                    ) : (
                      <div style={styles.readOnlyText}>{formData.commodity}</div>
                    )}
                  </div>
                  
                  {activeTab === 'gate-out' && (
                    <div style={{ ...styles.formGroup, gridColumn: 'span 2', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '8px', border: '1px dashed var(--color-success)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-success)', fontWeight: 'bold' }}>
                        <Scale size={20} /> Data Jembatan Timbang (Timbangan Gate-Out)
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                        <div style={{flex: 1}}>
                          <label style={styles.label}>Berat Kotor (Bruto) Kg</label>
                          <input 
                            type="number" 
                            style={{...styles.input, width: '100%', fontWeight: 'bold', fontSize: '1.2rem'}} 
                            placeholder="Misal: 42500"
                            value={formData.bruto_weight}
                            onChange={(e) => setFormData({...formData, bruto_weight: e.target.value})}
                          />
                        </div>
                        <div style={{flex: 1}}>
                          <label style={styles.label}>Tarra (Truk Kosong) Kg</label>
                          <input 
                            type="number" 
                            style={{...styles.input, width: '100%', fontWeight: 'bold', fontSize: '1.2rem'}} 
                            placeholder="Misal: 12500"
                            value={formData.tarra_weight}
                            onChange={(e) => setFormData({...formData, tarra_weight: e.target.value})}
                          />
                        </div>
                        <div style={{flex: 1}}>
                          <label style={styles.label}>Berat Bersih (Netto) Kg</label>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)', marginTop: '8px' }}>
                            {formData.bruto_weight && formData.tarra_weight 
                              ? (parseFloat(formData.bruto_weight) - parseFloat(formData.tarra_weight)) 
                              : 0} Kg
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                  {activeTab === 'gate-in' ? (
                    <button className="btn btn-primary" onClick={handleGateIn} disabled={isLoading} style={{ padding: '12px 24px', fontSize: '1.1rem' }}>
                      <CheckCircle size={20} /> {isLoading ? 'Menyimpan...' : 'Konfirmasi Masuk (Gate-In)'}
                    </button>
                  ) : (
                    <button className="btn btn-success" onClick={handleGateOut} disabled={isLoading || !formData.bruto_weight} style={{ padding: '12px 24px', fontSize: '1.1rem', backgroundColor: 'var(--color-success)', color: 'white', border: 'none' }}>
                      <CheckCircle size={20} /> {isLoading ? 'Menyimpan...' : 'Konfirmasi Keluar (Gate-Out)'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', height: '300px', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <LogOut size={48} color="var(--color-text-muted)" style={{ opacity: 0.3, marginBottom: '16px' }} />
                <p className="text-muted">Gunakan form pencarian atau Scan QR untuk memanggil data truk yang sedang di dalam pelabuhan.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { paddingBottom: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  tabs: {
    display: 'flex',
    padding: '8px',
    borderRadius: '12px',
    marginBottom: '24px',
    gap: '8px',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    borderRadius: '8px',
    color: 'var(--color-text-secondary)',
    fontWeight: 600,
    transition: 'all var(--transition-fast)',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer'
  },
  activeTab: {
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    boxShadow: 'var(--shadow-glow)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '24px',
  },
  cardTitle: {
    fontSize: '1.1rem',
    marginBottom: '20px',
  },
  scannerBox: {
    width: '250px',
    height: '250px',
    border: '2px dashed var(--color-primary)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  scanLineAnim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    backgroundColor: 'var(--color-primary)',
    boxShadow: '0 0 10px var(--color-primary)',
    animation: 'scan 1.5s infinite',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text-primary)',
    outline: 'none',
  },
  detailCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--color-border)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.9rem',
    color: 'var(--color-text-secondary)',
  },
  readOnlyText: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
  }
};
