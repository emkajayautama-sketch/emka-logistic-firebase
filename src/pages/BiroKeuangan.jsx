import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, CheckCircle, CreditCard, Receipt, FilePlus } from 'lucide-react';
import { supabase } from '../config/supabaseClient';

export default function BiroKeuangan() {
  const [activeTab, setActiveTab] = useState('invoices');
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [plans, setPlans] = useState([]);
  
  // Invoice Form State
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [invoicePreview, setInvoicePreview] = useState(null);

  useEffect(() => {
    fetchInvoices();
    fetchPlans();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data } = await supabase.from('pbm_plans').select('*').order('created_at', { ascending: false });
      if (data) setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handlePlanSelect = async (planId) => {
    setSelectedPlanId(planId);
    if (!planId) {
      setInvoicePreview(null);
      return;
    }

    try {
      const plan = plans.find(p => p.id.toString() === planId);
      if (!plan) return;

      // 1. Ambil Total Muatan (Tonase) dari tally
      const planMonth = new Date(plan.created_at).getMonth();
      const planYear = new Date(plan.created_at).getFullYear();
      
      const { data: tallies } = await supabase.from('pbm_tally_logs').select('tonnage, created_at');
      
      // Filter tallies for the same month/year as a simple association strategy
      const relatedTallies = tallies ? tallies.filter(t => {
        const d = new Date(t.created_at);
        return d.getMonth() === planMonth && d.getFullYear() === planYear;
      }) : [];
      
      const totalTonnage = relatedTallies.reduce((sum, t) => sum + Number(t.tonnage), 0) || Number(plan.total_tonnage);

      // 2. Simulasi Ambil Harga Tarif PBM Dasar & PPN dari tabel Master Tarif
      // (Bisa dikembangkan lebih lanjut untuk mengambil spesifik jenis barang)
      const baseTariff = 50000; // Rp 50.000 / Ton
      const subtotal = totalTonnage * baseTariff;
      
      // 3. Kalkulasi Pajak PPN 11%
      const taxAmount = subtotal * 0.11;
      const grandTotal = subtotal + taxAmount;

      setInvoicePreview({
        client_name: 'PT. Klien dari ' + plan.ship_name, // Ini mestinya ambil dari Master Client
        service_type: 'PBM',
        reference_id: plan.ship_name,
        total_tonnage: totalTonnage,
        base_tariff: baseTariff,
        subtotal: subtotal,
        tax_amount: taxAmount,
        grand_total: grandTotal
      });

    } catch (error) {
      console.error("Error generating preview:", error);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!invoicePreview) return;
    setIsLoading(true);
    try {
      const newInvoice = {
        invoice_number: `INV-${new Date().getFullYear()}${(Math.random() * 10000).toFixed(0).padStart(4, '0')}`,
        client_name: invoicePreview.client_name,
        service_type: invoicePreview.service_type,
        reference_id: invoicePreview.reference_id,
        total_tonnage: invoicePreview.total_tonnage,
        base_tariff: invoicePreview.base_tariff,
        subtotal: invoicePreview.subtotal,
        tax_amount: invoicePreview.tax_amount,
        grand_total: invoicePreview.grand_total,
        status: 'Unpaid',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 Hari jatuh tempo
      };

      const { error } = await supabase.from('invoices').insert([newInvoice]);
      if (error) throw error;
      
      alert('Berhasil! Invoice telah diterbitkan dan siap dikirim ke klien.');
      setInvoicePreview(null);
      setSelectedPlanId('');
      fetchInvoices();
      setActiveTab('invoices');
    } catch (error) {
      alert('Gagal menerbitkan invoice: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      const { error } = await supabase.from('invoices').update({ status: 'Paid' }).eq('id', id);
      if (error) throw error;
      fetchInvoices();
    } catch (error) {
      alert('Gagal update status: ' + error.message);
    }
  };

  const terbilang = (angka) => {
    const bilangan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    let hasil = "";
    if (angka < 12) hasil = bilangan[angka];
    else if (angka < 20) hasil = terbilang(angka - 10) + " Belas";
    else if (angka < 100) hasil = terbilang(Math.floor(angka / 10)) + " Puluh " + terbilang(angka % 10);
    else if (angka < 200) hasil = "Seratus " + terbilang(angka - 100);
    else if (angka < 1000) hasil = terbilang(Math.floor(angka / 100)) + " Ratus " + terbilang(angka % 100);
    else if (angka < 2000) hasil = "Seribu " + terbilang(angka - 1000);
    else if (angka < 1000000) hasil = terbilang(Math.floor(angka / 1000)) + " Ribu " + terbilang(angka % 1000);
    else if (angka < 1000000000) hasil = terbilang(Math.floor(angka / 1000000)) + " Juta " + terbilang(angka % 1000000);
    else if (angka < 1000000000000) hasil = terbilang(Math.floor(angka / 1000000000)) + " Milyar " + terbilang(angka % 1000000000);
    else if (angka < 1000000000000000) hasil = terbilang(Math.floor(angka / 1000000000000)) + " Triliun " + terbilang(angka % 1000000000000);
    return hasil.trim();
  };

  const handlePrintInvoice = (inv) => {
    const printWindow = window.open('', '_blank');
    const grandTotalBulat = Math.floor(inv.grand_total / 1000) * 1000;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${inv.invoice_number}</title>
          <style>
            @media print {
              @page { size: A4 portrait; margin: 20mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body { font-family: 'Arial', sans-serif; font-size: 14px; color: #000; line-height: 1.4; padding: 0; margin: 0; }
            .kop-container { display: flex; align-items: center; margin-bottom: 20px; }
            .logo-img { width: 80px; height: 80px; margin-right: 20px; object-fit: contain; }
            .kop { text-align: left; }
            .kop h1 { font-size: 20px; margin: 0; font-weight: bold; color: #0056b3; }
            .kop p { margin: 2px 0; font-size: 12px; }
            .title-section { text-align: center; margin-bottom: 20px; }
            .title-section h2 { font-size: 24px; font-weight: bold; margin: 0; text-decoration: underline; color: #0056b3; }
            
            .inv-meta { width: 100%; margin-bottom: 20px; font-weight: bold; }
            .inv-meta td { padding: 2px 0; }
            
            .box-title { background-color: #0056b3; color: white; padding: 4px 8px; font-weight: bold; display: inline-block; margin-bottom: 5px; }
            
            .info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
            .info-table td { padding: 4px; vertical-align: top; }
            
            table.items { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            table.items th { background-color: #f2f2f2; border: 1px solid #000; padding: 8px; text-align: center; font-size: 12px; }
            table.items td { border: 1px solid #000; padding: 8px; font-size: 12px; }
            
            .totals-container { display: flex; justify-content: flex-end; width: 100%; margin-bottom: 10px; }
            table.totals { border-collapse: collapse; width: 40%; }
            table.totals td { padding: 4px 8px; font-size: 13px; border: 1px solid transparent; }
            table.totals .bold-total { font-weight: bold; }
            
            .terbilang-box { border: 1px solid #000; padding: 10px; margin-bottom: 20px; font-weight: bold; font-style: italic; background: #f9f9f9; }
            
            .signature { margin-top: 40px; float: right; text-align: center; width: 250px; }
            .signature p { margin: 0; }
            .signature .name { margin-top: 80px; font-weight: bold; text-decoration: underline; }
            .signature .title { font-weight: bold; }
            
            .catatan { clear: both; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="kop-container">
            <img src="${window.location.origin}/logo.png" class="logo-img" alt="Logo" onerror="this.style.display='none'" />
            <div class="kop">
              <h1>PT. EMKA JAYA UTAMA</h1>
              <p>Depan Polsek Mauponggo, Kel.Mauponggo,</p>
              <p>Kec. Mauponggo, Kab. Nagekeo Prov. NTT</p>
              <p>86463, HP. 0812 - 3982 - 0000</p>
            </div>
          </div>
          
          <div class="title-section">
            <h2>INVOICE</h2>
          </div>
          
          <table class="inv-meta">
            <tr>
              <td width="100">Tanggal</td>
              <td width="10">:</td>
              <td>${new Date(inv.created_at).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})}</td>
            </tr>
            <tr>
              <td>Invoice No</td>
              <td>:</td>
              <td>${inv.invoice_number}</td>
            </tr>
          </table>
          
          <div class="box-title">INFORMASI PELANGGAN</div>
          <table class="info-table">
            <tr>
              <td width="150">Nama Pelanggan /<br/>Contact Person</td>
              <td width="10">:</td>
              <td>${inv.client_name}</td>
            </tr>
            <tr>
              <td>Alamat</td>
              <td>:</td>
              <td>-</td>
            </tr>
            <tr>
              <td>No. Telp</td>
              <td>:</td>
              <td>-</td>
            </tr>
            <tr>
              <td>E-mail</td>
              <td>:</td>
              <td>-</td>
            </tr>
          </table>

          <table class="items">
            <thead>
              <tr>
                <th width="30">No.</th>
                <th>Keterangan</th>
                <th width="50">Sat.</th>
                <th width="60">Jml</th>
                <th width="100">Harga Satuan<br/>(Rp)</th>
                <th width="60">Jumlah<br/>Hari</th>
                <th width="120">Total<br/>(Rp)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center;">1.</td>
                <td>Jasa Bongkar Muat (PBM) / Jasa Pengurusan Transportasi (JPT)<br/>Referensi Kapal: ${inv.reference_id}</td>
                <td style="text-align: center;">Ton</td>
                <td style="text-align: center;">${Number(inv.total_tonnage).toLocaleString('id-ID')}</td>
                <td style="text-align: right;">${Number(inv.base_tariff).toLocaleString('id-ID')}</td>
                <td style="text-align: center;">0</td>
                <td style="text-align: right;">${Number(inv.subtotal).toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals-container">
            <table class="totals">
              <tr>
                <td>Sub Total</td>
                <td style="text-align: right;">${Number(inv.subtotal).toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td>PPN (11 %)</td>
                <td style="text-align: right;">${Number(inv.tax_amount).toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td>Total</td>
                <td style="text-align: right;">${Number(inv.grand_total).toLocaleString('id-ID')}</td>
              </tr>
              <tr class="bold-total">
                <td>Dibulatkan</td>
                <td style="text-align: right;">${Number(grandTotalBulat).toLocaleString('id-ID')}</td>
              </tr>
            </table>
          </div>
          
          <div class="terbilang-box">
            Terbilang : ${terbilang(grandTotalBulat)} Rupiah
          </div>
          
          <div class="signature">
            <p>PT. EMKA JAYA UTAMA</p>
            <p class="name">HILARIUS MBUSA</p>
            <p class="title">DIREKTUR</p>
          </div>
          
          <div class="catatan">
            Catatan : Pembayaran dapat dilakukan melalui Bank Mandiri Nomor Rekening 181-00-0283661-8<br/>
            Nama Rekening Pt. Emka Jaya Utama
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 200);
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '4px' }}>Biro Keuangan (Billing)</h1>
          <p className="text-muted">Penerbitan Invoice otomatis untuk klien berdasarkan data operasional</p>
        </div>
      </div>

      <div style={styles.tabs} className="glass-panel">
        <button 
          style={{...styles.tab, ...(activeTab === 'invoices' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('invoices')}
        >
          <Receipt size={18} /> Daftar Invoice (Tagihan)
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'create' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('create')}
        >
          <FilePlus size={18} /> Buat Invoice PBM Baru
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'invoices' && (
          <div className="card glass-panel">
            <h3 style={styles.cardTitle}>Riwayat Tagihan Klien</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>No Invoice</th>
                  <th style={styles.th}>Klien / Kapal</th>
                  <th style={styles.th}>Total Tonase</th>
                  <th style={styles.th}>Grand Total (Inc. PPN)</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{...styles.td, textAlign: 'center', color: 'var(--color-text-muted)'}}>Belum ada data Invoice.</td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} style={styles.tr}>
                      <td style={{...styles.td, fontWeight: 'bold'}}>{inv.invoice_number}</td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: '500' }}>{inv.client_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{inv.reference_id}</div>
                      </td>
                      <td style={styles.td}>{inv.total_tonnage.toLocaleString('id-ID')} Ton</td>
                      <td style={{...styles.td, fontWeight: 'bold', color: 'var(--color-primary)'}}>{formatRupiah(inv.grand_total)}</td>
                      <td style={styles.td}>
                        <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handlePrintInvoice(inv)}>
                            <FileText size={14} /> Cetak
                          </button>
                          {inv.status !== 'Paid' && (
                            <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleMarkAsPaid(inv.id)}>
                              <CheckCircle size={14} /> Lunas
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'create' && (
          <div style={styles.grid}>
            <div className="card glass-panel" style={{ gridColumn: 'span 5' }}>
              <h3 style={styles.cardTitle}>Pilih Data Operasional Lapangan</h3>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '24px' }}>
                Sistem akan menyedot data tonase dari form mandor di lapangan untuk kapal yang Anda pilih.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={styles.label}>Pilih Rencana Bongkar Muat Kapal</label>
                  <select 
                    style={{...styles.input, width: '100%', marginTop: '8px'}}
                    value={selectedPlanId}
                    onChange={(e) => handlePlanSelect(e.target.value)}
                  >
                    <option value="">-- Pilih Kapal --</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.ship_name} ({new Date(p.created_at).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="card glass-panel" style={{ gridColumn: 'span 7' }}>
              <h3 style={styles.cardTitle}>Draft Tagihan (Print Preview)</h3>
              
              {!invoicePreview ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px', border: '2px dashed var(--color-border)', borderRadius: '12px' }}>
                  <DollarSign size={48} color="var(--color-text-muted)" style={{ opacity: 0.3, marginBottom: '16px' }} />
                  <p className="text-muted">Pilih kapal di sebelah kiri untuk me-render hitungan invoice.</p>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div style={{ padding: '24px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-border)', paddingBottom: '16px', marginBottom: '16px' }}>
                      <div>
                        <h2 style={{ margin: 0, color: 'var(--color-primary)' }}>INVOICE PBM</h2>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>PT. EMKA JAYA UTAMA</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>DRAFT</p>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{new Date().toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Ditagihkan Kepada:</p>
                      <h4 style={{ margin: 0 }}>{invoicePreview.client_name}</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>Ref: Kapal {invoicePreview.reference_id}</p>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                          <th style={{ padding: '12px', textAlign: 'left', borderRadius: '8px 0 0 8px' }}>Deskripsi Jasa</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Qty (Ton)</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Tarif/Ton</th>
                          <th style={{ padding: '12px', textAlign: 'right', borderRadius: '0 8px 8px 0' }}>Jumlah</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)' }}>Jasa Bongkar Muat (Stevedoring)</td>
                          <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>{invoicePreview.total_tonnage.toLocaleString('id-ID')}</td>
                          <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>{formatRupiah(invoicePreview.base_tariff)}</td>
                          <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)', textAlign: 'right', fontWeight: 'bold' }}>{formatRupiah(invoicePreview.subtotal)}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ width: '300px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                          <span className="text-muted">Subtotal</span>
                          <span style={{ fontWeight: '500' }}>{formatRupiah(invoicePreview.subtotal)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                          <span className="text-muted">PPN (11%)</span>
                          <span style={{ fontWeight: '500' }}>{formatRupiah(invoicePreview.tax_amount)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', fontSize: '1.2rem' }}>
                          <span style={{ fontWeight: 'bold' }}>Grand Total</span>
                          <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{formatRupiah(invoicePreview.grand_total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '16px 32px', fontSize: '1.1rem' }}
                      onClick={handleGenerateInvoice}
                      disabled={isLoading}
                    >
                      <CreditCard size={20} /> {isLoading ? 'Menyimpan...' : 'Terbitkan Tagihan Sekarang'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
    fontSize: '1.2rem',
    marginBottom: '20px',
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
  td: { padding: '16px 12px', verticalAlign: 'middle' }
};
