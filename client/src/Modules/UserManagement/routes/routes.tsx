import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UserManagement from '../screens/UserManagement';

const UserManagementRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path='/' element={<UserManagement />} />
    </Routes>
  );
};

export default UserManagementRoutes;
