import React from 'react'
import { RoutesProps, Routes, Route, Navigate } from 'react-router-dom'
import AdminDashboard from 'src/Modules/Admin/Dashboard/screens/AdminDashboard'
// import AdminList from 'src/screens/Admin/provider/List'
// import AdminView from 'src/screens/Admin/provider/View'
// import ProviderList from 'src/screens/Admin/provider/List'
// import ProviderView from 'src/screens/Admin/provider/View'
// import CategoryList from 'src/screens/Admin/provider/category/List'
// import EdditionList from 'src/screens/Admin/provider/eddition/List'
// import PhaseList from 'src/screens/Admin/provider/phase/List'
// import ParticipantList from 'src/screens/Admin/provider/participant/List'

const AdminRoutes: React.FC<RoutesProps> = ({
  location,
}): React.ReactElement | null => {
  return (
    <Routes location={location}>
      {/* Default redirect to dashboard */}
      <Route index element={<Navigate to="dashboard" replace />} />
      
      {/* Admin Dashboard Route - /admin/dashboard */}
      <Route path='dashboard' element={<AdminDashboard />} />
      
      {/* Admin Profile Update Route - /admin/profile/update */}
      <Route path='profile/update' element={<>Admin update</>} />
      
      {/* Admin Role Management Routes */}
      {/* Role List - /admin/role */}
      <Route path='role' element={<>Admin role list</>} />
      
      {/* Role Create - /admin/role/create */}
      <Route path='role/create' element={<>Admin create role</>} />
      
      {/* Role Edit - /admin/role/edit/:id */}
      <Route path='role/edit/:id' element={<>Admin edit role</>} />
      
      {/* Role Delete - /admin/role/delete/:id */}
      <Route path='role/delete/:id' element={<>Admin delete role</>} />
      
      {/* Role Status Update - /admin/role/status/:id */}
      <Route path='role/status/:id' element={<>Admin role status update status</>} />
    </Routes>
  )
}
export default AdminRoutes
