import React, { useState, useEffect } from 'react';
import { FileText, ClipboardList, CheckCircle, Truck, QrCode, Printer, X, Download } from 'lucide-react';
import { supabase } from '../config/supabaseClient';

export default function OperasionalJPT() {
  const [activeTab, setActiveTab] = useState('dokumen');
  
  // State untuk form Input Manifest
  const [manifest, setManifest] = useState('');
  const [consignee, setConsignee] = useState('');
  const [komoditas, setKomoditas] = useState('');
  const [komoditasLain, setKomoditasLain] = useState('');
  const [totalMuatan, setTotalMuatan] = useState('');
  const [shipName, setShipName] = useState('');
  const [tibaTanggal, setTibaTanggal] = useState('');
  const [statusDO, setStatusDO] = useState('Menunggu Penebusan');
  
  // State untuk menyimpan riwayat (Dari Supabase)
  const [savedManifests, setSavedManifests] = useState([]);
  const [ships, setShips] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    fetchManifests();
    fetchShips();
    fetchClients();
  }, []);

  const fetchManifests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('manifests')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) setSavedManifests(data);
    } catch (error) {
      console.error('Error fetching manifests:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShips = async () => {
    try {
      const { data } = await supabase.from('ships').select('*');
      if (data) setShips(data);
    } catch (error) {
      console.error('Error fetching ships:', error.message);
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

  const handleBuatBaru = () => {
    if (window.confirm("Kosongkan form untuk membuat dokumen baru?")) {
      setManifest('');
      setConsignee('');
      setKomoditas('');
      setKomoditasLain('');
      setTotalMuatan('');
      setShipName('');
      setTibaTanggal('');
      setStatusDO('Menunggu Penebusan');
    }
  };

  const handleSimpanDokumen = async () => {
    if (!manifest) {
      alert("Nomor BL / Manifest tidak boleh kosong!");
      return;
    }
    
    const finalKomoditas = komoditas === 'Lainnya' ? komoditasLain : komoditas;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.from('manifests').insert([{ 
        manifest_number: manifest, 
        consignee: consignee, 
        komoditas: finalKomoditas, 
        status_do: statusDO, 
        total_muatan: parseFloat(totalMuatan) || 0,
        ship_name: shipName,
        tiba_tanggal: tibaTanggal
      }]);
      if (error) throw error;
      alert(`Dokumen dengan Nomor BL ${manifest} berhasil disimpan permanen!`);
      fetchManifests();
      setManifest(''); setConsignee(''); setKomoditas(''); setKomoditasLain(''); setTotalMuatan(''); setShipName(''); setTibaTanggal(''); setStatusDO('Menunggu Penebusan');
    } catch (error) {
      alert("Gagal menyimpan dokumen: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTanggalIndo = (dateString) => {
    if (!dateString) return '.................................';
    return new Date(dateString).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
  };

  const printIzinPemasukan = (doc) => {
    const tglSurat = new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
    const tglTiba = formatTanggalIndo(doc.tiba_tanggal);
    const pw = window.open('', '_blank');
    pw.document.write(`
      <html>
        <head>
          <title>Surat Izin Pemasukan Barang</title>
          <style>
            @media print { @page { size: A4; margin: 20mm; } }
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000; }
            .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
            .logo-img { width: 80px; height: 80px; object-fit:contain; }
            .company-name { font-size: 24px; font-weight: bold; color: #e11d48; margin: 0; }
            .company-name span { color: #1e3a8a; }
            .address { font-size: 10pt; text-align: center; flex: 1; margin: 0 15px; }
            .address p { margin: 2px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { vertical-align: top; }
            .signature { float: right; text-align: center; width: 250px; margin-top: 50px; }
            .signature .name { margin-top: 80px; font-weight: bold; text-decoration: underline; }
          </style>
        </head>
        <body>
          <div style="width: 100%; text-align: center; padding-bottom: 10px; margin-bottom: 20px;">
            <img src="${window.location.origin}/kop_surat.png" style="width: 100%; max-width: 800px; height: auto;" />
          </div>
          
          <table style="width: 100%; margin-bottom: 20px;">
            <tr><td width="70">Nomor</td><td width="10">:</td><td>...... /PT.EMKA/NGK/...../2026</td><td rowspan="3" width="300">Kepada<br/>Yth. Kepala Kantor Unit Penyelenggara Pelabuhan Kelas III Pelabuhan Marapokot<br/><br/>Di-<br/>Marapokot</td></tr>
            <tr><td>Lampiran</td><td>:</td><td>-</td></tr>
            <tr><td>Perihal</td><td>:</td><td><strong>Permohonan Ijin Pemasukan / Penumpukan Barang</strong></td></tr>
          </table>

          <div class="content">
            <p>Dengan hormat,</p>
            <p>Dengan ini kami PT. EMKA JAYA UTAMA bermaksud mengajukan permohonan untuk dapat melaksanakan proses pemasukan barang kami ke lapangan penumpukan sebagai berikut :</p>
            
            <table style="width: 80%; margin: 10px 0 10px 30px;">
              <tr><td width="150">Nama Barang</td><td width="10">:</td><td>${doc.komoditas}</td></tr>
              <tr><td>Volume</td><td>:</td><td>${doc.total_muatan || '..................'} Ton/M3</td></tr>
              <tr><td>Asal Barang</td><td>:</td><td>.................................</td></tr>
              <tr><td>Tempat penumpukan</td><td>:</td><td>Pelabuhan Marapokot</td></tr>
              <tr><td>Tanggal mulai</td><td>:</td><td>${tglSurat}</td></tr>
              <tr><td>Tanggal Selesai</td><td>:</td><td>.................................</td></tr>
            </table>

            <p>Kegiatan Pemasukan ${doc.komoditas} milik ${doc.consignee} direncanakan akan dilaksanakan kegiatannya pada tanggal ${tglSurat}.</p>
            <p>Demikian surat permohonan ini kami sampaikan dan atas pertimbangan bapak memberikan ijin pemasukan barang kami ucapkan banyak terima kasih.</p>
          </div>

          <div class="signature">
            <p>Marapokot, ${tglSurat}</p>
            <p>PERUSAHAAN JASA PENGURUSAN TRANSPORTASI<br/>PT. EMKA JAYA UTAMA</p>
            <p class="name">HILARIUS MBUSA</p>
            <p>DIREKTUR</p>
          </div>
        </body>
      </html>
    `);
    pw.document.close();
    pw.focus();
    setTimeout(() => pw.print(), 300);
  };

  const printIzinPengeluaran = (doc) => {
    const ship = ships.find(s => s.name === doc.ship_name) || {};
    const tglSurat = new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
    const tglTiba = formatTanggalIndo(doc.tiba_tanggal);
    
    const pw = window.open('', '_blank');
    pw.document.write(`
      <html>
        <head>
          <title>Surat Izin Mengeluarkan Barang</title>
          <style>
            @media print { @page { size: A4; margin: 20mm; } }
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000; }
            .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
            .logo-img { width: 80px; height: 80px; object-fit:contain; }
            .company-name { font-size: 24px; font-weight: bold; color: #e11d48; margin: 0; }
            .company-name span { color: #1e3a8a; }
            .address { font-size: 10pt; text-align: center; flex: 1; margin: 0 15px; }
            .address p { margin: 2px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { vertical-align: top; }
            .signature { float: right; text-align: center; width: 250px; margin-top: 50px; }
            .signature .name { margin-top: 80px; font-weight: bold; text-decoration: underline; }
          </style>
        </head>
        <body>
          <div style="width: 100%; text-align: center; padding-bottom: 10px; margin-bottom: 20px;">
            <img src="${window.location.origin}/kop_surat.png" style="width: 100%; max-width: 800px; height: auto;" />
          </div>
          
          <table style="width: 100%; margin-bottom: 20px;">
            <tr><td width="70">Nomor</td><td width="10">:</td><td>...... /PT.EMKA/NGK/...../2026</td><td rowspan="3" width="300">Kepada<br/>Yth. Kepala Kantor Unit Penyelenggara Pelabuhan Kelas III Pelabuhan Marapokot<br/><br/>Di-<br/>Marapokot</td></tr>
            <tr><td>Lampiran</td><td>:</td><td>-</td></tr>
            <tr><td>Perihal</td><td>:</td><td><strong>Permohonan Ijin Mengeluarkan Barang</strong></td></tr>
          </table>

          <div class="content">
            <p>Dengan hormat,</p>
            <p>Dengan ini kami PT. EMKA JAYA UTAMA bermaksud mengajukan permohonan untuk dapat melaksanakan proses pengeluaran barang kami pada kapal tersebut dibawah ini :</p>
            
            <table style="width: 80%; margin: 10px 0 10px 30px;">
              <tr><td width="150">Nama kapal</td><td width="10">:</td><td>${doc.ship_name || '.................................'}</td></tr>
              <tr><td>Bendera</td><td>:</td><td>${ship.bendera || 'INDONESIA'}</td></tr>
              <tr><td>Isi kotor</td><td>:</td><td>GT. ${ship.code || '.........................'}</td></tr>
              <tr><td>Nakhoda</td><td>:</td><td>${ship.nakhoda || '.................................'}</td></tr>
              <tr><td>ABK</td><td>:</td><td>${ship.abk ? ship.abk + ' orang' : '................................. orang'}</td></tr>
              <tr><td>Tiba tanggal</td><td>:</td><td>${tglTiba}</td></tr>
              <tr><td>Dari pelabuhan</td><td>:</td><td>${ship.asal_pelabuhan || '.................................'}</td></tr>
              <tr><td>Bongkaran</td><td>:</td><td>${doc.total_muatan || '..................'} Ton/M3</td></tr>
            </table>

            <p>Kegiatan bongkar muat ${doc.komoditas} milik ${doc.consignee} direncanakan akan dilaksanakan kegiatannya pada tanggal ${tglSurat}.</p>
            <p>Demikian surat permohonan ini kami sampaikan dan atas pertimbangan bapak memberikan ijin bongkar kami ucapkan banyak terima kasih.</p>
          </div>

          <div class="signature">
            <p>Marapokot, ${tglSurat}</p>
            <p>PERUSAHAAN JASA PENGURUSAN TRANSPORTASI<br/>PT. EMKA JAYA UTAMA</p>
            <p class="name">HILARIUS MBUSA</p>
            <p>DIREKTUR</p>
          </div>
        </body>
      </html>
    `);
    pw.document.close();
    pw.focus();
    setTimeout(() => pw.print(), 300);
  };

  const printBAJPT = (doc) => {
    const ship = ships.find(s => s.name === doc.ship_name) || {};
    const client = clients.find(c => c.name === doc.consignee) || {};
    const tglSurat = new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'});
    
    // Pecah contact_person jika formatnya "Nama - Jabatan"
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
          <title>BA JPT</title>
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
            <tr><td width="30">I.</td><td width="150">Nama Perusahaan</td><td width="10">:</td><td><strong>${doc.consignee}</strong></td></tr>
            <tr><td></td><td>Alamat</td><td>:</td><td>${client.alamat || '......................................'}</td></tr>
            <tr><td></td><td>Diwakili oleh</td><td>:</td><td>${contactName}</td></tr>
            <tr><td></td><td>Jabatan</td><td>:</td><td>${contactJabatan}</td></tr>
            <tr><td></td><td colspan="3">Dalam hal ini bertindak atas nama ${doc.consignee} yang selanjutnya disebut <strong>PIHAK PERTAMA</strong>.</td></tr>
          </table>

          <table class="table-layout">
            <tr><td width="30">II.</td><td width="150">Nama Perusahaan</td><td width="10">:</td><td><strong>PT. EMKA JAYA UTAMA</strong></td></tr>
            <tr><td></td><td>Alamat</td><td>:</td><td>Depan Polsek Mauponggo, Kel. Mauponggo, Kec. Mauponggo, Kab. Nagekeo</td></tr>
            <tr><td></td><td>Diwakili oleh</td><td>:</td><td><strong>Hilarius Mbusa</strong></td></tr>
            <tr><td></td><td>Jabatan</td><td>:</td><td><strong>Direktur</strong></td></tr>
            <tr><td></td><td colspan="3">Dalam hal ini bertindak atas nama PT. EMKA JAYA UTAMA yang selanjutnya disebut <strong>PIHAK KEDUA</strong>.</td></tr>
          </table>

          <p>Dengan ini menyatakan bahwa PIHAK PERTAMA telah menyerahkan barang milik ${doc.consignee} kepada PIHAK KEDUA dan PIHAK KEDUA telah menerima barang tersebut dari PIHAK PERTAMA dengan rincian sebagai berikut :</p>
          
          <table class="table-layout" style="margin-left: 30px; width: 90%;">
            <tr><td width="20">1.</td><td width="180">Nama kapal</td><td width="10">:</td><td>${doc.ship_name || '...........................'}</td></tr>
            <tr><td>2.</td><td>Jenis barang</td><td>:</td><td>${doc.komoditas}</td></tr>
            <tr><td>3.</td><td>Jumlah barang</td><td>:</td><td>${doc.total_muatan || '..................'} Ton / Zak</td></tr>
            <tr><td>4.</td><td>Pelabuhan muat/asal</td><td>:</td><td>${ship.asal_pelabuhan || '...........................'}</td></tr>
            <tr><td>5.</td><td>Pelabuhan tujuan</td><td>:</td><td>Marapokot</td></tr>
          </table>

          <p>Demikian Berita Acara Serah Terima Barang ini dibuat dengan sebenarnya agar yang bersangkutan / berkepentingan menjadi maklum.</p>

          <table class="signature-table">
            <tr>
              <td width="50%"><strong>Yang Menerima,</strong><br/>${doc.consignee}<br/><br/><br/><br/><br/><span class="name">.........................................</span></td>
              <td width="50%"><strong>Yang Menyerahkan,</strong><br/>Perusahaan JPT<br/>PT. EMKA JAYA UTAMA<br/><br/><br/><br/><br/><span class="name">HILARIUS MBUSA</span><br/>Direktur</td>
            </tr>
          </table>
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
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '4px' }}>Operasional Jasa JPT</h1>
          <p className="text-muted">Forwarding Block - Administrasi & Distribusi Barang</p>
        </div>
        <button className="btn btn-primary" onClick={handleBuatBaru}>
          <FileText size={18} /> Buat Dokumen Baru
        </button>
      </div>

      <div style={styles.tabs} className="glass-panel">
        <button style={{...styles.tab, ...(activeTab === 'dokumen' ? styles.activeTab : {})}} onClick={() => setActiveTab('dokumen')}>
          <ClipboardList size={18} /> Administrasi Dokumen
        </button>
        <button style={{...styles.tab, ...(activeTab === 'distribusi' ? styles.activeTab : {})}} onClick={() => setActiveTab('distribusi')}>
          <Truck size={18} /> Manajemen Distribusi
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'dokumen' && (
          <div style={styles.grid}>
            <div className="card glass-panel" style={{ gridColumn: 'span 12' }}>
              <h3 style={styles.cardTitle}>Input Manifest & DO Online</h3>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nomor BL / Manifest</label>
                  <input type="text" style={styles.input} placeholder="Masukkan nomor BL..." value={manifest} onChange={(e) => setManifest(e.target.value)} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Pilih Kapal (Ambil dari Master)</label>
                  <select style={styles.input} value={shipName} onChange={(e) => setShipName(e.target.value)}>
                    <option value="">Pilih Kapal...</option>
                    {ships.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Tanggal Tiba</label>
                  <input type="date" style={styles.input} value={tibaTanggal} onChange={(e) => setTibaTanggal(e.target.value)} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Consignee</label>
                  <select style={styles.input} value={consignee} onChange={(e) => setConsignee(e.target.value)}>
                    <option value="">Pilih Consignee...</option>
                    {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Komoditas</label>
                  <select style={styles.input} value={komoditas} onChange={(e) => setKomoditas(e.target.value)}>
                    <option value="">Pilih Komoditas</option>
                    <option value="Pasir Besi (Curah Kering)">Pasir Besi (Curah Kering)</option>
                    <option value="BBM (Curah Cair)">BBM (Curah Cair)</option>
                    <option value="Besi Beton (General Cargo)">Besi Beton (General Cargo)</option>
                    <option value="Lainnya">Lainnya (Ketik Manual)...</option>
                  </select>
                  {komoditas === 'Lainnya' && <input type="text" style={{...styles.input, marginTop: '8px'}} placeholder="Ketik komoditas baru..." value={komoditasLain} onChange={(e) => setKomoditasLain(e.target.value)} />}
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Total Muatan Kapal (Ton)</label>
                  <input type="number" style={styles.input} placeholder="Misal: 2500" value={totalMuatan} onChange={(e) => setTotalMuatan(e.target.value)} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Status DO Online</label>
                  <select style={styles.input} value={statusDO} onChange={(e) => setStatusDO(e.target.value)}>
                    <option value="Menunggu Penebusan">Menunggu Penebusan</option>
                    <option value="DO Dirilis">DO Dirilis</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handleSimpanDokumen}>Simpan Dokumen</button>
              </div>
            </div>

            <div className="card glass-panel" style={{ gridColumn: 'span 12', marginTop: '8px' }}>
              <h3 style={styles.cardTitle}>Daftar Manifest JPT - Cetak Dokumen</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Tanggal</th>
                    <th style={styles.th}>No. BL / Manifest</th>
                    <th style={styles.th}>Kapal</th>
                    <th style={styles.th}>Consignee</th>
                    <th style={styles.th}>Komoditas</th>
                    <th style={styles.th}>Total Muatan</th>
                    <th style={styles.th}>Status DO</th>
                    <th style={styles.th}>Aksi Cetak</th>
                  </tr>
                </thead>
                <tbody>
                  {savedManifests.length === 0 ? (
                    <tr style={styles.tr}>
                      <td colSpan="8" style={{ ...styles.td, textAlign: 'center', color: 'var(--color-text-muted)' }}>Belum ada dokumen yang disimpan.</td>
                    </tr>
                  ) : (
                    savedManifests.map((doc) => (
                      <tr key={doc.id} style={styles.tr}>
                        <td style={styles.td}>{new Date(doc.created_at).toLocaleDateString('id-ID')}</td>
                        <td style={styles.td}><strong>{doc.manifest_number}</strong></td>
                        <td style={styles.td}>{doc.ship_name || '-'}</td>
                        <td style={styles.td}>{doc.consignee}</td>
                        <td style={styles.td}>{doc.komoditas}</td>
                        <td style={styles.td}>{doc.total_muatan} Ton</td>
                        <td style={styles.td}><span className="badge" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>{doc.status_do}</span></td>
                        <td style={styles.td}>
                          <button className="btn btn-outline" style={{ padding: '8px 12px' }} onClick={() => setSelectedDoc(doc)}>
                            <Printer size={16} /> Kelola Dokumen
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {activeTab === 'distribusi' && (
          <div style={styles.grid}>
            <div className="card glass-panel" style={{ gridColumn: 'span 12' }}>
              <h3 style={styles.cardTitle}>Alokasi Truk & Penerbitan Surat Jalan</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>No. Order</th>
                    <th style={styles.th}>Komoditas</th>
                    <th style={styles.th}>Nopol Truk</th>
                    <th style={styles.th}>Sopir</th>
                    <th style={styles.th}>Tonase Rencana</th>
                    <th style={styles.th}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((item) => (
                    <tr key={item} style={styles.tr}>
                      <td style={styles.td}>ORD-2026-{item}</td>
                      <td style={styles.td}>Pasir Besi</td>
                      <td style={styles.td}><input type="text" style={{...styles.input, padding: '4px 8px'}} placeholder="Plat Nomor" /></td>
                      <td style={styles.td}><input type="text" style={{...styles.input, padding: '4px 8px'}} placeholder="Nama Sopir" /></td>
                      <td style={styles.td}>30 Ton</td>
                      <td style={styles.td}>
                        <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                          <QrCode size={14} /> Cetak Surat Jalan
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

      {/* Modal Cetak Dokumen JPT */}
      {selectedDoc && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card glass-panel animate-fade-in" style={{ width: '500px', maxWidth: '90%', position: 'relative' }}>
            <button onClick={() => setSelectedDoc(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
              <X size={24} />
            </button>
            <h2 style={{ marginTop: 0, color: 'var(--color-primary)' }}>Cetak Dokumen JPT</h2>
            <p className="text-muted" style={{ marginBottom: '20px' }}>Manifest: <strong>{selectedDoc.manifest_number}</strong> ({selectedDoc.consignee})</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '15px' }} onClick={() => printIzinPemasukan(selectedDoc)}>
                <FileText size={20} style={{ marginRight: '10px' }} /> 1. Surat Izin Pemasukan / Penumpukan Barang
              </button>
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '15px' }} onClick={() => printIzinPengeluaran(selectedDoc)}>
                <Download size={20} style={{ marginRight: '10px' }} /> 2. Surat Izin Mengeluarkan Barang
              </button>
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '15px' }} onClick={() => printBAJPT(selectedDoc)}>
                <ClipboardList size={20} style={{ marginRight: '10px' }} /> 3. Berita Acara Serah Terima Barang (JPT)
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
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    color: 'var(--color-text-secondary)',
    borderBottom: '1px solid var(--color-border)',
    fontWeight: 600,
  },
  tr: {
    borderBottom: '1px solid var(--color-border)',
  },
  td: {
    padding: '16px 12px',
  }
};
