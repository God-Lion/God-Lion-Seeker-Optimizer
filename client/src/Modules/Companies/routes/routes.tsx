import React from 'react'
import { Routes, Route, RoutesProps } from 'react-router-dom'
import Companies from '../screens/Companies'

/**
 * =============================================================================
 * COMPANIES MODULE ROUTES
 * =============================================================================
 * Handles all company-related routes
 */

const CompaniesRoutes: React.FC<RoutesProps> = ({
  location,
}): React.ReactElement | null => {
  return (
    <Routes location={location}>
      {/* Companies Index Route - /companies */}
      <Route index element={<Companies />} />
      
      {/* Additional Company Routes (Uncomment as needed) */}
      {/* <Route path=':companyId' element={<CompanyDetails />} /> */}
      {/* <Route path='search' element={<CompanySearch />} /> */}
      {/* <Route path='favorites' element={<FavoriteCompanies />} /> */}
    </Routes>
  )
}

export default CompaniesRoutes
