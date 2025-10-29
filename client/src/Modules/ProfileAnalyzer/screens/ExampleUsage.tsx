// src/Modules/CandidateProfileAnalyzer/screens/ExampleUsage.tsx
//
// This file demonstrates how to use the refactored architecture
// in your React components

import React, { useState } from 'react'
import {
  useAnalyzeResumeFile,
  useCareerHistory,
  useExportAnalysis,
  useCareerRoles,
  useProfileAnalyzer,
  useJobMatching,
} from '../hooks'

/**
 * Example 1: Simple Resume Upload with React Query
 */
export function SimpleResumeUpload() {
  const [userEmail] = useState('user@example.com')

  const analyzeMutation = useAnalyzeResumeFile({
    onSuccess: (response) => {
      console.log('Analysis complete!', response.data)
      alert(`Analysis complete! Top role: ${response.data.top_roles[0]?.role_title}`)
    },
    onError: (error) => {
      console.error('Analysis failed:', error)
      alert(`Error: ${error.message}`)
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    await analyzeMutation.mutateAsync({
      file,
      params: {
        user_email: userEmail,
        save_to_db: true,
        top_n: 10,
      },
    })
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Upload Resume</h2>
      <input
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        onChange={handleFileChange}
        disabled={analyzeMutation.isPending}
        className="border p-2 rounded"
      />
      {analyzeMutation.isPending && (
        <div className="mt-2">
          <span className="text-blue-600">Analyzing...</span>
        </div>
      )}
      {analyzeMutation.error && (
        <div className="mt-2 text-red-600">
          Error: {analyzeMutation.error.message}
        </div>
      )}
      {analyzeMutation.isSuccess && (
        <div className="mt-4 p-4 bg-green-50 rounded">
          <h3 className="font-bold">Top Recommendations:</h3>
          <ul className="mt-2">
            {analyzeMutation.data.data.top_roles.slice(0, 3).map((role) => (
              <li key={role.role_id} className="mt-1">
                {role.role_title} - {role.overall_score}% match
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * Example 2: View Analysis History
 */
export function AnalysisHistoryView() {
  const [userEmail] = useState('user@example.com')

  const { data, isLoading, error, refetch } = useCareerHistory(userEmail, 10, {
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  })

  const exportMutation = useExportAnalysis({
    onSuccess: () => {
      alert('Export started! Check your downloads.')
    },
  })

  if (isLoading) return <div>Loading history...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Analysis History</h2>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Refresh
        </button>
      </div>

      {data?.data.length === 0 ? (
        <p>No analysis history found.</p>
      ) : (
        <div className="space-y-2">
          {data?.data.map((item) => (
            <div key={item.id} className="border p-4 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{item.top_role}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    {item.skills_count} skills • {item.years_experience} years experience
                  </p>
                  <p className="text-sm font-semibold text-green-600">
                    Match Score: {item.top_score}%
                  </p>
                </div>
                <button
                  onClick={() =>
                    exportMutation.mutate({
                      analysisId: item.id,
                      format: 'markdown',
                    })
                  }
                  disabled={exportMutation.isPending}
                  className="px-3 py-1 bg-gray-200 rounded text-sm"
                >
                  Export
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Example 3: Browse Available Roles
 */
export function RolesBrowser() {
  const { data, isLoading, error } = useCareerRoles()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  if (isLoading) return <div>Loading roles...</div>
  if (error) return <div>Error: {error.message}</div>

  const filteredRoles =
    selectedCategory === 'all'
      ? data?.data.roles
      : data?.data.roles.filter((role) => role.category === selectedCategory)

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Browse Career Roles</h2>

      {/* Category filter */}
      <div className="mb-4">
        <label className="mr-2">Category:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All Categories</option>
          {data?.data.categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Roles list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles?.map((role) => (
          <div key={role.role_id} className="border p-4 rounded">
            <h3 className="font-bold">{role.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{role.category}</p>
            <p className="text-sm mb-2">{role.description}</p>
            <p className="text-xs text-gray-500">
              Min. {role.min_years_experience} years experience
            </p>
            <div className="mt-2">
              <p className="text-xs font-semibold">Top Skills:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {role.required_skills.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredRoles?.length} of {data?.data.total} roles
      </div>
    </div>
  )
}

/**
 * Example 4: Complete Profile Analysis Workflow
 * Using the business logic hook
 */
export function CompleteProfileWorkflow() {
  const {
    profile,
    loading,
    error,
    step,
    uploadProfile,
    moveToStep,
    reset,
  } = useProfileAnalyzer()

  const {
    matches,
    loading: matchLoading,
    findMatches,
    filters,
    setFilters,
  } = useJobMatching(profile)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadProfile(file, 'user@example.com')
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Career Profile Analyzer</h1>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Upload Your Resume</h2>
          <input
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleUpload}
            disabled={loading}
            className="mb-4"
          />
          {loading && <p className="text-blue-600">Analyzing your resume...</p>}
          {error && <p className="text-red-600">{error}</p>}
        </div>
      )}

      {/* Step 2: Summary */}
      {step === 'summary' && profile && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Profile Summary</h2>
          <div className="bg-white border rounded-lg p-6 mb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Experience</p>
                <p className="text-lg font-semibold">
                  {profile.experience.totalYears} years
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Skills</p>
                <p className="text-lg font-semibold">
                  {profile.skills.technical.length} technical skills
                </p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Top Skills:</p>
              <div className="flex flex-wrap gap-2">
                {profile.skills.technical.slice(0, 10).map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                moveToStep('recommendations')
                findMatches()
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded"
            >
              Find Job Matches
            </button>
            <button
              onClick={reset}
              className="px-6 py-2 bg-gray-200 rounded"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Recommendations */}
      {step === 'recommendations' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Job Recommendations</h2>
          
          {/* Filters */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex gap-4">
              <div>
                <label className="text-sm">Min Score:</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.minFitScore}
                  onChange={(e) =>
                    setFilters({ ...filters, minFitScore: Number(e.target.value) })
                  }
                  className="ml-2"
                />
                <span className="ml-2">{filters.minFitScore}%</span>
              </div>
              <div>
                <label className="text-sm">Sort by:</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters({ ...filters, sortBy: e.target.value as any })
                  }
                  className="ml-2 border rounded px-2 py-1"
                >
                  <option value="fitScore">Best Match</option>
                  <option value="company">Company</option>
                  <option value="recent">Most Recent</option>
                </select>
              </div>
            </div>
          </div>

          {matchLoading && <p>Finding matches...</p>}

          {/* Matches */}
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.jobId} className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold">{match.job.title}</h3>
                    <p className="text-gray-600">{match.job.company_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {match.fitScore}%
                    </div>
                    <div className="text-sm text-gray-600">Match Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-green-600">
                      ✓ Matched Skills ({match.matchedSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {match.matchedSkills.slice(0, 5).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-orange-600">
                      → Skills to Learn ({match.missingSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {match.missingSkills.slice(0, 5).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-1">Why this role?</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {match.matchReason.slice(0, 3).map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {matches.length === 0 && !matchLoading && (
            <div className="text-center py-8 text-gray-500">
              No matches found. Try adjusting your filters.
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={() => moveToStep('summary')}
              className="px-6 py-2 bg-gray-200 rounded"
            >
              Back to Summary
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Example 5: Using Service Layer Directly (Non-React context)
 * This is useful in utilities, middleware, or server-side code
 */
export async function exampleServiceUsage() {
  // Import the service
  const { careerService } = await import('../services/career.service')

  try {
    // Example: Analyze text resume
    const response = await careerService.analyzeResumeText(
      'I am a software engineer with 5 years of experience...',
      {
        user_email: 'user@example.com',
        save_to_db: true,
        top_n: 5,
      }
    )

    console.log('Analysis result:', response.data)

    // Example: Get history
    const history = await careerService.getAnalysisHistory('user@example.com', 10)
    console.log('User history:', history.data)

    // Example: Export analysis
    const blob = await careerService.exportAnalysis(123, 'markdown')
    console.log('Export blob size:', blob.size)

    return response.data
  } catch (error) {
    console.error('Service call failed:', error)
    throw error
  }
}
