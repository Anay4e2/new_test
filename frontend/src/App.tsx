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
import { OfflineIndicator } from './components/common/OfflineIndicator';

const App: FC = () => {
  return (
    <>
      <OfflineIndicator />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plan" element={<Planner />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trip/:shareId" element={<SharedTrip />} />
          <Route path="/festivals" element={<Festivals />} />
        </Routes>
      </Router>
    </>
  );
};

export default App;

