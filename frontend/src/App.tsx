import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Diamonds from './pages/Diamonds';
import AdminLayout from './layouts/AdminLayout';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="diamonds" element={<Diamonds />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
