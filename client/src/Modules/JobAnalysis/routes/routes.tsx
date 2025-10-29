import React from 'react'
import { Routes, Route, RoutesProps } from 'react-router-dom'
import JobAnalysis from '../screens/JobAnalysis'

/**
 * =============================================================================
 * JOB ANALYSIS MODULE ROUTES
 * =============================================================================
 * Handles all job analysis-related routes
 */

const JobAnalysisRoutes: React.FC<RoutesProps> = ({
  location,
}): React.ReactElement | null => {
  return (
    <Routes location={location}>
      {/* Job Analysis Index Route - /job-analysis */}
      <Route index element={<JobAnalysis />} />
      
      {/* Additional Job Analysis Routes (Uncomment as needed) */}
      {/* <Route path='trends' element={<JobTrends />} /> */}
      {/* <Route path='market' element={<MarketAnalysis />} /> */}
      {/* <Route path='skills' element={<SkillsAnalysis />} /> */}
      {/* <Route path='salary' element={<SalaryAnalysis />} /> */}
    </Routes>
  )
}

export default JobAnalysisRoutes
