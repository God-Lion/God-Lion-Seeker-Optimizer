// src/Modules/CandidateProfileAnalyzer/hooks/useProfileAnalyzer.ts

import { useState, useCallback } from 'react'
import { ProfileData, AnalysisState } from '../types'
import { useAnalyzeResumeFile, useAnalyzeResumeText } from './useCareerQuery'
import { CareerAnalysisResponse } from '../types/api.types'

/**
 * Map backend response to ProfileData
 */
function mapResponseToProfile(response: CareerAnalysisResponse): ProfileData {
  // Extract education from resume_summary or top_roles
  const education: string[] = []
  if (response.resume_summary) {
    // Try to parse education from the response
    const eduCount = response.resume_summary.education_count || 0
    if (eduCount > 0) {
      // Add a generic education entry if we have education count but no details
      education.push(`Bachelor's degree (${eduCount} education entries found)`)
    }
  }

  // Extract certifications
  const certifications: string[] = []
  const certsCount = response.resume_summary?.certifications_count || 0
  
  // Try to extract certifications from top roles matched_certifications
  if (response.top_roles && response.top_roles.length > 0) {
    const firstRole = response.top_roles[0]
    if (firstRole.matched_certifications && firstRole.matched_certifications.length > 0) {
      certifications.push(...firstRole.matched_certifications)
    }
  }
  
  // If no certifications found but count exists, add generic entry
  if (certifications.length === 0 && certsCount > 0) {
    certifications.push(`${certsCount} certification(s) listed`)
  }

  // Extract experience
  const years = response.resume_summary?.years_experience || 0
  const roles: string[] = []
  const companies: string[] = []

  // Try to extract roles from top role recommendations
  if (response.top_roles && response.top_roles.length > 0) {
    const topRoles = response.top_roles.slice(0, 3)
    roles.push(...topRoles.map(role => role.role_title))
  }

  // Extract skills
  const technicalSkills = response.resume_summary?.top_skills || []
  const softSkills: string[] = []
  
  // Try to identify soft skills from matched skills
  const softSkillKeywords = ['leadership', 'communication', 'collaboration', 'agile', 'scrum', 'teamwork']
  if (response.top_roles && response.top_roles.length > 0) {
    const allMatchedSkills = response.top_roles.flatMap(role => role.matched_skills || [])
    const uniqueSoftSkills = [...new Set(allMatchedSkills.filter(skill => 
      softSkillKeywords.some(keyword => skill.toLowerCase().includes(keyword))
    ))]
    softSkills.push(...uniqueSoftSkills)
  }

  // Generate a summary from the analysis
  let summary = ''
  if (response.top_roles && response.top_roles.length > 0) {
    const topRole = response.top_roles[0]
    summary = `Best fit for ${topRole.role_title} with ${Math.round(topRole.overall_score * 100)}% match. `
    summary += `${technicalSkills.length} technical skills identified. `
    summary += `${years} years of experience.`
  }

  return {
    id: `profile_${response.analysis_id || Date.now()}`,
    education,
    certifications,
    experience: {
      roles,
      totalYears: years,
      companies,
    },
    skills: {
      technical: technicalSkills,
      soft: softSkills,
    },
    summary,
    uploadedAt: new Date().toISOString(),
    // Store the full analysis response for later use
    analysisData: response,
  }
}

export const useProfileAnalyzer = () => {
  const [state, setState] = useState<AnalysisState>({
    profile: null,
    matches: [],
    loading: false,
    error: null,
    step: 'upload',
  })

  // Use the React Query hooks
  const analyzeFileMutation = useAnalyzeResumeFile({
    onSuccess: (response) => {
      console.log('Backend response:', response.data)
      const profileData = mapResponseToProfile(response.data)
      console.log('Mapped profile data:', profileData)
      setState((prev) => ({
        ...prev,
        profile: profileData,
        step: 'summary',
        loading: false,
        error: null,
      }))
    },
    onError: (error) => {
      console.error('Upload error:', error)
      setState((prev) => ({
        ...prev,
        error: error.message || 'Upload failed',
        loading: false,
      }))
    },
  })

  const analyzeTextMutation = useAnalyzeResumeText({
    onSuccess: (response) => {
      console.log('Backend response:', response.data)
      const profileData = mapResponseToProfile(response.data)
      console.log('Mapped profile data:', profileData)
      setState((prev) => ({
        ...prev,
        profile: profileData,
        step: 'summary',
        loading: false,
        error: null,
      }))
    },
    onError: (error) => {
      console.error('Analysis error:', error)
      setState((prev) => ({
        ...prev,
        error: error.message || 'Analysis failed',
        loading: false,
      }))
    },
  })

  const uploadProfile = useCallback(
    async (file: File, userEmail?: string) => {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
      ]
      
      if (!validTypes.includes(file.type)) {
        setState((prev) => ({
          ...prev,
          error: 'Invalid file type. Please upload PDF, DOCX, DOC, or TXT only.',
        }))
        return
      }

      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        // Use the mutation
        await analyzeFileMutation.mutateAsync({
          file,
          params: {
            user_email: userEmail,
            save_to_db: true,
            top_n: 10,
          },
        })
      } catch (error) {
        console.error('Upload failed:', error)
        // Error is already handled in onError callback
      }
    },
    [analyzeFileMutation]
  )

  const analyzeText = useCallback(
    async (resumeText: string, userEmail?: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        // Use the mutation
        await analyzeTextMutation.mutateAsync({
          resumeText,
          params: {
            user_email: userEmail,
            save_to_db: true,
            top_n: 10,
          },
        })
      } catch (error) {
        console.error('Analysis failed:', error)
        // Error is already handled in onError callback
      }
    },
    [analyzeTextMutation]
  )

  const updateProfile = useCallback((updates: Partial<ProfileData>) => {
    setState((prev) => ({
      ...prev,
      profile: prev.profile ? { ...prev.profile, ...updates } : null,
    }))
  }, [])

  const moveToStep = useCallback((step: AnalysisState['step']) => {
    setState((prev) => ({ ...prev, step }))
  }, [])

  const reset = useCallback(() => {
    setState({
      profile: null,
      matches: [],
      loading: false,
      error: null,
      step: 'upload',
    })
  }, [])

  return {
    ...state,
    uploadProfile,
    analyzeText,
    updateProfile,
    moveToStep,
    reset,
    // Expose mutation states for advanced usage
    isAnalyzing: analyzeFileMutation.isPending || analyzeTextMutation.isPending,
  }
}
