import React from 'react'
import { RoutesProps, Routes, Route } from 'react-router-dom'
import Statistics from '../screens/Statistics'

const StatisticsRoutes: React.FC<RoutesProps> = ({
  location,
}): React.ReactElement | null => {
  return (
    <Routes location={location}>
      {/* Statistics Index Route - /statistics */}
      <Route index element={<Statistics />} />
      
      {/* Statistics Analytics Route - /statistics/analytics */}
      <Route path='analytics' element={<Statistics />} />
    </Routes>
  )
}

export default StatisticsRoutes
