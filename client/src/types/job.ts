// client/src/types/job.ts

export interface Job {
  id: number;
  title: string;
  company_name: string;
  location: string;
  description: string | null;
  job_type: string | null;
  experience_level: string | null;
  salary_range: string | null;
  posted_date: string | null;
  match_score?: number;
}

export interface JobSearchParams {
  query?: string;
  location?: string;
  company?: string;
  date_posted?: 'all' | 'past_24_hours' | 'past_week' | 'past_month';
  skip?: number;
  limit?: number;
  q?: string;
}

export interface JobApplicationPayload {
  jobId: number;
  resume: File;
  coverLetter?: string;
}

export interface JobApplication {
  id: string;
  jobId: number;
  status: 'applied' | 'in_progress' | 'rejected';
  applied_at: string;
}

export interface JobMatches {
  jobs: Job[];
  total: number;
}
