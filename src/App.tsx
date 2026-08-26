import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AppProvider } from './context/AppContext';
import Toast from './components/Toast';
import type { ToastItem } from './context/AppContext';
import { useState } from 'react';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import ClubsPage from './pages/ClubsPage';
import ProjectsPage from './pages/ProjectsPage';
import MentorsPage from './pages/MentorsPage';
import EventsPage from './pages/EventsPage';
import JobsPage from './pages/JobsPage';
import OpportunitiesPage from './pages/Opportunities';
import ResourcesPage from './pages/ResourcesPage';
import MessagesPage from './pages/MessagesPage';
import MyProfile from './pages/MyProfile';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage';
import JDAnalyzerPage from './pages/JDAnalyzerPage';

function AppLoader() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-[#9E2A2B] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Loading Communities...</p>
      </div>
    </div>
  );
}

function LoginGate() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (message: string, type: 'success' | 'info' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  return (
    <>
      <Login onLoginSuccess={() => {}} onAddToast={addToast} />
      <Toast toasts={toasts} removeToast={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </>
  );
}

function AuthenticatedRoutes() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/clubs" element={<ClubsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/mentors" element={<MentorsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/jobs" element={
            <ProtectedRoute allowedRoles={['student', 'alumni', 'admin']}>
              <JobsPage />
            </ProtectedRoute>
          } />
          <Route path="/opportunities" element={
            <ProtectedRoute allowedRoles={['alumni', 'admin']}>
              <OpportunitiesPage />
            </ProtectedRoute>
          } />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/resume" element={
            <ProtectedRoute allowedRoles={['student']}>
              <ResumeAnalyzerPage />
            </ProtectedRoute>
          } />
          <Route path="/jd-ranker" element={
            <ProtectedRoute allowedRoles={['alumni', 'admin']}>
              <JDAnalyzerPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={<MyProfile />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}

function RootRouter() {
  const { session, loading } = useAuth();

  if (loading) return <AppLoader />;
  if (!session) return <LoginGate />;

  return <AuthenticatedRoutes />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RootRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
