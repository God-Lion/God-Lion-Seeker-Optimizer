/**
 * Companies API Service
 * Handles all API calls related to company management
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface Company {
  id: number;
  name: string;
  industry?: string;
  company_size?: string;
  headquarters?: string;
  website?: string;
  description?: string;
  linkedin_url?: string;
  founded_year?: number;
}

export interface CompanySearchParams {
  skip?: number;
  limit?: number;
  name?: string;
  industry?: string;
}

export interface CompanySearchResponse {
  companies: Company[];
  skip: number;
  limit: number;
  total: number;
}

export interface CompanySearchQuery {
  q: string;
  skip?: number;
  limit?: number;
}

export interface CompanyJob {
  id: number;
  title: string;
  location: string;
  job_type: string;
  experience_level: string;
  posted_date?: string;
  job_url: string;
}

export interface CompanyJobsResponse {
  company_id: number;
  company_name: string;
  jobs: CompanyJob[];
  skip: number;
  limit: number;
  total: number;
}

class CompaniesApiService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get all companies with optional filters
   */
  async getCompanies(params: CompanySearchParams = {}): Promise<CompanySearchResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params.name) searchParams.append('name', params.name);
    if (params.industry) searchParams.append('industry', params.industry);

    const queryString = searchParams.toString();
    const endpoint = `/companies${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<CompanySearchResponse>(endpoint);
  }

  /**
   * Get a specific company by ID
   */
  async getCompany(companyId: number): Promise<Company> {
    return this.makeRequest<Company>(`/companies/${companyId}`);
  }

  /**
   * Search companies by name or industry
   */
  async searchCompanies(query: CompanySearchQuery): Promise<CompanySearchResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query.q);
    if (query.skip !== undefined) searchParams.append('skip', query.skip.toString());
    if (query.limit !== undefined) searchParams.append('limit', query.limit.toString());

    return this.makeRequest<CompanySearchResponse>(`/companies/search/?${searchParams.toString()}`);
  }

  /**
   * Get all jobs for a specific company
   */
  async getCompanyJobs(
    companyId: number, 
    skip: number = 0, 
    limit: number = 20
  ): Promise<CompanyJobsResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('skip', skip.toString());
    searchParams.append('limit', limit.toString());

    return this.makeRequest<CompanyJobsResponse>(
      `/companies/${companyId}/jobs?${searchParams.toString()}`
    );
  }
}

export const companiesApiService = new CompaniesApiService();
