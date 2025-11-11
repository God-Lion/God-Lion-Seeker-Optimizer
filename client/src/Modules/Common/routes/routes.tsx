/**
 * Common Module Routes
 * 
 * Routes for shared/common pages like feature comparison
 */

import React from 'react'
import { Route, Routes } from 'react-router-dom'
import FeatureComparison from '../screens/FeatureComparison'
import PrivacyPolicy from '../screens/PrivacyPolicy'
import TermsOfService from '../screens/TermsOfService'
import ContactUs from '../screens/ContactUs'
import AboutUs from '../screens/AboutUs'
import Pricing from '../screens/Pricing'

const CommonRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/features" element={<FeatureComparison />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/pricing" element={<Pricing />} />
    </Routes>
  )
}

export default CommonRoutes
