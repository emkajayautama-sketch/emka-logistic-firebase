import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OperasionalJPT from './pages/OperasionalJPT';
import OperasionalPBM from './pages/OperasionalPBM';
import GateScanner from './pages/GateScanner';
import InaportnetAccess from './pages/InaportnetAccess';
import LaporanRegulasi from './pages/LaporanRegulasi';
import BiroKeuangan from './pages/BiroKeuangan';
import MasterData from './pages/MasterData';
import LandingPage from './pages/LandingPage';

// Komponen untuk melindungi rute internal
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/operasional-jpt" element={<OperasionalJPT />} />
        <Route path="/operasional-pbm" element={<OperasionalPBM />} />
        <Route path="/gate-scanner" element={<GateScanner />} />
        <Route path="/inaportnet" element={<InaportnetAccess />} />
        <Route path="/laporan" element={<LaporanRegulasi />} />
        <Route path="/keuangan" element={<BiroKeuangan />} />
        <Route path="/master-data" element={<MasterData />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
