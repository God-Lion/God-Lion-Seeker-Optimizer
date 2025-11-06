// src/Modules/Companies/services/companies.service.ts

import { apiClient } from 'src/services/api/api-client'
import { ENDPOINTS } from 'src/services/api/config'
import { AxiosResponse } from 'axios'
import {
  Company,
  CompanySearchParams,
  CompanySearchQuery,
  CompanySearchResponse,
  CompanyJobsResponse,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  DeleteCompanyResponse,
} from '../types/api.types'

/**
 * Companies Service
 * All API calls related to company management using the global apiClient
 */
class CompaniesService {
  /**
   * Get all companies with optional filters and pagination
   */
  async getCompanies(params: CompanySearchParams = {}): Promise<AxiosResponse<CompanySearchResponse>> {
    const searchParams = new URLSearchParams()

    if (params.skip !== undefined) searchParams.append('skip', String(params.skip))
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit))
    if (params.name) searchParams.append('name', params.name)
    if (params.industry) searchParams.append('industry', params.industry)
    if (params.company_size) searchParams.append('company_size', params.company_size)
    if (params.location) searchParams.append('location', params.location)

    const queryString = searchParams.toString()
    const url = queryString ? `${ENDPOINTS.companies.list}?${queryString}` : ENDPOINTS.companies.list

    return apiClient.get<CompanySearchResponse>(url)
  }

  /**
   * Get a specific company by ID
   */
  async getCompanyById(companyId: number): Promise<AxiosResponse<Company>> {
    return apiClient.get<Company>(ENDPOINTS.companies.byId(companyId))
  }

  /**
   * Search companies by keyword
   */
  async searchCompanies(query: CompanySearchQuery): Promise<AxiosResponse<CompanySearchResponse>> {
    const searchParams = new URLSearchParams()
    searchParams.append('q', query.q)
    
    if (query.skip !== undefined) searchParams.append('skip', String(query.skip))
    if (query.limit !== undefined) searchParams.append('limit', String(query.limit))

    return apiClient.get<CompanySearchResponse>(`${ENDPOINTS.companies.search}?${searchParams.toString()}`)
  }

  /**
   * Get all jobs for a specific company
   */
  async getCompanyJobs(
    companyId: number,
    skip: number = 0,
    limit: number = 20
  ): Promise<AxiosResponse<CompanyJobsResponse>> {
    const searchParams = new URLSearchParams()
    searchParams.append('skip', String(skip))
    searchParams.append('limit', String(limit))

    return apiClient.get<CompanyJobsResponse>(
      `${ENDPOINTS.companies.jobs(companyId)}?${searchParams.toString()}`
    )
  }

  /**
   * Create a new company
   */
  async createCompany(data: CreateCompanyRequest): Promise<AxiosResponse<Company>> {
    return apiClient.post<Company>(ENDPOINTS.companies.create, data)
  }

  /**
   * Update an existing company
   */
  async updateCompany(companyId: number, data: UpdateCompanyRequest): Promise<AxiosResponse<Company>> {
    return apiClient.put<Company>(ENDPOINTS.companies.update(companyId), data)
  }

  /**
   * Delete a company
   */
  async deleteCompany(companyId: number): Promise<AxiosResponse<DeleteCompanyResponse>> {
    return apiClient.delete<DeleteCompanyResponse>(ENDPOINTS.companies.delete(companyId))
  }

  /**
   * Get companies with fallback data (for offline mode)
   */
  async getCompaniesWithFallback(
    params: CompanySearchParams = {},
    fallbackData: CompanySearchResponse
  ): Promise<AxiosResponse<CompanySearchResponse>> {
    const searchParams = new URLSearchParams()

    if (params.skip !== undefined) searchParams.append('skip', String(params.skip))
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit))
    if (params.name) searchParams.append('name', params.name)
    if (params.industry) searchParams.append('industry', params.industry)

    const queryString = searchParams.toString()
    const url = queryString ? `${ENDPOINTS.companies.list}?${queryString}` : ENDPOINTS.companies.list

    return apiClient.getWithFallback<CompanySearchResponse>(url, fallbackData)
  }
}

// Export singleton instance
export const companiesService = new CompaniesService()
