import { FC, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Explore } from './pages/Explore';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SkipToContent } from './components/common/SkipToContent';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { NotFound } from './pages/NotFound';
import { Toaster } from 'react-hot-toast';

// Lazy-loaded pages
const Planner = lazy(() => import('./pages/Planner').then(m => ({ default: m.Planner })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const AdminLogin = lazy(() => import('./pages/AdminLogin').then(m => ({ default: m.AdminLogin })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const SharedTrip = lazy(() => import('./pages/SharedTrip').then(m => ({ default: m.SharedTrip })));
const Festivals = lazy(() => import('./pages/Festivals').then(m => ({ default: m.Festivals })));
const GroupTrip = lazy(() => import('./pages/GroupTrip').then(m => ({ default: m.GroupTrip })));
const Notifications = lazy(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })));
const Journal = lazy(() => import('./pages/Journal').then(m => ({ default: m.Journal })));
const Packages = lazy(() => import('./pages/Packages').then(m => ({ default: m.Packages })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const Trains = lazy(() => import('./pages/Trains').then(m => ({ default: m.Trains })));
const MyReviews = lazy(() => import('./pages/MyReviews').then(m => ({ default: m.MyReviews })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const TravelChecklist = lazy(() => import('./pages/TravelChecklist').then(m => ({ default: m.TravelChecklist })));

const KeyboardNav: FC = () => {
  const navigate = useNavigate();
  useKeyboardShortcuts(navigate);
  return null;
};

const App: FC = () => {
  return (
    <>
      <Toaster position="top-right" />
      <OfflineIndicator />
      <ErrorBoundary>
      <Router>
        <SkipToContent />
        <KeyboardNav />
        <main id="main-content">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/trip/:shareId" element={<SharedTrip />} />
          <Route path="/festivals" element={<Festivals />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/trains" element={<Trains />} />

          {/* Protected routes — require authentication */}
          <Route path="/plan" element={<ProtectedRoute><Planner /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/journal/:tripId" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
          <Route path="/group/:groupId" element={<ProtectedRoute><GroupTrip /></ProtectedRoute>} />
          <Route path="/my-reviews" element={<ProtectedRoute><MyReviews /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/checklist" element={<ProtectedRoute><TravelChecklist /></ProtectedRoute>} />

          {/* Admin route — requires admin role */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </main>
      </Router>
      </ErrorBoundary>
    </>
  );
};

export default App;
