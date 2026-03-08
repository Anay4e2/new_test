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
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useNotificationSocket } from './hooks/useNotificationSocket';
import { useAuthStore } from './stores/authStore';
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
const VerifyOtp = lazy(() => import('./pages/VerifyOtp').then(m => ({ default: m.VerifyOtp })));
const Trains = lazy(() => import('./pages/Trains').then(m => ({ default: m.Trains })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const MyReviews = lazy(() => import('./pages/MyReviews').then(m => ({ default: m.MyReviews })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const TravelChecklist = lazy(() => import('./pages/TravelChecklist').then(m => ({ default: m.TravelChecklist })));
const Weather = lazy(() => import('./pages/Weather').then(m => ({ default: m.Weather })));
const Safety = lazy(() => import('./pages/Safety').then(m => ({ default: m.Safety })));
const Restaurants = lazy(() => import('./pages/Restaurants').then(m => ({ default: m.Restaurants })));
const FAQ = lazy(() => import('./pages/FAQ').then(m => ({ default: m.FAQ })));
const Services = lazy(() => import('./pages/Services').then(m => ({ default: m.Services })));
const Help = lazy(() => import('./pages/Help').then(m => ({ default: m.Help })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));

const KeyboardNav: FC = () => {
  const navigate = useNavigate();
  useKeyboardShortcuts(navigate);
  return null;
};

const App: FC = () => {
  const token = useAuthStore(s => s.token);
  useNotificationSocket(token);

  return (
    <>
      <Toaster position="top-right" />
      <OfflineIndicator />
      <ErrorBoundary>
      <Router>
        <SkipToContent />
        <Navbar />
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
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/trains" element={<Trains />} />
          <Route path="/about" element={<About />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/services" element={<Services />} />
          <Route path="/help" element={<Help />} />
          <Route path="/contact" element={<Contact />} />

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
        <Footer />
      </Router>
      </ErrorBoundary>
    </>
  );
};

export default App;
