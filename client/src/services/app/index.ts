/* eslint-disable react-hooks/rules-of-hooks */
import { useQuery } from '@tanstack/react-query'
import axios, { AxiosResponse } from 'axios'
import { baseUrl } from 'src/utils/api_link'
import config from 'src/services/headers'
import { ICategory } from 'src/types'
import { IParticipant } from 'src/types'
import {
  IProfileSettingsReponse,
  IUserReponseEmailResetPassword,
} from 'src/types'

axios.defaults.baseURL = baseUrl()
axios.defaults.withCredentials = true

/**
 * Handle translation loading
 * Note: This is deprecated - use getDictionary from utils/getDictionary.ts instead
 * Keeping for backward compatibility
 */
export const handleTranslation = async (
  code: string = 'en',
): Promise<AxiosResponse> => {
  console.warn('handleTranslation is deprecated. Use getDictionary from utils/getDictionary.ts')
  
  try {
    // Try to load from local dictionary files
    const dictionary = await import(`src/data/dictionaries/${code}.json`)
    return {
      data: dictionary.default || dictionary,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    } as AxiosResponse
  } catch (error) {
    console.warn(`Translation file for ${code} not available, using fallback`)
    // Return a fallback response with empty translation data
    return {
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    } as AxiosResponse
  }
}

// =======================================

export const verificationEmailHandle = async (
  email: string,
  signature: string,
): Promise<AxiosResponse> => {
  return await axios.get(
    `/verification/email/${email}?signature=${signature}`,
    await config(),
  )
}

export const resetPasswordEmailHandle = async (
  email: string,
  signature: string,
): Promise<AxiosResponse<IUserReponseEmailResetPassword>> => {
  return await axios.get(
    `reset-password/${email}?signature=${signature}`,
    await config(),
  )
}

export const handleSettingProfile = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<AxiosResponse<IProfileSettingsReponse>> =>
      await axios.get(`settings`),
    retry: 1,
    retryDelay: 1000,
  })
}

export const handleValidateUser = (id: string | number, token: string) => {
  return useQuery({
    queryKey: ['valiateUser', id, token],
    queryFn: async () => await axios.get(`validate/${id}/${token}`),
    retry: 1,
    retryDelay: 1000,
  })
}

export const handleRetriveAllCategory = (query: string = '') => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        return (await axios.get(
          `category${query}`,
          await config(),
        )) as AxiosResponse<Array<ICategory>>
      } catch (error: any) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Category data not available:`, error.message)
        }
        // Return empty array as fallback
        return {
          data: [],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any
        } as AxiosResponse<Array<ICategory>>
      }
    },
    retry: 1,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const handleRetriveAllParticipant = (
  edition_id: number,
  query: string = '',
) => {
  return useQuery({
    queryKey: ['edition', 'participant', edition_id],
    queryFn: async () =>
      (await axios.get(
        `edition/${edition_id}/participant${query}`,
        config(),
      )) as AxiosResponse<Array<IParticipant>>,
    retry: 1,
    retryDelay: 1000,
  })
}

export const handleRetriveParticipantBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['participant', slug],
    queryFn: async () =>
      (await axios.get(
        `participant/${slug}`,
        await config(),
      )) as AxiosResponse<IParticipant>,
    retry: 1,
    retryDelay: 1000,
    enabled: !!slug, // Only run if slug is defined
  })
}

export const handleRetriveAllPhase = (query: string = '') => {
  return useQuery({
    queryKey: ['phases'],
    queryFn: async () => await axios.get(`phase${query}`, await config()),
    retry: 1,
    retryDelay: 1000,
  })
}

export const handleRetriveAllLogs = (query: string = '') => {
  return useQuery({
    queryKey: ['logs'],
    queryFn: async () => await axios.get(`logs${query}`, await config()),
    retry: 1,
    retryDelay: 1000,
  })
}

export const handleRetriveAllParticipantsPhase = (query: string = '') => {
  return useQuery({
    queryKey: ['participants', 'phase'],
    queryFn: async () =>
      await axios.get(`participants/phase${query}`, await config()),
    retry: 1,
    retryDelay: 1000,
  })
}

export const handleRetriveAllPhaseParticipant = (
  id: number,
  query: string = '',
) => {
  return useQuery({
    queryKey: ['phase', 'participant', id],
    queryFn: async () =>
      await axios.get(`phase/${id}/participant${query}`, await config()),
    retry: 1,
    retryDelay: 1000,
  })
}

export const handleRetriveAllUser = (query: string = '') => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => await axios.get(`user${query}`, await config()),
    retry: 1,
    retryDelay: 1000,
  })
}

export const handleRetriveUser = (id: number, query: string = '') => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => await axios.get(`user/${id}${query}`, await config()),
    retry: 1,
    retryDelay: 1000,
    enabled: !!id, // Only run if id is defined
  })
}

export const handlerRetriveUserByUserTypeID = (userTypeID: number) => {
  return useQuery({
    queryKey: ['users', userTypeID],
    queryFn: async () => await axios.get(`users/${userTypeID}`, await config()),
    retry: 1,
    retryDelay: 1000,
    enabled: !!userTypeID, // Only run if userTypeID is defined
  })
}

export const handleRetriveAllJudge = (query: string = '') => {
  return useQuery({
    queryKey: ['judges'],
    queryFn: async () => await axios.get(`judge${query}`, await config()),
    retry: 1,
    retryDelay: 1000,
  })
}

export const handleRetriveJudgeByID = (id: number, query: string = '') => {
  return useQuery({
    queryKey: ['judge', id],
    queryFn: async () => await axios.get(`judge/${id}${query}`, await config()),
    retry: 1,
    retryDelay: 1000,
    enabled: !!id, // Only run if id is defined
  })
}

export const handleRetriveJudgePhaseVote = () => {
  return useQuery({
    queryKey: ['judge', 'vote'],
    queryFn: async () => await axios.get(`judge/phase/vote`, await config()),
    retry: 1,
    retryDelay: 1000,
  })
}

export const handleRetriveAllContest = (query: string = '') => {
  return useQuery({
    queryKey: ['contest'],
    queryFn: async () => await axios.get(`contest${query}`, await config()),
    retry: 1,
    retryDelay: 1000,
  })
}

export const handleRetriveAllEdition = (query: string = '') => {
  return useQuery({
    queryKey: ['edition'],
    queryFn: async () => await axios.get(`edition${query}`, await config()),
    retry: 1,
    retryDelay: 1000,
  })
}

export const handleLongPollingEvent = (query: string = '') => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  return useQuery({
    queryKey: ['eventData'],
    queryFn: async () => await axios.get(`event${query}`, await config()),
    retry: 1,
    retryDelay: 2000,
    staleTime: 1000 * 5, // 5 seconds
    refetchInterval: 5000, // Refetch every 5 seconds for polling
  })
}
