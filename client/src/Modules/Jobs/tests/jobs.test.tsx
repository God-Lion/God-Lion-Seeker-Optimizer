import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import JobCard from '../components/JobCard'
import FilterPanel from '../components/FilterPanel'
import { Job, JobSearch } from '@/types/job'

describe('JobCard', () => {
  const job: Job = {
    id: 1,
    title: 'Software Engineer',
    company_name: 'Google',
    location: 'Mountain View, CA',
    description: 'Lorem ipsum dolor sit amet.',
    job_type: 'Full-time',
    experience_level: 'Mid-Level',
    salary_range: '$100k - $150k',
    posted_date: new Date().toISOString(),
    match_score: 85,
  }

  it('renders the job title', () => {
    render(
      <JobCard
        job={job}
        onSave={() => {}}
        onUnsave={() => {}}
        onApply={() => {}}
        isSaved={false}
        onViewDetails={() => {}}
      />,
    )
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
  })
})

describe('FilterPanel', () => {
  const filters: JobSearch = {
    location: '',
    company: '',
    date_posted: 'all',
  }

  it('renders the location filter', () => {
    render(
      <FilterPanel
        filters={filters}
        onFilterChange={() => {}}
        onReset={() => {}}
      />,
    )
    expect(screen.getByLabelText('Location')).toBeInTheDocument()
  })
})
