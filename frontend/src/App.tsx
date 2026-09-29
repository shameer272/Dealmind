import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { SearchModal } from './components/SearchModal';
import { Dashboard } from './pages/Dashboard';
import { DealsList } from './pages/DealsList';
import { DealDetail } from './pages/DealDetail';
import { CustomerMemory } from './pages/CustomerMemory';
import { MemoryImpact } from './pages/MemoryImpact';
import { MeetingPrep } from './pages/MeetingPrep';
import { ObjectionRadar } from './pages/ObjectionRadar';
import { LearningCurve } from './pages/LearningCurve';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

const AuthenticatedLayout: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();

  const { user } = useAuth();
  const handleLaunchDemo = () => {
    if (user?.organization_id === 'org_acme') {
      navigate('/deals/deal_acme_flagship');
    } else {
      navigate('/deals');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar with Real User Profile */}
        <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          onLaunchDemo={handleLaunchDemo}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/deals" element={<DealsList />} />
            <Route path="/deals/:id" element={<DealDetail />} />
            <Route path="/memory" element={<CustomerMemory />} />
            <Route path="/memory-impact" element={<MemoryImpact />} />
            <Route path="/prepare-me" element={<MeetingPrep />} />
            <Route path="/objections" element={<ObjectionRadar />} />
            <Route path="/learning-curve" element={<LearningCurve />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
