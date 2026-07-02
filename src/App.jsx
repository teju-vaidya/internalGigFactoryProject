import './App.css';
import { BrowserRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React, { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';

/* ── Public pages ── */
import Login from './pages/Login/Login.jsx';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword.jsx';
import ResetPassword from './pages/ForgotPassword/ResetPassword.jsx';
import AdminLogin from './pages/Admin/AdminLogin.jsx';
import NotFound from './pages/NotFound/NotFound.jsx';
import PublicBrowseProjects from './pages/BrowseProjects/PublicBrowseProjects.jsx';
import PublicProjectDetail from './pages/BrowseProjects/PublicProjectDetail.jsx';
import PublicLayout from './components/Layout/PublicLayout.jsx';


/* ── Authenticated pages ── */
import { Dashboard } from './pages/Dashboard/Dashboard.jsx';
import { Profile } from './pages/Profile/Profile.jsx';
import { ActiveProjects } from './pages/ActiveProject/ActiveProject.jsx';
import { Team } from './pages/Team/Team.jsx';
import UserSettings from './pages/UserSettings/UserSettings.jsx';
import BrowseProjects from './pages/BrowseProjects/BrowseProjects.jsx';
import ProjectDetail from './pages/BrowseProjects/ProjectDetail.jsx';
import MyApplications from './pages/MyApplications/MyApplications.jsx';


/* ── Admin pages ── */
import AdminOverview from './pages/Admin/AdminOverview.jsx';
import RegistrationRequests from './pages/Admin/RegistrationRequests.jsx';
import AdminGigExperts from './pages/Admin/AdminGigExperts.jsx';
import AdminAgencies from './pages/Admin/AdminAgencies.jsx';
import AdminUserProfile from './pages/Admin/AdminUserProfile.jsx';
import AdminSettings from './pages/Admin/AdminSettings.jsx';
import AdminAnalytics from './pages/Admin/AdminAnalytics.jsx';
import AdminActivities from './pages/Admin/AdminActivities.jsx';
import AdminCommunication from './pages/Admin/AdminCommunication.jsx';
import ProjectDetailView from './components/Admin/ProjectDetailView.jsx';

/* ── Layout ── */
import AppLayout from './components/Layout/AppLayout.jsx';
import Maintenance from './pages/Maintenance/Maintenance.jsx';
import AdminProjects from './pages/Admin/AdminProjects.jsx';

/* ─────────────────────────────────────────────────────────────── */
/* Route guards                                                     */
/* ─────────────────────────────────────────────────────────────── */

const PrivateRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const profileError = useAuthStore((state) => state.profileError);
  const location = useLocation();

  if (!token || !user) return <Navigate to="/" replace />;

  // Wait for profile to load for non-admin users
  if (user.role !== 'admin' && !profile && !profileError) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0c0c0e]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#70d64d]"></div>
          <span className="text-gray-400 text-sm">Verifying profile completion...</span>
        </div>
      </div>
    );
  }

  // Enforce redirection to profile page if profile completion is <= 70%
  if (user.role !== 'admin' && profile && (profile.profile_completion ?? 0) <= 70) {
    if (location.pathname !== '/profile') {
      return <Navigate to="/profile" replace />;
    }
  }

  return children;
};

const AdminRoute = ({ children, title }) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  if (!token || !user) return <Navigate to="/admin" replace />;
  return (
    <AppLayout pageTitle={title}>
      {children}
    </AppLayout>
  );
};

/* ─────────────────────────────────────────────────────────────── */
function App() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const fetchPublicSettings = useAuthStore((state) => state.fetchPublicSettings);
  const maintenanceMode = useAuthStore((state) => state.maintenanceMode);
  const sessionTimeoutMins = useAuthStore((state) => state.sessionTimeoutMins) || 60;
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    fetchPublicSettings();
  }, [fetchPublicSettings]);

  useEffect(() => {
    if (token && user) {
      fetchProfile();
    }
  }, [token, user, fetchProfile]);

  useEffect(() => {
    if (!token || !user) return;

    let timeoutId;
    const timeoutMs = sessionTimeoutMins * 60 * 1000;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        clearAuth();
        toast.warn('Your session has expired due to inactivity. Please log in again.');
      }, timeoutMs);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [token, user, sessionTimeoutMins, clearAuth]);

  if (maintenanceMode && user?.role !== 'admin' && window.location.pathname !== '/admin') {
    return <Maintenance />;
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public auth routes ── */}
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ── Public catalog & detail routes ── */}
        <Route path="/public-projects" element={
          <PublicLayout>
            <PublicBrowseProjects />
          </PublicLayout>
        } />
        <Route path="/public-projects/:id" element={
          <PublicLayout>
            <PublicProjectDetail />
          </PublicLayout>
        } />

        {/* ── Admin login (separate branded page) ── */}
        <Route path="/admin" element={<AdminLogin />} />

        {/* ── Admin protected routes ── */}
        <Route path="/admin/dashboard" element={
          <AdminRoute title="Dashboard">
            <AdminOverview />
          </AdminRoute>
        } />
        <Route path="/admin/requests" element={
          <AdminRoute title="Registration Requests">
            <RegistrationRequests />
          </AdminRoute>
        } />
        <Route path="/admin/gigExperts" element={
          <AdminRoute title="Gig Experts">
            <AdminGigExperts />
          </AdminRoute>
        } />
        <Route path="/admin/agencies" element={
          <AdminRoute title="Agencies">
            <AdminAgencies />
          </AdminRoute>
        } />

        <Route path="/admin/projects" element={
          <AdminRoute title="Projects">
            <AdminProjects />
          </AdminRoute>
        } />
        <Route path="/admin/projects/:id" element={
          <AdminRoute title="Project Details">
            <ProjectDetailView />
          </AdminRoute>
        } />
        <Route path="/admin/users/:id/profile" element={
          <AdminRoute title="User Profile">
            <AdminUserProfile />
          </AdminRoute>
        } />
        <Route path="/admin/settings" element={
          <AdminRoute title="Settings">
            <AdminSettings />
          </AdminRoute>
        } />
        <Route path="/admin/analytics" element={
          <AdminRoute title="Analytics">
            <AdminAnalytics />
          </AdminRoute>
        } />
        <Route path="/admin/activities" element={
          <AdminRoute title="System Activities">
            <AdminActivities />
          </AdminRoute>
        } />
        <Route path="/admin/communication" element={
          <AdminRoute title="Communication">
            <AdminCommunication />
          </AdminRoute>
        } />

        {/* ── Regular user protected routes ── */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <AppLayout pageTitle="Dashboard">
              <Dashboard />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <AppLayout pageTitle="My Profile">
              <Profile />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/activeProject" element={
          <PrivateRoute>
            <AppLayout pageTitle="Active Projects">
              <ActiveProjects />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/team" element={
          <PrivateRoute>
            <AppLayout pageTitle="My Team">
              <Team />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute>
            <AppLayout pageTitle="Settings">
              <UserSettings />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/projects" element={
          <PrivateRoute>
            <AppLayout pageTitle="Browse Projects">
              <BrowseProjects />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/projects/:id" element={
          <PrivateRoute>
            <AppLayout pageTitle="Project Detail">
              <ProjectDetail />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/applications" element={
          <PrivateRoute>
            <AppLayout pageTitle="My Applications">
              <MyApplications />
            </AppLayout>
          </PrivateRoute>
        } />

        {/* ── Catch-all ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer position="bottom-right" theme="dark" />
    </BrowserRouter>
  );
}

export default App;
