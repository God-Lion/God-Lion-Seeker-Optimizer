import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ProfileManagement from '../screens/ProfileManagement'

const ProfileManagementRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path='/' element={<ProfileManagement />} />
    </Routes>
  )
}

export default ProfileManagementRoutes
