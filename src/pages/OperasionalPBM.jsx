import React, { useState, useEffect } from 'react';
import { Calendar, Users, ClipboardCheck, Anchor, HardHat, FileText, Printer, X } from 'lucide-react';
import { supabase } from '../config/supabaseClient';

export default function OperasionalPBM() {
  const [activeTab, setActiveTab] = useState('perencanaan');
  const [isLoading, setIsLoading] = useState(false);

  // Master Data
  const [ships, setShips] = useState([]);
  const [foremen, setForemen] = useState([]);
  const [clients, setClients] = useState([]);
  
  // Real Data
  const [tallyLogs, setTallyLogs] = useState([]);
  const [plans, setPlans] = useState([]);
  
  // Modal state
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Forms
  const [planForm, setPlanForm] = useState({
    ship_name: '',
    consignee: '',
    komoditas: '',
    total_tonnage: '',
    crane_allocation: 'Crane Darat 1 (Kapasitas 40T)',
    foreman_name: ''
  });

  const [tallyForm, setTallyForm] = useState({
    truck_plate: '',
    tonnage: 30,
    foreman_name: ''
  });

  useEffect(() => {
    fetchPlans();
    fetchTallyLogs();
    fetchShips();
    fetchForemen();
    fetchClients();
  }, []);

  const fetchShips = async () => {
    try {
      const { data } = await supabase.from('ships').select('*');
      if (data) {
        setShips(data);
        if (data.length > 0) setPlanForm(prev => ({ ...prev, ship_name: data[0].name }));
      }
    } catch (error) {
      console.error('Error fetching ships:', error.message);
    }
  };

  const fetchForemen = async () => {
    try {
      const { data } = await supabase.from('staff_users').select('*');
      if (data) {
        const fieldStaff = data.filter(u => u.role.includes('Tally') || u.role.includes('Mandor') || u.role.includes('Admin'));
        setForemen(fieldStaff);
        if (fieldStaff.length > 0) {
          setPlanForm(prev => ({ ...prev, foreman_name: fieldStaff[0].name }));
          setTallyForm(prev => ({ ...prev, foreman_name: fieldStaff[0].name }));
        }
      }
    } catch (error) {
      console.error('Error fetching foremen:', error.message);
    }
  };

  const fetchClients = async () => {
    try {
      const { data } = await supabase.from('clients').select('*');
      if (data) setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error.message);
    }
  };

  const fetchTallyLogs = async () => {
    try {
      const { data, error } = await supabase.from('pbm_tally_logs').select('*').order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      if (data) setTallyLogs(data);
    } catch (error) {
      console.error('Error fetching tally logs:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase.from('pbm_plans').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleSimpanRBM = async () => {
    if (!planForm.ship_name || !planForm.total_tonnage) {
      alert('Harap isi Nama Kapal dan Total Tonase!');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.from('pbm_plans').insert([{
        ship_name: planForm.ship_name,
        consignee: planForm.consignee,
        komoditas: planForm.komoditas,
        total_tonnage: parseFloat(planForm.total_tonnage),
        crane_allocation: planForm.crane_allocation,
        foreman_name: planForm.foreman_name
      }]);
      if (error) throw error;
      alert("Rencana Bongkar Muat berhasil disimpan!");
      setPlanForm({ ship_name: '', consignee: '', komoditas: '', total_tonnage: '', crane_allocation: 'Crane Darat 1 (Kapasitas 40T)', foreman_name: '' });
      fetchPlans();
    } catch (error) {
      alert('Gagal menyimpan RBM: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKonfirmasiMuat = async () => {
    if (!tallyForm.truck_plate) {
      alert('Plat Nomor Truk harus diisi!');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.from('pbm_tally_logs').insert([tallyForm]);
      if (error) throw error;
      alert('Data Tally berhasil dikonfirmasi!');
      setTallyForm(prev => ({ ...prev, truck_plate: '' }));
      fetchTallyLogs();
    } catch (error) {
      alert('Gagal menyimpan Tally: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const printIzinBongkar = (plan) => {
    const tgl = new Date(plan.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
    const tglSurat = new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
    const ship = ships.find(s => s.name === plan.ship_name) || { code: '1000', country: 'INDONESIA', captain: 'Nakhoda' };

    const pw = window.open('', '_blank');
    pw.document.write(`
      <html>
        <head>
          <title>Surat Izin Bongkar - ${plan.ship_name}</title>
          <style>
            @media print { @page { size: A4; margin: 20mm; } }
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000; }
          </style>
        </head>
        <body>
          <div style="width: 100%; text-align: center; margin-bottom: 20px;">
            <img src="${window.location.origin}/kop_surat.png" style="width: 100%; max-width: 800px; height: auto;" />
          </div>
          <table style="width: 100%; margin-bottom: 20px;">
            <tr><td width="70">Nomor</td><td width="10">:</td><td>...... /PT.EMKA/NGK/...../2026</td><td rowspan="3" width="300">Kepada<br/>Yth. Kepala Kantor Unit Penyelenggara Pelabuhan Kelas III Pelabuhan Marapokot<br/><br/>Di-<br/>Marapokot</td></tr>
            <tr><td>Lampiran</td><td>:</td><td>-</td></tr>
            <tr><td>Perihal</td><td>:</td><td><strong>Permohonan Ijin Bongkar</strong></td></tr>
          </table>
          <p>Dengan hormat, dengan ini kami datang kehadapan bapak dan mengajukan permohonan kiranya bapak tidak keberatan memberikan ijin bongkar untuk kapal kami tersebut dibawah ini :</p>
          <table style="width: 80%; margin: 10px 0 10px 30px;">
            <tr><td width="150">Nama kapal</td><td width="10">:</td><td>${plan.ship_name}</td></tr>
            <tr><td>Bongkaran</td><td>:</td><td>${plan.total_tonnage} Ton/M3</td></tr>
          </table>
        </body>
      </html>
    `);
    pw.document.close();
    pw.focus();
    setTimeout(() => pw.print(), 300);
  };

  const printTimeSheet = (plan) => {
    const ship = ships.find(s => s.name === plan.ship_name) || { code: '1000' };
    const tglSurat = new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});

    const pw = window.open('', '_blank');
    pw.document.write(`
      <html>
        <head><title>Time Sheet - ${plan.ship_name}</title></head>
        <body>
          <h2>T I M E &nbsp; S H E E T</h2>
          <table class="meta-table">
            <tr><td width="200">Nama Kapal</td><td width="10">:</td><td>${plan.ship_name}</td></tr>
            <tr><td>Jumlah dan Jenis Muatan</td><td>:</td><td>${plan.total_tonnage} Ton (Curah)</td></tr>
          </table>
        </body>
      </html>
    `);
    pw.document.close();
    pw.focus();
    setTimeout(() => pw.print(), 300);
  };

  const printBABongkarMuat = (plan) => {
    const totalMuat = tallyLogs.filter(t => t.foreman_name === plan.foreman_name).reduce((sum, item) => sum + item.tonnage, 0);
    const ship = ships.find(s => s.name === plan.ship_name) || {};
    const client = clients.find(c => c.name === plan.consignee) || {};
    const tglSurat = new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'});

    let contactName = '......................................';
    let contactJabatan = '......................................';
    if (client.contact_person) {
      const parts = client.contact_person.split('-');
      if (parts.length > 1) {
        contactName = parts[0].trim();
        contactJabatan = parts[1].trim();
      } else {
        contactName = client.contact_person.trim();
      }
    }

    const pw = window.open('', '_blank');
    pw.document.write(`
      <html>
        <head>
          <title>BA Bongkar Muat - ${plan.ship_name}</title>
          <style>
            @media print { @page { size: A4; margin: 20mm; } }
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000; text-align: justify; }
            h3 { text-align: center; text-decoration: underline; margin-bottom: 5px; }
            .nomor { text-align: center; margin-top: 0; margin-bottom: 30px; }
            .table-layout { width: 100%; margin-bottom: 15px; }
            .table-layout td { vertical-align: top; padding: 2px 0; }
            .signature-table { width: 100%; margin-top: 40px; text-align: center; }
            .signature-table .name { margin-top: 80px; font-weight: bold; text-decoration: underline; }
          </style>
        </head>
        <body>
          <h3>BERITA ACARA SERAH TERIMA BARANG</h3>
          <p class="nomor">NOMOR : ...... /PT.EMKA/NGK/...../2026</p>
          <p>Pada hari ini <strong>${tglSurat}</strong>, kami yang bertanda tangan dibawah ini masing-masing :</p>
          <table class="table-layout">
            <tr><td width="30">I.</td><td width="150">Nama Perusahaan</td><td width="10">:</td><td><strong>${plan.consignee || 'PEMILIK BARANG / KAPAL'}</strong></td></tr>
            <tr><td></td><td>Alamat</td><td>:</td><td>${client.alamat || '......................................'}</td></tr>
            <tr><td></td><td>Diwakili oleh</td><td>:</td><td>${contactName}</td></tr>
            <tr><td></td><td>Jabatan</td><td>:</td><td>${contactJabatan}</td></tr>
            <tr><td></td><td colspan="3">Dalam hal ini bertindak atas nama Pemilik Barang yang selanjutnya disebut <strong>PIHAK PERTAMA</strong>.</td></tr>
          </table>
          <table class="table-layout">
            <tr><td width="30">II.</td><td width="150">Nama Perusahaan</td><td width="10">:</td><td><strong>PT. EMKA JAYA UTAMA</strong></td></tr>
            <tr><td></td><td>Alamat</td><td>:</td><td>Depan Polsek Mauponggo, Kel. Mauponggo, Kec. Mauponggo, Kab. Nagekeo</td></tr>
            <tr><td></td><td>Diwakili oleh</td><td>:</td><td><strong>Hilarius Mbusa</strong></td></tr>
            <tr><td></td><td>Jabatan</td><td>:</td><td><strong>Direktur</strong></td></tr>
            <tr><td></td><td colspan="3">Dalam hal ini bertindak atas nama PT. EMKA JAYA UTAMA yang selanjutnya disebut <strong>PIHAK KEDUA</strong>.</td></tr>
          </table>
          <p>Dengan ini menyatakan bahwa PIHAK PERTAMA telah menyerahkan barang kepada PIHAK KEDUA dengan rincian :</p>
          <table class="table-layout" style="margin-left: 30px; width: 90%;">
            <tr><td width="20">1.</td><td width="180">Nama kapal</td><td width="10">:</td><td>${plan.ship_name || '...........................'}</td></tr>
            <tr><td>2.</td><td>Hasil Bongkaran (Utuh)</td><td>:</td><td><strong>${totalMuat} Ton</strong></td></tr>
          </table>
          <table class="signature-table">
            <tr>
              <td width="50%"><strong>Yang Menerima,</strong><br/>Perusahaan Bongkar Muat<br/>PT. EMKA JAYA UTAMA<br/><br/><br/><br/><br/><span class="name">HILARIUS MBUSA</span><br/>Direktur</td>
              <td width="50%"><strong>Yang Menyerahkan,</strong><br/>Pihak Kapal / Pemilik Barang<br/><br/><br/><br/><br/><br/><span class="name">.........................................</span><br/>Nakhoda / Agen</td>
            </tr>
          </table>
        </body>
      </html>
    `);
    pw.document.close();
    pw.focus();
    setTimeout(() => pw.print(), 300);
  };

  const printSuratJalan = () => {
    const pw = window.open('', '_blank');
    pw.document.write(`
      <html>
        <head>
          <title>Surat Jalan</title>
          <style>
            @media print { @page { size: A5 landscape; margin: 10mm; } }
            body { font-family: 'Arial', sans-serif; font-size: 10pt; color: #000; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
            .title { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
            .company { font-weight: bold; font-size: 14px; }
            .address { font-size: 9pt; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 10px; }
            table.data { width: 100%; border-collapse: collapse; text-align: center; }
            table.data th, table.data td { border: 1px solid #000; padding: 5px; }
            .signature { width: 100%; margin-top: 15px; text-align: center; display: flex; justify-content: space-between; }
            .sig-box { width: 25%; }
            .name { margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company">PT. EMKA JAYA UTAMA</div>
              <div class="address">Depan Polsek Mauponggo, Kab. Nagekeo</div>
            </div>
            <div class="title">S U R A T &nbsp; J A L A N</div>
          </div>
          
          <div class="meta">
            <table style="width: 45%;">
              <tr><td width="60">Kepada</td><td>:</td><td>..............................</td></tr>
              <tr><td>Di</td><td>:</td><td>..............................</td></tr>
            </table>
            <table style="width: 50%;">
              <tr><td width="120">No. Surat Jalan</td><td>:</td><td>..............................</td></tr>
              <tr><td>Tanggal</td><td>:</td><td>..............................</td></tr>
              <tr><td>No. Polisi</td><td>:</td><td>..............................</td></tr>
              <tr><td>Pengemudi</td><td>:</td><td>..............................</td></tr>
            </table>
          </div>

          <table class="data">
            <tr><th width="30">No</th><th width="80">Kode Barang</th><th>Nama Barang</th><th width="100">Jumlah (Ton/Zak)</th><th>Keterangan</th></tr>
            <tr><td height="50">1</td><td></td><td></td><td></td><td></td></tr>
          </table>

          <div class="signature">
            <div class="sig-box">Tanda Terima<br/><div class="name">(.......................)</div></div>
            <div class="sig-box">Sopir<br/><div class="name">(.......................)</div></div>
            <div class="sig-box">Teli Kapal<br/><div class="name">(.......................)</div></div>
            <div class="sig-box">Teli Gudang<br/><div class="name">(.......................)</div></div>
          </div>
        </body>
      </html>
    `);
    pw.document.close();
    pw.focus();
    setTimeout(() => pw.print(), 300);
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '4px' }}>Operasional Jasa PBM</h1>
          <p className="text-muted">Stevedoring Block - Perencanaan, Tally Lapangan & Closing</p>
        </div>
      </div>

      <div style={styles.tabs} className="glass-panel">
        <button style={{...styles.tab, ...(activeTab === 'perencanaan' ? styles.activeTab : {})}} onClick={() => setActiveTab('perencanaan')}>
          <Calendar size={18} /> Perencanaan (RBM)
        </button>
        <button style={{...styles.tab, ...(activeTab === 'tally' ? styles.activeTab : {})}} onClick={() => setActiveTab('tally')}>
          <ClipboardCheck size={18} /> Tally Lapangan (Mobile)
        </button>
        <button style={{...styles.tab, ...(activeTab === 'closing' ? styles.activeTab : {})}} onClick={() => setActiveTab('closing')}>
          <Anchor size={18} /> Penutupan & Dokumen BA
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'perencanaan' && (
          <div style={styles.grid}>
            <div className="card glass-panel" style={{ gridColumn: 'span 12' }}>
              <h3 style={styles.cardTitle}>Rencana Bongkar Muat & Alokasi Geng TKBM</h3>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nama Kapal</label>
                  <select style={styles.input} value={planForm.ship_name} onChange={(e) => setPlanForm({...planForm, ship_name: e.target.value})}>
                    {ships.map(s => <option key={s.id} value={s.name}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Pemilik Barang (Consignee)</label>
                  <select style={styles.input} value={planForm.consignee} onChange={(e) => setPlanForm({...planForm, consignee: e.target.value})}>
                    <option value="">Pilih Consignee...</option>
                    {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Komoditas</label>
                  <input type="text" style={styles.input} placeholder="Misal: Pasir Besi" value={planForm.komoditas} onChange={(e) => setPlanForm({...planForm, komoditas: e.target.value})}/>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Total Tonase Rencana</label>
                  <input type="number" style={styles.input} placeholder="Contoh: 15000" value={planForm.total_tonnage} onChange={(e) => setPlanForm({...planForm, total_tonnage: e.target.value})}/>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Alokasi Crane / Alat Berat</label>
                  <select style={styles.input} value={planForm.crane_allocation} onChange={(e) => setPlanForm({...planForm, crane_allocation: e.target.value})}>
                    <option value="Crane Darat 1 (Kapasitas 40T)">Crane Darat 1 (Kapasitas 40T)</option>
                    <option value="Crane Kapal (Ship Gear)">Crane Kapal (Ship Gear)</option>
                    <option value="Pompa Pipa Curah Cair">Pompa Pipa Curah Cair</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Penugasan Mandor / Geng TKBM</label>
                  <select style={styles.input} value={planForm.foreman_name} onChange={(e) => setPlanForm({...planForm, foreman_name: e.target.value})}>
                    {foremen.map(f => <option key={f.id} value={f.name}>{f.name} ({f.role})</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handleSimpanRBM} disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : 'Simpan RBM'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tally' && (
          <div style={styles.grid}>
            <div className="card glass-panel" style={{ gridColumn: 'span 4' }}>
              <div style={styles.mobileFrame}>
                <div style={styles.mobileHeader}>
                  <HardHat size={20} /> TALLY CURAH KERING
                </div>
                <div style={styles.mobileBody}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{...styles.label, fontSize: '0.8rem'}}>Pilih Mandor/Tally:</label>
                    <select style={{...styles.input, width: '100%', padding: '8px'}} value={tallyForm.foreman_name} onChange={(e) => setTallyForm({...tallyForm, foreman_name: e.target.value})}>
                      {foremen.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                    </select>
                  </div>
                  <div style={styles.mobileCard}>
                    <strong style={{ display: 'block', marginBottom: '8px' }}>Plat Truk Tiba (Gate In)</strong>
                    <input type="text" placeholder="Misal: B 9012 KJL" style={{...styles.input, width: '100%', fontSize: '1.2rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-primary)'}} value={tallyForm.truck_plate} onChange={(e) => setTallyForm({...tallyForm, truck_plate: e.target.value.toUpperCase()})}/>
                  </div>
                  <div style={{ margin: '16px 0', textAlign: 'center' }}>
                    <p style={{ marginBottom: '8px' }}>Input Estimasi Muatan (Ton)</p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button style={styles.calcBtn} onClick={() => setTallyForm(p => ({...p, tonnage: Math.max(0, p.tonnage - 1)}))}>-</button>
                      <input type="number" style={{...styles.input, width: '80px', textAlign: 'center', fontSize: '1.2rem'}} value={tallyForm.tonnage} onChange={(e) => setTallyForm({...tallyForm, tonnage: parseFloat(e.target.value) || 0})}/>
                      <button style={styles.calcBtn} onClick={() => setTallyForm(p => ({...p, tonnage: p.tonnage + 1}))}>+</button>
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }} onClick={handleKonfirmasiMuat} disabled={isLoading}>
                    <ClipboardCheck size={20} /> {isLoading ? 'Menyimpan...' : 'KONFIRMASI MUAT'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="card glass-panel" style={{ gridColumn: 'span 8' }}>
              <h3 style={styles.cardTitle}>Live Monitoring Tally Lapangan</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Waktu</th>
                    <th style={styles.th}>Plat Truk</th>
                    <th style={styles.th}>Mandor / Tally</th>
                    <th style={styles.th}>Tonase</th>
                  </tr>
                </thead>
                <tbody>
                  {tallyLogs.map((log) => (
                      <tr key={log.id} style={styles.tr}>
                        <td style={styles.td}>{new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                        <td style={{...styles.td, fontWeight: 'bold'}}>{log.truck_plate}</td>
                        <td style={styles.td}>{log.foreman_name}</td>
                        <td style={styles.td}>{log.tonnage} Ton</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'closing' && (
          <div style={styles.grid}>
            <div className="card glass-panel" style={{ gridColumn: 'span 12' }}>
              <h3 style={styles.cardTitle}>Daftar Rencana Bongkar Muat (PBM) - Cetak Dokumen</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>RKBM / Tanggal</th>
                    <th style={styles.th}>Nama Kapal</th>
                    <th style={styles.th}>Consignee</th>
                    <th style={styles.th}>Tonase</th>
                    <th style={styles.th}>Aksi Cetak</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(p => (
                    <tr key={p.id} style={styles.tr}>
                      <td style={styles.td}><strong>RKBM-{p.id}</strong><br/>{new Date(p.created_at).toLocaleDateString()}</td>
                      <td style={styles.td}><strong>{p.ship_name}</strong></td>
                      <td style={styles.td}>{p.consignee || '-'}</td>
                      <td style={styles.td}>{p.total_tonnage} Ton</td>
                      <td style={styles.td}>
                        <button className="btn btn-outline" style={{ padding: '8px 12px' }} onClick={() => setSelectedPlan(p)}>
                          <Printer size={16} /> Kelola Dokumen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Cetak Dokumen */}
      {selectedPlan && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card glass-panel animate-fade-in" style={{ width: '500px', maxWidth: '90%', position: 'relative' }}>
            <button onClick={() => setSelectedPlan(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
              <X size={24} />
            </button>
            <h2 style={{ marginTop: 0, color: 'var(--color-primary)' }}>Cetak Dokumen PBM</h2>
            <p className="text-muted" style={{ marginBottom: '20px' }}>Kapal: <strong>{selectedPlan.ship_name}</strong> (RKBM-{selectedPlan.id})</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '15px' }} onClick={() => printIzinBongkar(selectedPlan)}>
                <FileText size={20} style={{ marginRight: '10px' }} /> 1. Surat Permohonan Izin Bongkar
              </button>
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '15px' }} onClick={() => printTimeSheet(selectedPlan)}>
                <Calendar size={20} style={{ marginRight: '10px' }} /> 2. Cetak Time Sheet Lapangan
              </button>
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '15px' }} onClick={() => printBABongkarMuat(selectedPlan)}>
                <ClipboardCheck size={20} style={{ marginRight: '10px' }} /> 3. Berita Acara Serah Terima Barang (Bongkar Muat)
              </button>
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '15px' }} onClick={() => printSuratJalan()}>
                <Printer size={20} style={{ marginRight: '10px' }} /> 4. Cetak Blanko Surat Jalan (Truk)
              </button>
            </div>
          </div>
        </div>
      )}
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
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '1.1rem',
    marginBottom: '20px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    transition: 'border-color var(--transition-fast)',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' },
  tr: { borderBottom: '1px solid var(--color-border)' },
  td: { padding: '16px 12px' },
  mobileFrame: {
    width: '100%',
    maxWidth: '360px',
    margin: '0 auto',
    height: '500px',
    border: '8px solid var(--color-surface-elevated)',
    borderRadius: '30px',
    backgroundColor: 'var(--color-bg)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-lg)'
  },
  mobileHeader: {
    backgroundColor: 'var(--color-primary)',
    padding: '20px 16px',
    color: 'white',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  mobileBody: {
    padding: '16px',
    flex: 1,
    overflowY: 'auto'
  },
  mobileCard: {
    backgroundColor: 'var(--color-surface)',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    textAlign: 'center'
  },
  calcBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-surface-elevated)',
    color: 'white',
    fontSize: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer'
  }
};
