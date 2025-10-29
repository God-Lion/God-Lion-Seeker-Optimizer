// src/Modules/CandidateProfileAnalyzer/services/careerApi.ts
// 
// ⚠️ DEPRECATED - This file is kept for backward compatibility
// 
// Please use the new architecture:
// - Import from './career.service' for service-level calls
// - Import from '../hooks/useCareerQuery' for React components
//
// Migration examples:
//
// OLD:
// ```ts
// import { careerApi } from './careerApi'
// const result = await careerApi.analyzeResumeFile(file)
// ```
//
// NEW (React component):
// ```tsx
// import { useAnalyzeResumeFile } from '../hooks'
// const mutation = useAnalyzeResumeFile()
// await mutation.mutateAsync({ file, params: { ... } })
// ```
//
// NEW (Service/utility):
// ```ts
// import { careerService } from './career.service'
// const response = await careerService.analyzeResumeFile(file, params)
// ```

import { careerService } from './career.service'

/**
 * @deprecated Use careerService from './career.service' or React Query hooks from '../hooks'
 */
export const careerApi = {
  async analyzeResumeFile(file: File, userEmail?: string, saveToDb = true, topN = 10) {
    console.warn('careerApi.analyzeResumeFile is deprecated. Use careerService or useAnalyzeResumeFile hook.')
    const response = await careerService.analyzeResumeFile(file, {
      user_email: userEmail,
      save_to_db: saveToDb,
      top_n: topN,
    })
    return response.data
  },

  async analyzeResumeText(resumeText: string, userEmail?: string, saveToDb = true, topN = 10) {
    console.warn('careerApi.analyzeResumeText is deprecated. Use careerService or useAnalyzeResumeText hook.')
    const response = await careerService.analyzeResumeText(resumeText, {
      user_email: userEmail,
      save_to_db: saveToDb,
      top_n: topN,
    })
    return response.data
  },

  async getAnalysis(analysisId: number) {
    console.warn('careerApi.getAnalysis is deprecated. Use careerService or useCareerAnalysis hook.')
    const response = await careerService.getAnalysis(analysisId)
    return response.data
  },

  async getHistory(userEmail: string, limit = 10) {
    console.warn('careerApi.getHistory is deprecated. Use careerService or useCareerHistory hook.')
    const response = await careerService.getAnalysisHistory(userEmail, limit)
    return response.data
  },

  async exportAnalysis(analysisId: number, format: 'markdown' | 'json' | 'txt' = 'markdown') {
    console.warn('careerApi.exportAnalysis is deprecated. Use careerService or useExportAnalysis hook.')
    return await careerService.exportAnalysis(analysisId, format)
  },

  async listRoles() {
    console.warn('careerApi.listRoles is deprecated. Use careerService or useCareerRoles hook.')
    const response = await careerService.listRoles()
    return response.data
  },

  async getRoleDetails(roleId: string) {
    console.warn('careerApi.getRoleDetails is deprecated. Use careerService or useRoleDetails hook.')
    const response = await careerService.getRoleDetails(roleId)
    return response.data
  },
}
