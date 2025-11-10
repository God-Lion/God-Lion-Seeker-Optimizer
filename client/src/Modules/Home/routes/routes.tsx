import React from 'react'
import { Routes, Route, RoutesProps } from 'react-router-dom'
import Home from '../screens/Home'
import HomeNew from '../screens/HomeNew'


const HomeRoutes: React.FC<RoutesProps> = ({
  location,
}): React.ReactElement | null => {
  return (
    <Routes location={location}>
      {/* Main Home Route */}
      <Route path='/' element={<Home />} />
      <Route path='/homenew' element={<HomeNew />} />
      
      {/* Additional Home Routes (Uncomment as needed) */}
      {/* <Route path='features' element={<Features />} /> */}
      {/* <Route path='pricing' element={<Pricing />} /> */}
      {/* <Route path='contact' element={<Contact />} /> */}
    </Routes>
  )
}

export default HomeRoutes
