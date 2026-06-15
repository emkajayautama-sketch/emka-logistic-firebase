import React, { useState, useEffect } from 'react';
import { Ship, Anchor, TrendingUp, PackageSearch, Clock, ShieldCheck, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../config/supabaseClient';

export default function Dashboard() {
  const [stats, setStats] = useState({
    ships: 0,
    pbmTon: 0,
    revenue: 0,
    jptManifest: 0
  });
  
  const [gateLogs, setGateLogs] = useState([]);
  const [monthlyData, setMonthlyData] = useState([
    { name: 'Jan', pbm: 0, jpt: 0 },
    { name: 'Feb', pbm: 0, jpt: 0 },
    { name: 'Mar', pbm: 0, jpt: 0 },
    { name: 'Apr', pbm: 0, jpt: 0 },
    { name: 'Mei', pbm: 0, jpt: 0 },
    { name: 'Jun', pbm: 0, jpt: 0 }
  ]);

  useEffect(() => {
    fetchStats();
    fetchGateLogs();
    
    // Setup Realtime Subscription for Gate Logs to make the dashboard "Alive"
    const gateSubscription = supabase
      .channel('public:gate_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gate_logs' }, payload => {
        fetchGateLogs();
        fetchStats(); // Update stats if there are changes
      })
      .subscribe();
      
    const tallySubscription = supabase
      .channel('public:pbm_tally_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pbm_tally_logs' }, payload => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(gateSubscription);
      supabase.removeChannel(tallySubscription);
    };
  }, []);

  const fetchStats = async () => {
    try {
      // Kunjungan Kapal (Active PBM Plans)
      const { data: plans } = await supabase.from('pbm_plans').select('id');
      
      // Total Tonase PBM (All Tally Logs)
      const { data: tallies } = await supabase.from('pbm_tally_logs').select('tonnage');
      const totalTonnage = tallies ? tallies.reduce((sum, t) => sum + Number(t.tonnage), 0) : 0;
      
      // JPT Manifests
      const { data: manifests } = await supabase.from('manifests').select('id');
      
      // Estimasi Pendapatan (Dummy calculation: Rp 50.000 per ton)
      const estimatedRevenue = totalTonnage * 50000;

      setStats({
        ships: plans ? plans.length : 0,
        pbmTon: totalTonnage,
        revenue: estimatedRevenue,
        jptManifest: manifests ? manifests.length : 0
      });

      // Fetch monthly data for current year
      const currentYear = new Date().getFullYear();
      const { data: monthlyTallies } = await supabase
        .from('pbm_tally_logs')
        .select('tonnage, created_at')
        .gte('created_at', `${currentYear}-01-01T00:00:00Z`);
        
      if (monthlyTallies) {
        const newData = [...monthlyData];
        // Reset current values
        newData.forEach(d => d.pbm = 0);
        
        monthlyTallies.forEach(t => {
          const monthIndex = new Date(t.created_at).getMonth();
          if (monthIndex < 6) { // Only first 6 months for demo
            newData[monthIndex].pbm += Number(t.tonnage);
          }
        });
        setMonthlyData(newData);
      }

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchGateLogs = async () => {
    try {
      const { data } = await supabase
        .from('gate_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (data) setGateLogs(data);
    } catch (error) {
      console.error('Error fetching gate logs:', error);
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Executive Dashboard</h1>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>Sistem Informasi Layanan Operasional Pelabuhan Terpadu</p>
        </div>
        <div className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '1rem' }}>
          <Activity size={18} className="pulse" />
          Live Server Connected
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '30px' }}>
        <div className="card stat-card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)' }}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
            <Ship size={24} />
          </div>
          <div>
            <p className="stat-title">Kunjungan Kapal (RBM)</p>
            <h3 className="stat-value">{stats.ships} <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>Call</span></h3>
          </div>
        </div>

        <div className="card stat-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)' }}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
            <Anchor size={24} />
          </div>
          <div>
            <p className="stat-title">Volume PBM Terdata</p>
            <h3 className="stat-value">{stats.pbmTon.toLocaleString('id-ID')} <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>Ton</span></h3>
          </div>
        </div>

        <div className="card stat-card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)' }}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
            <PackageSearch size={24} />
          </div>
          <div>
            <p className="stat-title">Dokumen JPT (Manifest)</p>
            <h3 className="stat-value">{stats.jptManifest} <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>Dokumen</span></h3>
          </div>
        </div>

        <div className="card stat-card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(109, 40, 217, 0.05) 100%)' }}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="stat-title">Estimasi Pendapatan</p>
            <h3 className="stat-value" style={{ fontSize: '1.8rem' }}>{formatRupiah(stats.revenue)}</h3>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        
        {/* Main Chart */}
        <div className="card glass-panel" style={{ gridColumn: 'span 8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Tren Volume Bongkar Muat (Tonase)</h3>
            <select className="input" style={{ padding: '8px', border: 'none', background: 'var(--color-bg)' }}>
              <option>Tahun 2026</option>
              <option>Tahun 2025</option>
            </select>
          </div>
          <div style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-muted)" tick={{ fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" tick={{ fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--color-text-primary)' }}
                />
                <Bar dataKey="pbm" name="PBM (Ton)" fill="url(#colorPbm)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="jpt" name="JPT (Ton)" fill="url(#colorJpt)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="colorPbm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="colorJpt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Gate Feed */}
        <div className="card glass-panel" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="var(--color-warning)" /> Gate Live Feed
            </h3>
            <span className="pulse" style={{ width: '10px', height: '10px', backgroundColor: 'var(--color-danger)', borderRadius: '50%' }}></span>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            {gateLogs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '40px' }}>Belum ada aktivitas gerbang.</div>
            ) : (
              gateLogs.map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', 
                    backgroundColor: log.status === 'DI DALAM PELABUHAN' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                  }}>
                    <Clock size={18} color={log.status === 'DI DALAM PELABUHAN' ? '#3b82f6' : '#10b981'} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{log.truck_plate}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {log.document_number} • {log.commodity}
                    </p>
                    <div style={{ marginTop: '8px' }}>
                      <span className={`badge ${log.status === 'DI DALAM PELABUHAN' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.75rem' }}>
                        {log.status === 'DI DALAM PELABUHAN' ? `GATE IN: ${new Date(log.gate_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : `GATE OUT: ${log.netto_weight} Kg`}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
        </div>

      </div>
    </div>
  );
}
