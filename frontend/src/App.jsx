import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OTPVerifyPage } from './pages/OTPVerifyPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { FindDonorsPage } from './pages/FindDonorsPage';
import { RequestBloodPage } from './pages/RequestBloodPage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { InvitationsPage } from './pages/InvitationsPage';
import { DonationHistoryPage } from './pages/DonationHistoryPage';
import { RequestHistoryPage } from './pages/RequestHistoryPage';
import { DonorAvailabilityPage } from './pages/DonorAvailabilityPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { IntegrationGuidePage } from './pages/IntegrationGuidePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-600 text-white font-black text-2xl flex items-center justify-center mx-auto mb-3 animate-bounce">
            🩸
          </div>
          <p className="text-xs font-semibold text-slate-500">Loading LifeLink Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export const App = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route path="/verify-otp" element={<OTPVerifyPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected Dashboard Pages */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/find-donors" element={<FindDonorsPage />} />
        <Route path="/request-blood" element={<RequestBloodPage />} />
        <Route path="/my-requests" element={<MyRequestsPage />} />
        <Route path="/invitations" element={<InvitationsPage />} />
        <Route path="/donation-history" element={<DonationHistoryPage />} />
        <Route path="/request-history" element={<RequestHistoryPage />} />
        <Route path="/availability" element={<DonorAvailabilityPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/integration-guide" element={<IntegrationGuidePage />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
