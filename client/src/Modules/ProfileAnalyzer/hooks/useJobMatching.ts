// src/Modules/CandidateProfileAnalyzer/hooks/useJobMatching.ts

import { useState, useCallback, useMemo } from 'react'
import { ProfileData, MatchingResult, FilterOptions } from '../types'
import { useAnalyzeResumeText } from './useCareerQuery'
import { CareerAnalysisResponse, RoleMatchResponse } from '../types/api.types'

/**
 * Map backend role match to MatchingResult
 */
function mapRoleToMatchingResult(role: RoleMatchResponse): MatchingResult {
  return {
    jobId: role.role_id,
    job: {
      id: role.role_id,
      title: role.role_title,
      company_name: '', // Not provided by backend
      location: '', // Not provided by backend
      experience_level: '', // Could be inferred from min_years_experience
      description: role.recommendations.join('. '),
      job_url: '',
      required_skills: role.matched_skills || [],
      preferred_skills: role.missing_skills || [],
      posted_date: '',
    },
    fitScore: role.overall_score,
    matchedSkills: role.matched_skills,
    missingSkills: role.missing_skills,
    matchReason: role.recommendations,
    skillsScore: role.skills_score,
    educationScore: role.education_score,
    certificationScore: role.certification_score,
    experienceScore: role.experience_score,
  }
}

export const useJobMatching = (profile: ProfileData | null) => {
  const [matches, setMatches] = useState<MatchingResult[]>([])
  const [filters, setFilters] = useState<FilterOptions>({
    minFitScore: 50,
    experienceLevel: 'all',
    sortBy: 'fitScore',
  })

  // Use the React Query mutation
  const analyzeTextMutation = useAnalyzeResumeText({
    onSuccess: (response) => {
      const results = (response.data.top_roles || []).map(mapRoleToMatchingResult)
      setMatches(results)
    },
    onError: (error) => {
      console.error('Matching failed:', error)
      setMatches([])
    },
  })

  const findMatches = useCallback(async () => {
    if (!profile) return

    // Use the profile summary or full text if available
    const resumeText = profile.summary || ''
    
    if (!resumeText) {
      console.warn('No resume text available for matching')
      return
    }

    // Trigger the mutation
    await analyzeTextMutation.mutateAsync({
      resumeText,
      params: {
        save_to_db: false, // Don't save intermediate analysis
        top_n: 20, // Get more matches for better filtering
      },
    })
  }, [profile, analyzeTextMutation])

  // Filter and sort matches
  const filteredMatches = useMemo(() => {
    let filtered = matches.filter((m) => m.fitScore >= filters.minFitScore)

    if (filters.experienceLevel !== 'all') {
      filtered = filtered.filter(
        (m) => m.job.experience_level === filters.experienceLevel
      )
    }

    return filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'fitScore':
          return b.fitScore - a.fitScore
        case 'company':
          return a.job.company_name.localeCompare(b.job.company_name)
        case 'recent':
          return 0 // Assume jobs are already sorted by recency
        default:
          return 0
      }
    })
  }, [matches, filters])

  return {
    matches: filteredMatches,
    allMatches: matches,
    loading: analyzeTextMutation.isPending,
    filters,
    setFilters,
    findMatches,
    error: analyzeTextMutation.error,
    isSuccess: analyzeTextMutation.isSuccess,
  }
}
