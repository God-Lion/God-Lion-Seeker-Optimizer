import React from 'react'
import { RoutesProps, Routes, Route } from 'react-router-dom'
import ScrapeJobs from '../screens/ScrapeJobs'

const ScraperRoutes: React.FC<RoutesProps> = ({
  location,
}): React.ReactElement | null => {
  return (
    <Routes location={location}>
      {/* Scraper Index Route - /scraper */}
      <Route index element={<ScrapeJobs />} />
      
      {/* Scraper Jobs Route - /scraper/jobs */}
      <Route path='jobs' element={<ScrapeJobs />} />
    </Routes>
  )
}

export default ScraperRoutes
