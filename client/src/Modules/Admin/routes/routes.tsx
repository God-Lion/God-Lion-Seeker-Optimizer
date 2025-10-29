import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from '../Dashboard/screens/AdminDashboard';
import UserManagement from '../UserManagement/screens/UserManagement';
import ContentModeration from '../ContentModeration/screens/ContentModeration';
import SecurityLogs from '../SecurityLogs/screens/SecurityLogs';
import Analytics from '../Analytics/screens/Analytics';

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Redirect /admin to /admin/dashboard */}
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      
      {/* Admin Dashboard */}
      <Route path="/dashboard" element={<AdminDashboard />} />
      
      {/* User Management */}
      <Route path="/users" element={<UserManagement />} />
      <Route path="/users/:id" element={<UserManagement />} />
      
      {/* Content Moderation */}
      <Route path="/moderation" element={<ContentModeration />} />
      
      {/* Security Logs */}
      <Route path="/security-logs" element={<SecurityLogs />} />
      
      {/* Analytics */}
      <Route path="/analytics" element={<Analytics />} />
      
      {/* 404 - Not Found */}
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
