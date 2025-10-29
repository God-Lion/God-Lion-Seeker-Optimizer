import React from 'react'
import { Routes, Route, RoutesProps } from 'react-router-dom'
import Home from '../screens/Home'

/**
 * =============================================================================
 * HOME MODULE ROUTES
 * =============================================================================
 * Handles all home/landing page routes
 */

const HomeRoutes: React.FC<RoutesProps> = ({
  location,
}): React.ReactElement | null => {
  return (
    <Routes location={location}>
      {/* Main Home Route */}
      <Route path='/' element={<Home />} />
      
      {/* Additional Home Routes (Uncomment as needed) */}
      {/* <Route path='about' element={<About />} /> */}
      {/* <Route path='features' element={<Features />} /> */}
      {/* <Route path='pricing' element={<Pricing />} /> */}
      {/* <Route path='contact' element={<Contact />} /> */}
    </Routes>
  )
}

export default HomeRoutes
