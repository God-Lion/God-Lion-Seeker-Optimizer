import React from 'react'
import { RoutesProps, Routes, Route } from 'react-router-dom'
import Dashboard from '../screens/Dashboard'
// import AdminView from 'src/screens/Admin/provider/View'
// import ProviderList from 'src/screens/Admin/provider/List'
// import ProviderView from 'src/screens/Admin/provider/View'
// import CategoryList from 'src/screens/Admin/provider/category/List'
// import EdditionList from 'src/screens/Admin/provider/eddition/List'
// import PhaseList from 'src/screens/Admin/provider/phase/List'
// import ParticipantList from 'src/screens/Admin/provider/participant/List'

const ProviderRoutes: React.FC<RoutesProps> = ({
  location,
}): React.ReactElement | null => {
  return (
    <Routes location={location}>
      {/* Provider Dashboard Route - /provider/dashboard */}
      <Route path='dashboard' element={<Dashboard />} />
      
      {/* Provider Delete Route - /provider/delete/:id */}
      <Route path='delete/:id' element={<>Provider delete</>} />
      
      {/* Provider Account Info Route - /provider/account/info */}
      <Route path='account/info' element={<>Provider account info</>} />
      
      {/* Provider Profile Update Route - /provider/profile/update */}
      <Route path='profile/update' element={<>Provider update</>} />
    </Routes>
  )
}
export default ProviderRoutes
