// src/shared/api/services/api.service.ts

import { apiClient } from '../api-client'
import { ENDPOINTS } from '../config'
import { AxiosResponse } from 'axios'

/**
 * Translation Service
 */
export const translationService = {
  getTranslation: async (code: string = 'fr'): Promise<AxiosResponse> => {
    return apiClient.getWithFallback(
      ENDPOINTS.translation(code),
      {} // fallback to empty object
    )
  },
}

/**
 * Auth Service
 */
export const authService = {
  signup: (body: any): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.auth.signup, body)
  },

  forgotPassword: (body: any): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.auth.forgotPassword, body)
  },

  resetPassword: (body: any): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.auth.resetPassword, body)
  },

  verifyEmail: (email: string, signature: string): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.auth.verifyEmail(email, signature))
  },

  validateUser: (id: string | number, token: string): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.auth.validateUser(id, token))
  },
}

/**
 * User Service
 */
export const userService = {
  getSettings: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.user.settings)
  },

  getAllUsers: (query: string = ''): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.user.list}${query}`)
  },

  getUserById: (id: number, query: string = ''): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.user.byId(id)}${query}`)
  },

  getUsersByUserType: (userTypeId: number): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.user.byUserType(userTypeId))
  },

  updateNames: (body: { firstname?: string; lastname?: string }): Promise<AxiosResponse> => {
    return apiClient.put(ENDPOINTS.user.updateNames, body)
  },

  updateEmail: (body: { email?: string; password: string }): Promise<AxiosResponse> => {
    return apiClient.put(ENDPOINTS.user.updateEmail, body)
  },

  updatePhotoProfile: (data: { id: number; file: File; [key: string]: any }): Promise<AxiosResponse> => {
    return apiClient.uploadFormData(ENDPOINTS.user.updatePhoto(data.id), data, 'patch')
  },
}

/**
 * Category Service
 */
export const categoryService = {
  getAllCategories: (query: string = ''): Promise<AxiosResponse> => {
    return apiClient.getWithFallback(
      `${ENDPOINTS.category.list}${query}.json`,
      [] // fallback to empty array
    )
  },
}

/**
 * Participant Service
 */
export const participantService = {
  getAllParticipants: (editionId: number, query: string = ''): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.participant.byEdition(editionId)}${query}.json`)
  },

  getParticipantBySlug: (slug: string): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.participant.bySlug(slug))
  },

  getAllParticipantsPhase: (query: string = ''): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.participant.allPhases}${query}`)
  },

  setParticipantMusic: (data: any): Promise<AxiosResponse> => {
    return apiClient.uploadFormData(ENDPOINTS.participant.music, data, 'post')
  },

  updateParticipantMusic: (data: any): Promise<AxiosResponse> => {
    return apiClient.uploadFormData(ENDPOINTS.participant.music, data, 'put')
  },

  setParticipantDrawer: (data: any): Promise<AxiosResponse> => {
    return apiClient.uploadFormData(ENDPOINTS.participant.drawer, data, 'post')
  },

  updateParticipantDrawer: (data: any): Promise<AxiosResponse> => {
    return apiClient.uploadFormData(ENDPOINTS.participant.drawer, data, 'put')
  },

  setParticipantPhase: (body: any): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.participant.phase, body)
  },

  updateParticipantPhase: (body: any): Promise<AxiosResponse> => {
    return apiClient.put(ENDPOINTS.participant.phase, body)
  },
}

/**
 * Phase Service
 */
export const phaseService = {
  getAllPhases: (query: string = ''): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.phase.list}${query}`)
  },

  getPhaseParticipants: (id: number, query: string = ''): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.phase.participants(id)}${query}`)
  },

  setPhase: (body: any): Promise<AxiosResponse> => {
    return apiClient.post(ENDPOINTS.phase.list, body)
  },

  updatePhase: (body: any): Promise<AxiosResponse> => {
    return apiClient.put(ENDPOINTS.phase.list, body)
  },
}

/**
 * Judge Service
 */
export const judgeService = {
  getAllJudges: (query: string = ''): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.judge.list}${query}`)
  },

  getJudgeById: (id: number, query: string = ''): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.judge.byId(id)}${query}`)
  },

  getJudgePhaseVote: (): Promise<AxiosResponse> => {
    return apiClient.get(ENDPOINTS.judge.phaseVote)
  },
}

/**
 * Contest Service
 */
export const contestService = {
  getAllContests: (query: string = ''): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.contest.list}${query}`)
  },

  getAllEditions: (query: string = ''): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.edition.list}${query}`)
  },
}

/**
 * Logs Service
 */
export const logsService = {
  getAllLogs: (query: string = ''): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.logs}${query}`)
  },
}

/**
 * Event Service (Long Polling)
 */
export const eventService = {
  getEventData: (query: string = ''): Promise<AxiosResponse> => {
    return apiClient.get(`${ENDPOINTS.event}${query}`)
  },
}
