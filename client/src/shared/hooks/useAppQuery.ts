// src/shared/hooks/useAppQuery.ts

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { QUERY_KEYS } from '../api/config'
import {
  translationService,
  authService,
  userService,
  categoryService,
  participantService,
  phaseService,
  judgeService,
  contestService,
  logsService,
  eventService,
} from '../api/services/api.service'

/**
 * Translation Hooks
 */
export function useTranslation(code: string = 'fr') {
  return useQuery({
    queryKey: QUERY_KEYS.translation(code),
    queryFn: () => translationService.getTranslation(code),
    staleTime: Infinity, // Translations rarely change
    gcTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
  })
}

/**
 * Auth Hooks
 */
export function useValidateUser(
  id: string | number,
  token: string,
  options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: QUERY_KEYS.validateUser(id, token),
    queryFn: () => authService.validateUser(id, token),
    ...options,
  })
}

/**
 * User Hooks
 */
export function useUserSettings(
  options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: () => userService.getSettings(),
    ...options,
  })
}

export function useUsers(
  query: string = '',
  options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.users.all, query] as const,
    queryFn: () => userService.getAllUsers(query),
    ...options,
  })
}

export function useUser(
  id: number,
  query: string = '',
  options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.users.byId(id), query] as const,
    queryFn: () => userService.getUserById(id, query),
    enabled: !!id,
    ...options,
  })
}

export function useUsersByUserType(
  userTypeId: number,
  options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: QUERY_KEYS.users.byUserType(userTypeId),
    queryFn: () => userService.getUsersByUserType(userTypeId),
    enabled: !!userTypeId,
    ...options,
  })
}

/**
 * Category Hooks
 */
export function useCategories(
  query: string = '',
  options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.categories, query] as const,
    queryFn: () => categoryService.getAllCategories(query),
    ...options,
  })
}

/**
 * Participant Hooks
 */
export function useParticipants(
  editionId: number,
  query: string = '',
  options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.participants.byEdition(editionId), query] as const,
    queryFn: () => participantService.getAllParticipants(editionId, query),
    enabled: !!editionId,
    ...options,
  })
}

export function useParticipantBySlug(
  slug: string | undefined,
  options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: QUERY_KEYS.participants.bySlug(slug || ''),
    queryFn: () => participantService.getParticipantBySlug(slug!),
    enabled: !!slug,
    ...options,
  })
}

export function useParticipantsPhase(
  query: string = '',
  options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.participants.phase, query] as const,
    queryFn: () => participantService.getAllParticipantsPhase(query),
    ...options,
  })
}

/**
 * Phase Hooks
 */
export function usePhases(
  query: string = '',
  options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.phases.all, query] as const,
    queryFn: () => phaseService.getAllPhases(query),
    ...options,
  })
}

export function usePhaseParticipants(
  id: number,
  query: string = '',
  options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.phases.participants(id), query] as const,
    queryFn: () => phaseService.getPhaseParticipants(id, query),
    enabled: !!id,
    ...options,
  })
}

/**
 * Judge Hooks
 */
export function useJudges(
  query: string = '',
  options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.judges.all, query] as const,
    queryFn: () => judgeService.getAllJudges(query),
    ...options,
  })
}

export function useJudge(
  id: number,
  query: string = '',
  options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.judges.byId(id), query] as const,
    queryFn: () => judgeService.getJudgeById(id, query),
    enabled: !!id,
    ...options,
  })
}

export function useJudgePhaseVote(
  options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: QUERY_KEYS.judges.vote,
    queryFn: () => judgeService.getJudgePhaseVote(),
    ...options,
  })
}

/**
 * Contest & Edition Hooks
 */
export function useContests(
  query: string = '',
  options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.contest, query] as const,
    queryFn: () => contestService.getAllContests(query),
    ...options,
  })
}

export function useEditions(
  query: string = '',
  options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.edition, query] as const,
    queryFn: () => contestService.getAllEditions(query),
    ...options,
  })
}

/**
 * Logs Hook
 */
export function useLogs(
  query: string = '',
  options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.logs, query] as const,
    queryFn: () => logsService.getAllLogs(query),
    ...options,
  })
}

/**
 * Event Hook (Long Polling)
 */
export function useEventData(
  query: string = '',
  options?: Omit<UseQueryOptions<AxiosResponse, AxiosError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.event, query] as const,
    queryFn: () => eventService.getEventData(query),
    staleTime: 1000 * 5, // Refetch every 5 seconds
    ...options,
  })
}

/**
 * Mutation Hooks
 */

// Auth Mutations
export function useSignup(
  options?: UseMutationOptions<AxiosResponse, AxiosError, any>
) {
  return useMutation({
    mutationFn: (data) => authService.signup(data),
    ...options,
  })
}

export function useForgotPassword(
  options?: UseMutationOptions<AxiosResponse, AxiosError, any>
) {
  return useMutation({
    mutationFn: (data) => authService.forgotPassword(data),
    ...options,
  })
}

export function useResetPassword(
  options?: UseMutationOptions<AxiosResponse, AxiosError, any>
) {
  return useMutation({
    mutationFn: (data) => authService.resetPassword(data),
    ...options,
  })
}

// User Mutations
export function useUpdateNames(
  options?: UseMutationOptions<AxiosResponse, AxiosError, any>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data) => userService.updateNames(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all })
    },
    ...options,
  })
}

export function useUpdateEmail(
  options?: UseMutationOptions<AxiosResponse, AxiosError, any>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data) => userService.updateEmail(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings })
    },
    ...options,
  })
}

export function useUpdatePhotoProfile(
  options?: UseMutationOptions<AxiosResponse, AxiosError, any>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data) => userService.updatePhotoProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all })
    },
    ...options,
  })
}

// Participant Mutations
export function useSetParticipantMusic(
  options?: UseMutationOptions<AxiosResponse, AxiosError, any>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data) => participantService.setParticipantMusic(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.participants.all })
    },
    ...options,
  })
}

export function useUpdateParticipantMusic(
  options?: UseMutationOptions<AxiosResponse, AxiosError, any>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data) => participantService.updateParticipantMusic(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.participants.all })
    },
    ...options,
  })
}

export function useSetParticipantDrawer(
  options?: UseMutationOptions<AxiosResponse, AxiosError, any>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data) => participantService.setParticipantDrawer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.participants.all })
    },
    ...options,
  })
}

export function useUpdateParticipantDrawer(
  options?: UseMutationOptions<AxiosResponse, AxiosError, any>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data) => participantService.updateParticipantDrawer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.participants.all })
    },
    ...options,
  })
}

export function useSetParticipantPhase(
  options?: UseMutationOptions<AxiosResponse, AxiosError, any>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data) => participantService.setParticipantPhase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.participants.phase })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.phases.all })
    },
    ...options,
  })
}

export function useUpdateParticipantPhase(
  options?: UseMutationOptions<AxiosResponse, AxiosError, any>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data) => participantService.updateParticipantPhase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.participants.phase })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.phases.all })
    },
    ...options,
  })
}

// Phase Mutations
export function useSetPhase(
  options?: UseMutationOptions<AxiosResponse, AxiosError, any>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data) => phaseService.setPhase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.phases.all })
    },
    ...options,
  })
}

export function useUpdatePhase(
  options?: UseMutationOptions<AxiosResponse, AxiosError, any>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data) => phaseService.updatePhase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.phases.all })
    },
    ...options,
  })
}
