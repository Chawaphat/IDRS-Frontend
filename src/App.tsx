import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '@/pages/Landing';
import AuthPage from '@/pages/Auth';
import PatientsPage from '@/pages/Patients';
import PatientEntryPage from '@/pages/PatientEntry';
import PatientProfilePage from '@/pages/PatientProfile';
import PatientDetailPage from '@/pages/PatientDetail';
import AIAnalysisPage from '@/pages/AIAnalysis';
import SettingsPage from '@/pages/Settings';
import MainLayout from '@/components/MainLayout';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import ToastContainer from '@/components/ToastContainer';
import ConfirmationModal from '@/components/ConfirmationModal';


// Protected Route Guard
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuthStore();

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Guard (prevents logged in users from visiting auth pages)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuthStore();
  const { show: showToast } = useToastStore();
  const hasShownToast = React.useRef(false);

  // Toast is now handled by the destination page via location state

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/patients" state={{ showLoginSuccess: true }} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <ToastContainer />
      <ConfirmationModal />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/auth/login" 
          element={
            <PublicRoute>
              <AuthPage mode="login" />
            </PublicRoute>
          } 
        />
        <Route 
          path="/auth/register" 
          element={
            <PublicRoute>
              <AuthPage mode="register" />
            </PublicRoute>
          } 
        />
        <Route 
          path="/patients" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <PatientsPage />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/patients/:id" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <PatientProfilePage />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/patients/:id/charts/:chartId" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <PatientDetailPage />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/patient-entry" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <PatientEntryPage />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ai-analysis" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <AIAnalysisPage />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <SettingsPage />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
