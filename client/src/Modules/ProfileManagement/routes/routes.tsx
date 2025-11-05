import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ProfileManagement from '../screens/ProfileManagement'
import MyCVs from '../screens/MyCVs'

const ProfileManagementRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path='/' element={<ProfileManagement />} />
      <Route path='/my-cvs' element={<MyCVs />} />
    </Routes>
  )
}

export default ProfileManagementRoutes
