// src/Modules/Companies/types/api.types.ts

/**
 * Company entity from API
 */
export interface Company {
  id: number
  name: string
  industry?: string
  company_size?: string
  headquarters?: string
  website?: string
  description?: string
  linkedin_url?: string
  founded_year?: number
  created_at?: string
  updated_at?: string
}

/**
 * Company search/filter parameters
 */
export interface CompanySearchParams {
  skip?: number
  limit?: number
  name?: string
  industry?: string
  company_size?: string
  location?: string
}

/**
 * Company search response
 */
export interface CompanySearchResponse {
  companies: Company[]
  skip: number
  limit: number
  total: number
}

/**
 * Company search query
 */
export interface CompanySearchQuery {
  q: string
  skip?: number
  limit?: number
}

/**
 * Job entity (simplified for company jobs list)
 */
export interface CompanyJob {
  id: number
  title: string
  location: string
  job_type: string
  experience_level: string
  posted_date?: string
  job_url: string
  description?: string
  salary_range?: string
}

/**
 * Company jobs response
 */
export interface CompanyJobsResponse {
  company_id: number
  company_name: string
  jobs: CompanyJob[]
  skip: number
  limit: number
  total: number
}

/**
 * Create company request
 */
export interface CreateCompanyRequest {
  name: string
  industry?: string
  company_size?: string
  headquarters?: string
  website?: string
  description?: string
  linkedin_url?: string
  founded_year?: number
}

/**
 * Update company request
 */
export interface UpdateCompanyRequest {
  name?: string
  industry?: string
  company_size?: string
  headquarters?: string
  website?: string
  description?: string
  linkedin_url?: string
  founded_year?: number
}

/**
 * Delete company response
 */
export interface DeleteCompanyResponse {
  message: string
  company_id: number
  deleted_at: string
}

/**
 * Company statistics
 */
export interface CompanyStatistics {
  total_companies: number
  by_industry: Record<string, number>
  by_size: Record<string, number>
  total_jobs: number
  companies_with_jobs: number
}

/**
 * Mutation variables for React Query
 */

export interface CreateCompanyMutationVars {
  data: CreateCompanyRequest
}

export interface UpdateCompanyMutationVars {
  companyId: number
  data: UpdateCompanyRequest
}

export interface DeleteCompanyMutationVars {
  companyId: number
}

export interface GetCompanyJobsMutationVars {
  companyId: number
  skip?: number
  limit?: number
}
