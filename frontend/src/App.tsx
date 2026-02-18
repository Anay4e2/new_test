import { FC } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Planner } from './pages/Planner';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Admin } from './pages/Admin';
import { AdminLogin } from './pages/AdminLogin';
import { Dashboard } from './pages/Dashboard';
import { SharedTrip } from './pages/SharedTrip';
import { Festivals } from './pages/Festivals';
import { GroupTrip } from './pages/GroupTrip';
import { Explore } from './pages/Explore';
import { Notifications } from './pages/Notifications';
import { Journal } from './pages/Journal';
import { Packages } from './pages/Packages';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { ProtectedRoute } from './components/common/ProtectedRoute';

const App: FC = () => {
  return (
    <>
      <OfflineIndicator />
      <Router>
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

          {/* Protected routes — require authentication */}
          <Route path="/plan" element={<ProtectedRoute><Planner /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/journal/:tripId" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
          <Route path="/group/:groupId" element={<ProtectedRoute><GroupTrip /></ProtectedRoute>} />

          {/* Admin route — requires admin role */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
        </Routes>
      </Router>
    </>
  );
};

export default App;
