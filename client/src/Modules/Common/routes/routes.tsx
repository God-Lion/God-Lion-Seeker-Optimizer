/**
 * Common Module Routes
 * 
 * Routes for shared/common pages like feature comparison
 */

import React from 'react'
import { Route, Routes } from 'react-router-dom'
import FeatureComparison from '../screens/FeatureComparison'

const CommonRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/features" element={<FeatureComparison />} />
    </Routes>
  )
}

export default CommonRoutes
