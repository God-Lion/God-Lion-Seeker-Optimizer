// src/store/slices/jobsSlice.ts
import { StateCreator } from 'zustand'
import { Job, JobSearchParams, JobApplication } from 'src/types/job'

export interface JobsSlice {
  jobs: Job[]
  savedJobs: Job[]
  applications: JobApplication[]
  searchFilters: JobSearchParams
  pagination: {
    skip: number
    limit: number
    total: number
  }
  setJobs: (jobs: Job[]) => void
  addJob: (job: Job) => void
  updateJob: (job: Job) => void
  deleteJob: (jobId: number) => void
  saveJob: (job: Job) => void
  unsaveJob: (jobId: number) => void
  addApplication: (application: JobApplication) => void
  updateApplication: (application: JobApplication) => void
  setSearchFilters: (filters: JobSearchParams) => void
  resetSearchFilters: () => void
}

export const createJobsSlice: StateCreator<JobsSlice> = (set) => ({
  jobs: [],
  savedJobs: [],
  applications: [],
  searchFilters: {},
  pagination: {
    skip: 0,
    limit: 20,
    total: 0,
  },
  setJobs: (jobs) => set({ jobs }),
  addJob: (job) => set((state) => ({ jobs: [...state.jobs, job] })),
  updateJob: (job) =>
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === job.id ? job : j)),
    })),
  deleteJob: (jobId) =>
    set((state) => ({
      jobs: state.jobs.filter((j) => j.id !== jobId),
    })),
  saveJob: (job) =>
    set((state) => ({
      savedJobs: [...state.savedJobs, job],
    })),
  unsaveJob: (jobId) =>
    set((state) => ({
      savedJobs: state.savedJobs.filter((job) => job.id !== jobId),
    })),
  addApplication: (application) =>
    set((state) => ({
      applications: [...state.applications, application],
    })),
  updateApplication: (application) =>
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === application.id ? application : a
      ),
    })),
  setSearchFilters: (filters) => set({ searchFilters: filters }),
  resetSearchFilters: () => set({ searchFilters: {} }),
})
