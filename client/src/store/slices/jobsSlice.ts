import { StateCreator } from 'zustand'

export interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  salary?: string
  postedDate: string
  url: string
  skills?: string[]
  [key: string]: any
}

export interface Application {
  id: string
  jobId: string
  status: 'applied' | 'interviewing' | 'offered' | 'rejected'
  appliedDate: string
  notes?: string
  [key: string]: any
}

export interface SearchFilters {
  keywords?: string
  location?: string
  jobType?: string[]
  experience?: string
  salary?: {
    min?: number
    max?: number
  }
  datePosted?: string
  sortBy?: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
}

export interface JobsSlice {
  // State
  jobs: Job[]
  savedJobs: Job[]
  applications: Application[]
  searchFilters: SearchFilters
  pagination: Pagination

  // Actions - Jobs
  setJobs: (jobs: Job[]) => void
  addJob: (job: Job) => void
  updateJob: (id: string, updates: Partial<Job>) => void
  deleteJob: (id: string) => void

  // Actions - Saved Jobs
  saveJob: (job: Job) => void
  unsaveJob: (jobId: string) => void
  isSaved: (jobId: string) => boolean

  // Actions - Applications
  addApplication: (application: Application) => void
  updateApplication: (id: string, updates: Partial<Application>) => void
  deleteApplication: (id: string) => void

  // Actions - Search & Filters
  setSearchFilters: (filters: Partial<SearchFilters>) => void
  resetSearchFilters: () => void
  setPagination: (pagination: Partial<Pagination>) => void
}

const defaultFilters: SearchFilters = {
  keywords: '',
  location: '',
  jobType: [],
  experience: '',
  salary: {},
  datePosted: 'any',
  sortBy: 'recent',
}

const defaultPagination: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
}

export const createJobsSlice: StateCreator<
  JobsSlice,
  [['zustand/immer', never], ['zustand/persist', unknown]],
  [],
  JobsSlice
> = (set, get) => ({
  // Initial State
  jobs: [],
  savedJobs: [],
  applications: [],
  searchFilters: defaultFilters,
  pagination: defaultPagination,

  setJobs: (jobs: Job[]) => {
    set((state) => {
      state.jobs = jobs
    })
  },

  addJob: (job: Job) => {
    set((state) => {
      state.jobs.push(job)
    })
  },

  updateJob: (id: string, updates: Partial<Job>) => {
    set((state) => {
      const index = state.jobs.findIndex((job) => job.id === id)
      if (index !== -1) {
        state.jobs[index] = { ...state.jobs[index], ...updates }
      }
    })
  },

  deleteJob: (id: string) => {
    set((state) => {
      state.jobs = state.jobs.filter((job) => job.id !== id)
    })
  },

  saveJob: (job: Job) => {
    set((state) => {
      const exists = state.savedJobs.some((saved) => saved.id === job.id)
      if (!exists) {
        state.savedJobs.push(job)
      }
    })
  },

  unsaveJob: (jobId: string) => {
    set((state) => {
      state.savedJobs = state.savedJobs.filter((job) => job.id !== jobId)
    })
  },

  isSaved: (jobId: string) => {
    return get().savedJobs.some((job) => job.id === jobId)
  },

  addApplication: (application: Application) => {
    set((state) => {
      state.applications.push(application)
    })
  },

  updateApplication: (id: string, updates: Partial<Application>) => {
    set((state) => {
      const index = state.applications.findIndex((app) => app.id === id)
      if (index !== -1) {
        state.applications[index] = { ...state.applications[index], ...updates }
      }
    })
  },

  deleteApplication: (id: string) => {
    set((state) => {
      state.applications = state.applications.filter((app) => app.id !== id)
    })
  },

  setSearchFilters: (filters: Partial<SearchFilters>) => {
    set((state) => {
      state.searchFilters = {
        ...state.searchFilters,
        ...filters,
      }
    })
  },

  resetSearchFilters: () => {
    set((state) => {
      state.searchFilters = defaultFilters
      state.pagination = defaultPagination
    })
  },

  setPagination: (pagination: Partial<Pagination>) => {
    set((state) => {
      state.pagination = {
        ...state.pagination,
        ...pagination,
      }
    })
  },
})
