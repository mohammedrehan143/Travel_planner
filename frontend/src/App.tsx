import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TripProvider } from './context/TripContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AIAgentsModal } from './components/home/AIAgentsModal';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { TripWizardPage } from './pages/TripWizardPage';
import { ItineraryPage } from './pages/ItineraryPage';
import { DashboardSkeleton } from './components/common/LoadingSkeleton';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  const [isAgentsModalOpen, setIsAgentsModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-neutral-900 font-sans antialiased selection:bg-[#16A34A] selection:text-white">
      {/* Top Navigation Bar matching image.png (no sidebar) */}
      <Navbar onOpenAgents={() => setIsAgentsModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        <Routes>
          {/* Public Landing & Auth */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected Workspace Pages */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wizard"
            element={
              <ProtectedRoute>
                <TripWizardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trip/:id"
            element={
              <ProtectedRoute>
                <ItineraryPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Bottom Footer */}
      <Footer />

      {/* AI Agents Modal (when clicked from Navbar) */}
      <AIAgentsModal
        isOpen={isAgentsModalOpen}
        onClose={() => setIsAgentsModalOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <TripProvider>
        <Router>
          <AppContent />
        </Router>
      </TripProvider>
    </AuthProvider>
  );
};

export default App;
