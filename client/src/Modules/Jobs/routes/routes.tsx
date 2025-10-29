import React from 'react'
import { Routes, Route, RoutesProps } from 'react-router-dom'
import JobsSearch from '../screens/JobsSearch'
import JobDetailsPage from '../screens/JobDetailsPage'


const JobsManagementRoutes: React.FC<RoutesProps> = ({
  location,
}): React.ReactElement | null => {
  return (
    <Routes location={location}>
      {/* Jobs Search Route - Index route for /jobs */}
      <Route index element={<JobsSearch />} />

      {/* Job Details Route - Dynamic ID for /jobs/:jobId */}
      <Route path=':jobId' element={<JobDetailsPage />} />


      {/* <Route path='applied' element={<AppliedJobs />} /> */}
      {/* <Route path='recommendations' element={<JobRecommendations />} /> */}
    </Routes>
  )
}

export default JobsManagementRoutes
