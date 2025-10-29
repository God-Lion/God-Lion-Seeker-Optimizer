// src/Modules/CandidateProfileAnalyzer/types/api.types.ts

/**
 * API Request Types
 */

export interface AnalyzeFileRequest {
  user_email?: string
  save_to_db?: boolean
  top_n?: number
}

export interface AnalyzeTextRequest {
  user_email?: string
  save_to_db?: boolean
  top_n?: number
}

/**
 * API Response Types
 */

export interface RoleMatchResponse {
  role_id: string
  role_title: string
  role_category: string
  overall_score: number
  skills_score: number
  education_score: number
  certification_score: number
  experience_score: number
  matched_skills: string[]
  missing_skills: string[]
  matched_certifications: string[]
  missing_certifications: string[]
  skill_gaps: string[]
  recommendations: string[]
}

export interface ResumeSummary {
  total_skills: number
  years_experience: number
  education_count: number
  certifications_count: number
  top_skills: string[]
}

export interface CareerAnalysisResponse {
  analysis_id?: number
  resume_summary: ResumeSummary
  top_roles: RoleMatchResponse[]
  career_pathways: Record<string, any>
  overall_insights: Record<string, any>
}

export interface CareerHistoryItem {
  id: number
  created_at: string
  resume_filename?: string
  skills_count: number
  years_experience: number
  top_role: string
  top_score: number
}

export interface RoleItem {
  role_id: string
  title: string
  category: string
  description: string
  required_skills: string[]
  min_years_experience: number
}

export interface RoleListResponse {
  total: number
  categories: string[]
  roles: RoleItem[]
}

export interface RoleDetailsResponse {
  role_id: string
  title: string
  category: string
  description: string
  required_skills: string[]
  preferred_skills: string[]
  required_education: string[]
  preferred_education: string[]
  required_certifications: string[]
  preferred_certifications: string[]
  min_years_experience: number
  typical_salary_range?: {
    min: number
    max: number
    currency: string
  }
  growth_opportunities: string[]
  related_roles: string[]
}

/**
 * Mutation Options Types
 */

export interface AnalyzeFileMutationVars {
  file: File
  params?: AnalyzeFileRequest
}

export interface AnalyzeTextMutationVars {
  resumeText: string
  params?: AnalyzeTextRequest
}

export interface ExportAnalysisMutationVars {
  analysisId: number
  format?: 'markdown' | 'json' | 'txt'
}

export interface DeleteAnalysisMutationVars {
  analysisId: number
}
