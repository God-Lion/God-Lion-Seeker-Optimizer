// src/store/slices/jobsSlice.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Job } from '@/types/job'

interface JobsState {
  savedJobs: Job[]
  saveJob: (job: Job) => void
  unsaveJob: (jobId: number) => void
  isJobSaved: (jobId: number) => boolean
}

export const useJobsSlice = create<JobsState>()(
  persist(
    (set, get) => ({
      savedJobs: [],
      saveJob: (job) =>
        set((state) => ({
          savedJobs: [...state.savedJobs, job],
        })),
      unsaveJob: (jobId) =>
        set((state) => ({
          savedJobs: state.savedJobs.filter((job) => job.id !== jobId),
        })),
      isJobSaved: (jobId) => {
        const state = get()
        return state.savedJobs.some((job) => job.id === jobId)
      },
    }),
    {
      name: 'saved-jobs-storage', // unique name
    },
  ),
)
