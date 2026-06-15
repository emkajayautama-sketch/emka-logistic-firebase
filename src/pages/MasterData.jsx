import React, { useState, useEffect } from 'react';
import { Database, UserCog, Building2, Anchor, CircleDollarSign, Plus, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '../config/supabaseClient';

export default function MasterData() {
  const [activeTab, setActiveTab] = useState('pengguna');
  const [isLoading, setIsLoading] = useState(false);
  
  // State untuk data dari Supabase
  const [ships, setShips] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [tariffs, setTariffs] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'kapal' | 'klien' | 'pengguna' | 'tarif'
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ 
    code: '', 
    name: '', 
    type: '', 
    status: 'Aktif',
    username: '',
    role: 'Tally Lapangan',
    description: '',
    bendera: 'INDONESIA',
    nakhoda: '',
    abk: '',
    asal_pelabuhan: '',
    alamat: '',
    contact_person: ''
  });

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    setIsLoading(true);
    try {
      const { data: shipsData } = await supabase.from('ships').select('*').order('created_at', { ascending: false });
      if (shipsData) setShips(shipsData);

      const { data: clientsData } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
      if (clientsData) setClients(clientsData);
      
      const { data: usersData } = await supabase.from('staff_users').select('*').order('created_at', { ascending: false });
      if (usersData) setUsers(usersData);
      
      const { data: tariffsData } = await supabase.from('tariffs').select('*').order('created_at', { ascending: false });
      if (tariffsData) setTariffs(tariffsData);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Buka Modal Tambah/Edit
  const handleOpenModal = (type, data = null) => {
    setModalType(type);
    if (data) {
      setEditId(data.id);
      setFormData({ 
        code: data.code || '', 
        name: data.name || '', 
        type: data.type || '', 
        status: data.status || 'Aktif',
        username: data.username || '',
        role: data.role || 'Tally Lapangan',
        description: data.description || '',
        bendera: data.bendera || 'INDONESIA',
        nakhoda: data.nakhoda || '',
        abk: data.abk || '',
        asal_pelabuhan: data.asal_pelabuhan || '',
        alamat: data.alamat || '',
        contact_person: data.contact_person || ''
      });
    } else {
      setEditId(null);
      setFormData({ 
        code: '', name: '', type: '', status: 'Aktif', 
        username: '', role: 'Tally Lapangan', description: '',
        bendera: 'INDONESIA', nakhoda: '', abk: '', asal_pelabuhan: '',
        alamat: '', contact_person: ''
      });
    }
    setIsModalOpen(true);
  };

  // Simpan Data (INSERT / UPDATE)
  const handleSaveData = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Nama wajib diisi!");
      return;
    }

    setIsLoading(true);
    let tableName = '';
    let payload = {};

    if (modalType === 'kapal') {
      tableName = 'ships';
      payload = { 
        code: formData.code, name: formData.name, type: formData.type, status: formData.status,
        bendera: formData.bendera, nakhoda: formData.nakhoda, abk: formData.abk || 0, asal_pelabuhan: formData.asal_pelabuhan
      };
    } else if (modalType === 'klien') {
      tableName = 'clients';
      payload = { 
        code: formData.code, name: formData.name, type: formData.type, status: formData.status,
        alamat: formData.alamat, contact_person: formData.contact_person
      };
    } else if (modalType === 'pengguna') {
      tableName = 'staff_users';
      payload = { name: formData.name, username: formData.username, role: formData.role, status: formData.status };
    } else if (modalType === 'tarif') {
      tableName = 'tariffs';
      payload = { code: formData.code, name: formData.name, description: formData.description, status: formData.status };
    }

    try {
      if (editId) {
        // UPDATE
        const { error } = await supabase.from(tableName).update(payload).eq('id', editId);
        if (error) throw error;
        alert("Data berhasil diupdate!");
      } else {
        // INSERT
        const { error } = await supabase.from(tableName).insert([payload]);
        if (error) throw error;
        alert("Data baru berhasil ditambahkan!");
      }

      setIsModalOpen(false);
      fetchMasterData(); // Refresh tabel
    } catch (error) {
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Delete (Supabase)
  const handleDelete = async (tab, id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini secara permanen?')) {
      setIsLoading(true);
      let tableName = '';
      if (tab === 'kapal') tableName = 'ships';
      if (tab === 'klien') tableName = 'clients';
      if (tab === 'pengguna') tableName = 'staff_users';
      if (tab === 'tarif') tableName = 'tariffs';

      try {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) throw error;
        alert("Data berhasil dihapus!");
        fetchMasterData(); // Refresh
      } catch (error) {
        alert("Gagal menghapus: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '4px' }}>Pengaturan & Master Data</h1>
          <p className="text-muted">Manajemen referensi data utama dan hak akses sistem</p>
        </div>
        
        <button className="btn btn-primary" onClick={() => handleOpenModal(activeTab)}>
          <Plus size={18} /> Tambah {
            activeTab === 'kapal' ? 'Kapal' : 
            activeTab === 'klien' ? 'Klien' : 
            activeTab === 'pengguna' ? 'Staf' : 'Tarif'
          } Baru
        </button>
      </div>

      <div style={styles.tabs} className="glass-panel">
        <button 
          style={{...styles.tab, ...(activeTab === 'pengguna' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('pengguna')}
        >
          <UserCog size={18} /> Hak Akses Pengguna
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'kapal' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('kapal')}
        >
          <Anchor size={18} /> Database Kapal & Agen
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'klien' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('klien')}
        >
          <Building2 size={18} /> Database Klien (Pemilik Barang)
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'tarif' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('tarif')}
        >
          <CircleDollarSign size={18} /> Tabel Tarif & Pajak
        </button>
      </div>

      <div style={styles.content}>
        <div className="card glass-panel">
          <h3 style={styles.cardTitle}>
            {activeTab === 'pengguna' && 'Manajemen Akun Staf (Role Permissions)'}
            {activeTab === 'kapal' && 'Data Master Kapal & Agen Pelayaran'}
            {activeTab === 'klien' && 'Data Master Klien & Konsinyee'}
            {activeTab === 'tarif' && 'Data Komponen Tarif Jasa & PPN'}
          </h3>
          
          <table style={styles.table}>
            <thead>
              <tr>
                {activeTab === 'pengguna' && (
                  <>
                    <th style={styles.th}>Nama Staf</th>
                    <th style={styles.th}>Username</th>
                    <th style={styles.th}>Role Akses</th>
                    <th style={styles.th}>Status</th>
                  </>
                )}
                {(activeTab === 'kapal' || activeTab === 'klien') && (
                  <>
                    <th style={styles.th}>Kode / ID</th>
                    <th style={styles.th}>Nama Lengkap</th>
                    <th style={styles.th}>Tipe / Kategori</th>
                    <th style={styles.th}>Status</th>
                  </>
                )}
                {activeTab === 'tarif' && (
                  <>
                    <th style={styles.th}>ID Data</th>
                    <th style={styles.th}>Deskripsi / Nama</th>
                    <th style={styles.th}>Keterangan Tambahan</th>
                    <th style={styles.th}>Status</th>
                  </>
                )}
                <th style={styles.th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {activeTab === 'pengguna' && users.map(user => (
                <tr key={user.id} style={styles.tr}>
                  <td style={styles.td}>{user.name}</td>
                  <td style={styles.td}>{user.username}</td>
                  <td style={styles.td}>
                    <span className="badge" style={{ backgroundColor: user.role === 'Admin' ? 'var(--color-primary)' : 'var(--color-warning)', color: 'white' }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={styles.td}><span className="text-muted">{user.status}</span></td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button className="btn-icon" style={{color: 'var(--color-primary)'}} onClick={() => handleOpenModal('pengguna', user)}><Edit2 size={16} /></button>
                      <button className="btn-icon" style={{color: 'var(--color-danger)'}} onClick={() => handleDelete('pengguna', user.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}

              {activeTab === 'kapal' && ships.map(ship => (
                <tr key={ship.id} style={styles.tr}>
                  <td style={styles.td}>{ship.code}</td>
                  <td style={styles.td}>{ship.name}</td>
                  <td style={styles.td}>{ship.type}</td>
                  <td style={styles.td}><span className="text-muted">{ship.status}</span></td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button className="btn-icon" style={{color: 'var(--color-primary)'}} onClick={() => handleOpenModal('kapal', ship)}><Edit2 size={16} /></button>
                      <button className="btn-icon" style={{color: 'var(--color-danger)'}} onClick={() => handleDelete('kapal', ship.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}

              {activeTab === 'klien' && clients.map(client => (
                <tr key={client.id} style={styles.tr}>
                  <td style={styles.td}>{client.code}</td>
                  <td style={styles.td}>{client.name}</td>
                  <td style={styles.td}>{client.type}</td>
                  <td style={styles.td}><span className="text-muted">{client.status}</span></td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button className="btn-icon" style={{color: 'var(--color-primary)'}} onClick={() => handleOpenModal('klien', client)}><Edit2 size={16} /></button>
                      <button className="btn-icon" style={{color: 'var(--color-danger)'}} onClick={() => handleDelete('klien', client.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}

              {activeTab === 'tarif' && tariffs.map(tarif => (
                <tr key={tarif.id} style={styles.tr}>
                  <td style={styles.td}>{tarif.code}</td>
                  <td style={styles.td}>{tarif.name}</td>
                  <td style={styles.td}>{tarif.description}</td>
                  <td style={styles.td}><span className="text-muted">{tarif.status}</span></td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button className="btn-icon" style={{color: 'var(--color-primary)'}} onClick={() => handleOpenModal('tarif', tarif)}><Edit2 size={16} /></button>
                      <button className="btn-icon" style={{color: 'var(--color-danger)'}} onClick={() => handleDelete('tarif', tarif.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {activeTab === 'tarif' && tariffs.length === 0 && (
                <tr style={styles.tr}>
                  <td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Data Tarif Belum Tersedia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="glass-panel">
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>
                {editId ? 'Edit Data ' : 'Tambah Data '}
                {modalType === 'kapal' ? 'Kapal' : 
                 modalType === 'klien' ? 'Klien' : 
                 modalType === 'pengguna' ? 'Staf' : 'Tarif & Pajak'}
              </h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveData} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Field Khusus Klien, Kapal, Tarif (Butuh Kode/ID) */}
              {(modalType === 'kapal' || modalType === 'klien' || modalType === 'tarif') && (
                <div>
                  <label style={styles.label}>Kode / ID</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.code} 
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder={modalType === 'kapal' ? 'SHP-00X' : modalType === 'klien' ? 'CLI-00X' : 'TRF-00X'}
                    required
                  />
                </div>
              )}

              {/* Field Nama selalu ada untuk semua tipe */}
              <div>
                <label style={styles.label}>
                  {modalType === 'pengguna' ? 'Nama Staf Lengkap' : 
                   modalType === 'tarif' ? 'Deskripsi / Nama Tarif' : 'Nama Lengkap'}
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Masukkan nama..."
                  required
                />
              </div>

              {/* Field Khusus Kapal dan Klien */}
              {(modalType === 'kapal' || modalType === 'klien') && (
                <div>
                  <label style={styles.label}>Tipe / Kategori</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.type} 
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    placeholder={modalType === 'kapal' ? 'General Cargo / Curah' : 'BUMN / Swasta'}
                  />
                </div>
              )}

              {/* Field Tambahan Khusus Kapal */}
              {modalType === 'kapal' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={styles.label}>Bendera</label>
                    <input 
                      type="text" className="input-field" value={formData.bendera} 
                      onChange={(e) => setFormData({...formData, bendera: e.target.value})}
                      placeholder="INDONESIA"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Nama Nakhoda</label>
                    <input 
                      type="text" className="input-field" value={formData.nakhoda} 
                      onChange={(e) => setFormData({...formData, nakhoda: e.target.value})}
                      placeholder="Nama Kapten"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Jumlah ABK (Orang)</label>
                    <input 
                      type="number" className="input-field" value={formData.abk} 
                      onChange={(e) => setFormData({...formData, abk: e.target.value})}
                      placeholder="Misal: 25"
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Asal Pelabuhan</label>
                    <input 
                      type="text" className="input-field" value={formData.asal_pelabuhan} 
                      onChange={(e) => setFormData({...formData, asal_pelabuhan: e.target.value})}
                      placeholder="Nama Pelabuhan"
                    />
                  </div>
                </div>
              )}

              {/* Field Tambahan Khusus Klien */}
              {modalType === 'klien' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div>
                    <label style={styles.label}>Alamat Lengkap</label>
                    <textarea 
                      className="input-field" value={formData.alamat} 
                      onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                      placeholder="Jalan, Kota, Kode Pos..."
                      style={{ width: '100%', minHeight: '60px', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Contact Person / Jabatan (Diwakili oleh)</label>
                    <input 
                      type="text" className="input-field" value={formData.contact_person} 
                      onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                      placeholder="Contoh: Budi Santoso - Direktur"
                    />
                  </div>
                </div>
              )}

              {/* Field Khusus Tarif (Keterangan Tambahan) */}
              {modalType === 'tarif' && (
                <div>
                  <label style={styles.label}>Keterangan Tambahan</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Contoh: Pajak Pertambahan Nilai 11%"
                  />
                </div>
              )}

              {/* Field Khusus Pengguna (Username & Role) */}
              {modalType === 'pengguna' && (
                <>
                  <div>
                    <label style={styles.label}>Username (Bisa untuk Login)</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={formData.username} 
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder="Contoh: andi.admin"
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Role Akses</label>
                    <select 
                      className="input-field" 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Tally Lapangan">Tally Lapangan</option>
                      <option value="Keuangan">Keuangan</option>
                      <option value="Supervisor">Supervisor</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label style={styles.label}>Status</label>
                <select 
                  className="input-field" 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Non-Aktif">Non-Aktif</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
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
    padding: '12px 16px',
    borderRadius: '8px',
    color: 'var(--color-text-secondary)',
    fontWeight: 600,
    transition: 'all var(--transition-fast)',
    fontSize: '0.9rem',
    border: 'none',
    cursor: 'pointer',
    background: 'transparent'
  },
  activeTab: {
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    boxShadow: 'var(--shadow-glow)',
  },
  cardTitle: {
    fontSize: '1.1rem',
    marginBottom: '20px',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' },
  tr: { borderBottom: '1px solid var(--color-border)' },
  td: { padding: '16px 12px' },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  modalContent: {
    width: '100%',
    maxWidth: '500px',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-lg)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 500,
    color: 'var(--color-text)'
  }
};
