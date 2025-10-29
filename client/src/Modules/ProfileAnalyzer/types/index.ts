// Import API types
import type { CareerAnalysisResponse } from './api.types'

// Profile Data Structures
export interface ProfileData {
  id: string;
  education: string[];
  certifications: string[];
  experience: {
    roles: string[];
    totalYears: number;
    companies: string[];
  };
  skills: {
    technical: string[];
    soft: string[];
  };
  summary?: string;
  uploadedAt: string;
  // Store the full backend analysis response
  analysisData?: CareerAnalysisResponse;
}

// Job Matching Results
export interface MatchingResult {
  jobId: string;
  job: JobData;
  fitScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchReason: string[];
  // Additional scoring details from backend
  skillsScore?: number;
  educationScore?: number;
  certificationScore?: number;
  experienceScore?: number;
}

// Analysis State
export interface AnalysisState {
  profile: ProfileData | null;
  matches: MatchingResult[];
  loading: boolean;
  error: string | null;
  step: 'upload' | 'summary' | 'roleRecommendations' | 'recommendations' | 'analysis';
}

// Skill Importance Levels
export type SkillImportance = 'critical' | 'important' | 'nice-to-have';

export interface SkillGap {
  skill: string;
  importance: SkillImportance;
  estimatedLearningHours: number;
  resources?: string[];
}

// Job Data Structure
export interface JobData {
  id: string;
  title: string;
  company_name: string;
  location: string;
  experience_level: string;
  salary_range?: string;
  description: string;
  job_url: string;
  required_skills: string[];
  preferred_skills: string[];
  posted_date: string;
}

// Filter Options
export interface FilterOptions {
  minFitScore: number;
  experienceLevel: string;
  sortBy: 'fitScore' | 'company' | 'recent';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface UploadResponse {
  profileId: string;
  profile: ProfileData;
}

export interface JobsResponse {
  jobs: JobData[];
  total: number;
  page: number;
  limit: number;
}

// Re-export API types for convenience
export type {
  AnalyzeFileRequest,
  AnalyzeTextRequest,
  RoleMatchResponse,
  ResumeSummary,
  CareerAnalysisResponse,
  CareerHistoryItem,
  RoleItem,
  RoleListResponse,
  RoleDetailsResponse,
  AnalyzeFileMutationVars,
  AnalyzeTextMutationVars,
  ExportAnalysisMutationVars,
  DeleteAnalysisMutationVars,
} from './api.types'