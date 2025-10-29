import React from 'react';
import { RoutesProps, Routes, Route } from 'react-router-dom';
import { CandidateProfilePage } from '../screens';

/**
 * =============================================================================
 * CANDIDATE PROFILE ANALYZER MODULE ROUTES
 * =============================================================================
 * Handles all candidate profile analysis and job matching routes
 */

const CandidateProfileAnalyzerRoutes: React.FC<RoutesProps> = ({
  location,
}): React.ReactElement | null => {
  return (
    <Routes location={location}>
      {/* Main Profile Analyzer Route - /profile-analyzer */}
      <Route path='/' element={<CandidateProfilePage />} />
      
      {/* Additional Profile Analyzer Routes (Uncomment as needed) */}
      {/* <Route path='upload' element={<UploadView />} /> */}
      {/* <Route path='summary' element={<ProfileSummaryView />} /> */}
      {/* <Route path='recommendations' element={<JobRecommendationsView />} /> */}
      {/* <Route path='analysis' element={<SkillAnalysisView />} /> */}
    </Routes>
  );
};

export default CandidateProfileAnalyzerRoutes;
