import React from 'react'
import { RoutesProps, Routes, Route } from 'react-router-dom'
import Dashboard from '../screens/Dashboard'

const DashboardRoutes: React.FC<RoutesProps> = ({
  location,
}): React.ReactElement | null => {
  return (
    <Routes location={location}>
      {/* Dashboard Index Route - /dashboard */}
      <Route index element={<Dashboard />} />
      
      {/* Dashboard Overview Route - /dashboard/overview */}
      <Route path='overview' element={<Dashboard />} />
    </Routes>
  )
}

export default DashboardRoutes
