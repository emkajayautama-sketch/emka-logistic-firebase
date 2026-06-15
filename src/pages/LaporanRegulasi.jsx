import React, { useState, useEffect } from 'react';
import { FileBarChart, CalendarDays, TrendingUp, Download, Printer, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../config/supabaseClient';
import * as XLSX from 'xlsx';

const MONTHS = [
  { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' }, { value: '03', label: 'Maret' },
  { value: '04', label: 'April' }, { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' }, { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
];

const YEARS = ['2024', '2025', '2026', '2027', '2028'];

export default function LaporanRegulasi() {
  const [activeTab, setActiveTab] = useState('bulanan');
  
  const d = new Date();
  const [selectedM, setSelectedM] = useState(String(d.getMonth() + 1).padStart(2, '0'));
  const [selectedY, setSelectedY] = useState(String(d.getFullYear()));
  
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalKapal: 0,
    totalPBM: 0,
    totalJPT: 0
  });
  
  useEffect(() => {
    fetchStats();
  }, [selectedM, selectedY, activeTab]);

  // Helper untuk mendapatkan range tanggal berdasarkan tab
  const getDateRange = () => {
    if (activeTab === 'bulanan') {
      const startDate = new Date(selectedY, Number(selectedM) - 1, 1).toISOString();
      const endDate = new Date(selectedY, Number(selectedM), 0, 23, 59, 59).toISOString();
      return { startDate, endDate };
    } else {
      const startDate = new Date(selectedY, 0, 1).toISOString();
      const endDate = new Date(selectedY, 11, 31, 23, 59, 59).toISOString();
      return { startDate, endDate };
    }
  };

  const fetchStats = async () => {
    const { startDate, endDate } = getDateRange();

    try {
      // Fetch PBM stats
      const { data: pbmData } = await supabase
        .from('pbm_tally_logs')
        .select('tonnage')
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      const totalPBM = pbmData ? pbmData.reduce((sum, item) => sum + Number(item.tonnage), 0) : 0;

      // Fetch JPT stats
      const { data: jptData } = await supabase
        .from('manifests')
        .select('commodity')
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      const totalJPT = jptData ? jptData.length : 0;

      // Fetch Ships Call
      const { data: plansData } = await supabase
        .from('pbm_plans')
        .select('id')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      setStats({
        totalKapal: plansData ? plansData.length : 0,
        totalPBM,
        totalJPT
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleExportPBM = async () => {
    setIsLoading(true);
    const { startDate, endDate } = getDateRange();
    const labelWaktu = activeTab === 'bulanan' ? `${selectedY}-${selectedM}` : `TAHUN-${selectedY}`;

    try {
      const { data: plans } = await supabase
        .from('pbm_plans')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      const { data: logs } = await supabase
        .from('pbm_tally_logs')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const rows = [];
      if (plans && plans.length > 0) {
        plans.forEach((plan, index) => {
          const planLogs = logs ? logs.filter(l => new Date(l.created_at).getMonth() === new Date(plan.created_at).getMonth()) : [];
          const totalMuat = planLogs.reduce((sum, l) => sum + Number(l.tonnage), 0);
          
          rows.push([
            index + 1,
            plan.created_at.split('T')[0],
            'BM', 
            `RKBM-${plan.id}`,
            plan.ship_name,
            'INDONESIA', 
            '', '', '', 
            'PT. EMKA JAYA UTAMA', 
            'Curah', 
            0, 
            totalMuat || plan.total_tonnage, 
            0, 0, 
            '08:00', '17:00', 
            15, 
            'Marapokot', '-', 'PT. EMKA JAYA UTAMA'
          ]);
        });
      } else {
        rows.push(["", "", "", "", "", "N I H I L", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
      }

      const header = [
        [`LAPORAN ${activeTab === 'bulanan' ? 'BULANAN' : 'TAHUNAN'} KEGIATAN PERUSAHAAN BONGKAR MUAT`],
        ["NAMA PERUSAHAAN", ": PT. EMKA JAYA UTAMA"],
        ["ALAMAT PERUSAHAAN", ": MAUPONGGO, KEL. MAUPONGGO, KEC. MAUPONGGO, KAB. NAGEKEO"],
        ["PELABUHAN BONGKAR MUAT", ": PELABUHAN KELAS III MARAPOKOT"],
        ["NOMOR INDUK BERUSAHA", ": 9120319120253"],
        ["NOMOR POKOK WAJIB PAJAK", ": 90.611.700.7-923.000"],
        [`LAPORAN UNTUK ${activeTab === 'bulanan' ? 'BULAN' : 'TAHUN'}`, `: ${activeTab === 'bulanan' ? MONTHS.find(m => m.value === selectedM)?.label + ' ' + selectedY : selectedY}`],
        [],
        ["NO", "TANGGAL", "KEGIATAN", "NOMOR RKBM", "NAMA KAPAL", "BENDERA", "DWT", "GT", "HP", "AGEN", "JENIS MUATAN", "BONGKAR (TON)", "MUAT (TON)", "BONGKAR (UNIT)", "MUAT (UNIT)", "MULAI", "SELESAI", "BURUH", "PELABUHAN MUAT", "PELABUHAN TUJUAN", "PENUNJUKAN PBM"],
        ...rows
      ];

      const ws = XLSX.utils.aoa_to_sheet(header);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "laporan");
      XLSX.writeFile(wb, `SL050_PBM_${labelWaktu}.xlsx`);
      
    } catch (error) {
      console.error(error);
      alert('Gagal export PBM');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintPBMPDF = async () => {
    setIsLoading(true);
    const { startDate, endDate } = getDateRange();
    
    try {
      const { data: plans } = await supabase
        .from('pbm_plans')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      const { data: logs } = await supabase
        .from('pbm_tally_logs')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      let tableRows = '';
      if (plans && plans.length > 0) {
        plans.forEach((plan, index) => {
          const planLogs = logs ? logs.filter(l => new Date(l.created_at).getMonth() === new Date(plan.created_at).getMonth()) : [];
          const totalMuat = planLogs.reduce((sum, l) => sum + Number(l.tonnage), 0);
          const tgl = new Date(plan.created_at).toLocaleDateString('id-ID');
          
          tableRows += `
            <tr>
              <td style="text-align:center;">${index + 1}</td>
              <td style="text-align:center;">${tgl}</td>
              <td>${plan.ship_name}</td>
              <td style="text-align:center;">Curah</td>
              <td style="text-align:center;">0</td>
              <td></td>
              <td style="text-align:center;">Curah</td>
              <td style="text-align:center;">${totalMuat || plan.total_tonnage}</td>
              <td style="text-align:center;">Marapokot</td>
              <td style="text-align:center;">-</td>
              <td>PT. EMKA JAYA UTAMA</td>
            </tr>
          `;
        });
      } else {
        tableRows = `<tr><td colspan="11" style="text-align:center; padding: 20px; font-weight: bold; font-size: 14px; letter-spacing: 5px;">N I H I L</td></tr>`;
      }

      const blnLabel = activeTab === 'bulanan' ? MONTHS.find(m => m.value === selectedM)?.label + ' ' + selectedY : selectedY;
      const tglCetak = new Date().toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'});

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Laporan PBM ${blnLabel}</title>
            <style>
              @media print {
                @page { size: A4 landscape; margin: 15mm; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
              body { font-family: 'Arial', sans-serif; font-size: 11px; color: #000; }
              .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
              .logo-box { display: flex; align-items: center; }
              .logo-img { width: 60px; height: 60px; margin-right: 15px; object-fit:contain; }
              .company-name { font-size: 20px; font-weight: bold; color: #e11d48; margin: 0; line-height: 1; }
              .company-name span { color: #1e3a8a; }
              .address { font-size: 11px; max-width: 300px; }
              .contact { font-size: 11px; }
              
              .title { text-align: center; font-size: 14px; font-weight: bold; margin: 20px 0; text-decoration: underline; }
              
              .meta-table { font-size: 11px; font-weight: bold; margin-bottom: 15px; }
              .meta-table td { padding: 2px 5px 2px 0; }
              
              table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 10px; }
              table.data-table th, table.data-table td { border: 1px solid #000; padding: 6px; }
              table.data-table th { background-color: #e5e7eb; text-align: center; font-weight: bold; }
              
              .signature { float: right; text-align: center; width: 250px; font-size: 11px; }
              .signature p { margin: 2px 0; }
              .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="header-container">
              <div class="logo-box">
                <img src="${window.location.origin}/logo.png" class="logo-img" onerror="this.style.display='none'" />
                <div>
                  <h1 class="company-name">EMKA JAYA <span>UTAMA</span></h1>
                </div>
              </div>
              <div class="address">
                Depan Polsek Mauponggo, Kel. Mauponggo,<br/>
                Kec. Mauponggo, Kab. Nagekeo, Provinsi Nusa<br/>
                Tenggara Timur 86463
              </div>
              <div class="contact">
                <table style="font-size: 11px;">
                  <tr><td>E-mail</td><td>:</td><td style="color:#3b82f6; text-decoration:underline;">pt.emkajayautama@gmail.com</td></tr>
                  <tr><td>Telp</td><td>:</td><td>0812 3982 0000</td></tr>
                  <tr><td>Fax</td><td>:</td><td>-</td></tr>
                </table>
              </div>
            </div>
            
            <div class="title">LAPORAN ${activeTab === 'bulanan' ? 'BULANAN' : 'TAHUNAN'} KEGIATAN PERUSAHAAN BONGKAR MUAT</div>
            
            <table class="meta-table">
              <tr><td width="150">NAMA PERUSAHAAN</td><td width="10">:</td><td>PT. EMKA JAYA UTAMA</td></tr>
              <tr><td>ALAMAT PERUSAHAAN</td><td>:</td><td>MAUPONGGO, KEL. MAUPONGGO, KEC. MAUPONGGO, KAB. NAGEKEO</td></tr>
              <tr><td>PELABUHAN BONGKAR MUAT</td><td>:</td><td>PELABUHAN KELAS III MARAPOKOT</td></tr>
              <tr><td>NOMOR IZIN USAHA PBM</td><td>:</td><td>552/45/DPMPTSP.4.3/7/2023</td></tr>
              <tr><td>NOMOR INDUK BERUSAHA</td><td>:</td><td>9120319120253</td></tr>
              <tr><td>NOMOR POKOK WAJIB PAJAK</td><td>:</td><td>90.611.700.7-923.000</td></tr>
              <tr><td>LAPORAN UNTUK ${activeTab === 'bulanan' ? 'BULAN' : 'TAHUN'}</td><td>:</td><td>${blnLabel.toUpperCase()}</td></tr>
            </table>

            <table class="data-table">
              <thead>
                <tr>
                  <th rowspan="2" width="30">NO</th>
                  <th rowspan="2" width="80">TANGGAL (T/B)</th>
                  <th rowspan="2">NAMA KAPAL/GT</th>
                  <th colspan="3">BONGKAR</th>
                  <th colspan="2">MUAT</th>
                  <th colspan="2">PELABUHAN</th>
                  <th rowspan="2">KETERANGAN</th>
                </tr>
                <tr>
                  <th>JENIS BARANG</th>
                  <th>TON/M3/EKOR</th>
                  <th>KETERANGAN</th>
                  <th>JENIS BARANG</th>
                  <th>TON/M3/EKOR</th>
                  <th>MUAT</th>
                  <th>TUJUAN</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>

            <div class="signature">
              <p>MBAY, ${tglCetak.toUpperCase()}</p>
              <br/>
              <p>DIBUAT OLEH,</p>
              <p>PERUSAHAAN BONGKAR MUAT</p>
              <p>PT. EMKA JAYA UTAMA</p>
              <p class="name">HILARIUS MBUSA</p>
              <p>Direktur</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
      
    } catch (error) {
      console.error(error);
      alert('Gagal cetak PDF PBM');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportJPT = async () => {
    setIsLoading(true);
    const { startDate, endDate } = getDateRange();
    const labelWaktu = activeTab === 'bulanan' ? `${selectedY}-${selectedM}` : `TAHUN-${selectedY}`;

    try {
      const { data: manifests } = await supabase
        .from('manifests')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const rows = [];
      if (manifests && manifests.length > 0) {
        manifests.forEach((m, index) => {
          rows.push([
            index + 1,
            m.created_at.split('T')[0],
            m.consignee_name,
            m.commodity,
            'KAPAL',
            '-',
            '-',
            'BONGKAR',
            0, 
            100, 
            0, 0, 
            100 
          ]);
        });
      } else {
        rows.push(["", "", "", "", "", "N I H I L", "", "", "", "", "", "", ""]);
      }

      const header = [
        [`LAPORAN ${activeTab === 'bulanan' ? 'BULANAN' : 'TAHUNAN'} KEGIATAN PERUSAHAAN JASA PENGURUSAN TRANSPORTASI`],
        ["NAMA PERUSAHAAN", ": PT. EMKA JAYA UTAMA"],
        ["ALAMAT PERUSAHAAN", ": MAUPONGGO, KEL. MAUPONGGO, KEC. MAUPONGGO, KAB. NAGEKEO"],
        ["PELABUHAN", ": PELABUHAN KELAS III MARAPOKOT"],
        ["NOMOR INDUK BERUSAHA", ": 9120319120253"],
        ["NOMOR POKOK WAJIB PAJAK", ": 90.611.700.7-923.000"],
        [`LAPORAN UNTUK ${activeTab === 'bulanan' ? 'BULAN' : 'TAHUN'}`, `: ${activeTab === 'bulanan' ? MONTHS.find(m => m.value === selectedM)?.label + ' ' + selectedY : selectedY}`],
        [],
        ["NO", "TANGGAL", "PEMILIK BARANG", "NAMA BARANG", "JENIS MODA", "NAMA KAPAL", "NO KENDARAAN", "KEGIATAN", "IMPOR (PIB)", "ANTAR PULAU (PBB)", "EKSPOR (PEB)", "ANTAR PULAU (PMB)", "TOTAL (TON)"],
        ...rows
      ];

      const ws = XLSX.utils.aoa_to_sheet(header);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "laporan");
      XLSX.writeFile(wb, `SL051_JPT_${labelWaktu}.xlsx`);
      
    } catch (error) {
      console.error(error);
      alert('Gagal export JPT');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '4px' }}>Laporan Regulasi (KSOP / Inaportnet)</h1>
          <p className="text-muted">Generate otomatis laporan Inaportnet Bulanan & Tahunan (SL050 & SL051)</p>
        </div>
      </div>

      <div style={styles.tabs} className="glass-panel">
        <button 
          style={{...styles.tab, ...(activeTab === 'bulanan' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('bulanan')}
        >
          <CalendarDays size={18} /> Laporan Bulanan
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'tahunan' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('tahunan')}
        >
          <TrendingUp size={18} /> Laporan Tahunan
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.grid}>
          <div className="card glass-panel" style={{ gridColumn: 'span 12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
              <h3 style={styles.cardTitle}>Filter Periode Laporan</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                {activeTab === 'bulanan' && (
                  <select style={styles.select} value={selectedM} onChange={(e) => setSelectedM(e.target.value)}>
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                )}
                <select style={styles.select} value={selectedY} onChange={(e) => setSelectedY(e.target.value)}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
              <div style={styles.statBox}>
                <div className="text-muted">Kunjungan Kapal ({activeTab === 'bulanan' ? 'Bulan' : 'Tahun'} Ini)</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{stats.totalKapal} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>Call</span></div>
              </div>
              <div style={styles.statBox}>
                <div className="text-muted">Kegiatan PBM ({activeTab === 'bulanan' ? 'Bulan' : 'Tahun'} Ini)</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{stats.totalPBM} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>Ton</span></div>
              </div>
              <div style={styles.statBox}>
                <div className="text-muted">Dokumen JPT ({activeTab === 'bulanan' ? 'Bulan' : 'Tahun'} Ini)</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>{stats.totalJPT} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>Manifest</span></div>
              </div>
            </div>

            <div style={{ padding: '24px', backgroundColor: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0 }}>Cetak & Export Laporan ({activeTab === 'bulanan' ? 'Bulanan' : 'Tahunan'})</h3>
              <p className="text-muted" style={{ margin: 0, marginBottom: '8px' }}>
                Sistem akan menarik seluruh data operasional untuk <strong>{activeTab === 'bulanan' ? `${MONTHS.find(m => m.value === selectedM)?.label} ${selectedY}` : `Tahun ${selectedY}`}</strong>. Pilih Cetak PDF untuk arsip internal, atau Export Excel untuk diunggah ke Inaportnet.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></div> Laporan PBM (Bongkar Muat)</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-outline" style={{ flex: 1, padding: '10px' }} onClick={handlePrintPBMPDF} disabled={isLoading}>
                      <Printer size={18} /> Cetak PDF
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1, padding: '10px' }} onClick={handleExportPBM} disabled={isLoading}>
                      <FileSpreadsheet size={18} /> Excel (Inaportnet)
                    </button>
                  </div>
                </div>

                <div style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div> Laporan JPT (Transportasi)</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-outline" style={{ flex: 1, padding: '10px' }} onClick={() => alert('Fitur Cetak PDF JPT Segera Hadir')} disabled={isLoading}>
                      <Printer size={18} /> Cetak PDF
                    </button>
                    <button className="btn btn-success" style={{ flex: 1, padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none' }} onClick={handleExportJPT} disabled={isLoading}>
                      <FileSpreadsheet size={18} /> Excel (Inaportnet)
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
    margin: 0,
  },
  select: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  statBox: {
    flex: 1,
    padding: '24px',
    backgroundColor: 'var(--color-bg)',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
  }
};
