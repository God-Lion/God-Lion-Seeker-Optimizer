import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ProfileManagement from '../screens/ProfileManagement'
import MyCVs from '../screens/MyCVs'
import UserProfile from '../screens/UserProfile'

const ProfileManagementRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path='/' element={<ProfileManagement />} />
      <Route path='/my-cvs' element={<MyCVs />} />
      <Route path='/user-profile' element={<UserProfile />} />
    </Routes>
  )
}

export default ProfileManagementRoutes