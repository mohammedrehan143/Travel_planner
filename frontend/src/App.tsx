import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TripProvider } from './context/TripContext';
import { AppLayout } from './components/layout/AppLayout';
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
  return (
    <Routes>
      {/* Public Landing Page matching image.png & Auth */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />

      {/* Protected Workspace Pages inside AppLayout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/wizard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TripWizardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trip/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ItineraryPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
