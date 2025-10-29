import React from 'react'
import { RoutesProps, Routes, Route } from 'react-router-dom'
// import AdminList from 'src/screens/Admin/provider/List'
// import AdminView from 'src/screens/Admin/provider/View'
// import ProviderList from 'src/screens/Admin/provider/List'
// import ProviderView from 'src/screens/Admin/provider/View'
// import CategoryList from 'src/screens/Admin/provider/category/List'
// import EdditionList from 'src/screens/Admin/provider/eddition/List'
// import PhaseList from 'src/screens/Admin/provider/phase/List'
// import ParticipantList from 'src/screens/Admin/provider/participant/List'

const AdminProviderRoutes: React.FC<RoutesProps> = ({
  location,
}): React.ReactElement | null => {
  return (
    <Routes location={location}>
      {/* Provider Management Routes for Admin */}
      {/* Provider List - /admin-provider/provider */}
      <Route path='provider' element={<>Providers list</>} />
      
      {/* Provider Info - /admin-provider/provider/:id */}
      <Route path='provider/:id' element={<>Provider info</>} />
      
      {/* Providers Available - /admin-provider/provider/available */}
      <Route path='provider/available' element={<>Providers available</>} />
      
      {/* Provider Create - /admin-provider/provider/create */}
      <Route path='provider/create' element={<>Provider create</>} />
      
      {/* Provider Edit - /admin-provider/provider/edit/:id */}
      <Route path='provider/edit/:id' element={<>Provider edit</>} />
      
      {/* Provider Details - /admin-provider/provider/details/:id */}
      <Route path='provider/details/:id' element={<>Provider details</>} />
      
      {/* Provider Delete - /admin-provider/provider/delete/:id */}
      <Route path='provider/delete/:id' element={<>Provider delete</>} />
      
      {/* Provider Account Management */}
      {/* Account Edit - /admin-provider/provider/account/edit/:id */}
      <Route path='provider/account/edit/:id' element={<>Provider account edit</>} />
      
      {/* Account Delete - /admin-provider/provider/account/delete/:id */}
      <Route path='provider/account/delete/:id' element={<>Provider account delete</>} />
      
      {/* Provider Subscription Management */}
      {/* Update Subscription - /admin-provider/provider/sub_category/update-subscription/:id */}
      <Route path='provider/sub_category/update-subscription/:id' element={<>Provider sub_category update-subscription</>} />
    </Routes>
  )
}
export default AdminProviderRoutes
