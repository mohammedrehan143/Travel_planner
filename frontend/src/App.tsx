import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TripProvider } from './context/TripContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
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

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <TripProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
            <Navbar />
            <main className="flex-1">
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
            <Footer />
          </div>
        </Router>
      </TripProvider>
    </AuthProvider>
  );
};

export default App;
