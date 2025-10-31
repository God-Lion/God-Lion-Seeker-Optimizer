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
  })
}

export const handleValidateUser = (id: string | number, token: string) => {
  return useQuery({
    queryKey: ['valiateUser', id, token],
    queryFn: async () => await axios.get(`validate/${id}/${token}`),
  })
}

// export const signup = async (body) => {
//   try {
//     const res = await axios.post('signup', body, await config())
//     return res
//   } catch (error) {
//     return error
//   }
// }

// export const updatePhotoProfileUser = async (data) => {
//   try {
//     const formData = new FormData()
//     Object.keys(data).forEach((key) => {
//       formData.append(key, data[key])
//     })
//     const res = await axios.patch(`photoProfile/${data?.id}`, formData, {
//       headers: {
//         ...(await config().headers),
//         'Content-Type': 'multipart/form-data',
//       },
//     })
//     return res
//   } catch (error) {
//     return error
//   }
// }

export const handleRetriveAllCategory = (query: string = '') => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () =>
      (await axios.get(`category${query}`, await config())) as AxiosResponse<
        Array<ICategory>
      >,
  })
}
// export const setParticipantRegister = async (data) => {
//   try {
//     const formData = new FormData()
//     Object.keys(data).forEach((key) => {
//       formData.append(key, data[key])
//     })
//     const res = await axios.post(`participant`, formData, {
//       headers: {
//         ...(await config().headers),
//         'Content-Type': 'multipart/form-data',
//       },
//     })
//     return res
//   } catch (error) {
//     return error
//   }
// }

// export const UpdateParticipant = async (data) => {
//   try {
//     const formData = new FormData()
//     Object.keys(data).forEach((key) => {
//       formData.append(key, data[key])
//     })
//     const res = await axios.put(`participant`, formData, {
//       headers: {
//         ...(await config().headers),
//         'Content-Type': 'multipart/form-data',
//       },
//     })
//     return res
//   } catch (error) {
//     return error
//   }
// }

export const handleRetriveAllParticipant = (
  edition_id: number,
  query: string = '',
) => {
  return useQuery({
    queryKey: ['edition', 'participant', edition_id],
    queryFn: async () =>
      await axios.get(
        `edition/${edition_id}/participant${query}`,
        await config(),
      ),
  })
}
// export const handleRetriveAllParticipant = (edition_id, query = '') => {
//   return useQuery(
//     'participant',
//     async () =>
//       await axios.get(
//         `participant${query}`,
//         await config(),
//       ),
//   )
// }
export const handleRetriveParticipantBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['participant', slug],
    queryFn: async () =>
      (await axios.get(
        `participant/${slug}`,
        await config(),
      )) as AxiosResponse<IParticipant>,
  })
}

export const handleRetriveAllPhase = (query: string = '') => {
  return useQuery({
    queryKey: ['phases'],
    queryFn: async () => await axios.get(`phase${query}`, await config()),
  })
}

export const handleRetriveAllLogs = (query: string = '') => {
  return useQuery({
    queryKey: ['logs'],
    queryFn: async () => await axios.get(`logs${query}`, await config()),
  })
}

// export const setParticipantPhase = async (body) => {
//   try {
//     const res = await axios.post('participant/phase', body, await config())
//     return res
//   } catch (error) {
//     return error
//   }
// }

// export const updateParticipantPhase = async (body) => {
//   try {
//     const res = await axios.put('participant/phase', body, await config())
//     return res
//   } catch (error) {
//     return error
//   }
// }

export const handleRetriveAllParticipantsPhase = (query: string = '') => {
  return useQuery({
    queryKey: ['participants', 'phase'],
    queryFn: async () =>
      await axios.get(`participants/phase${query}`, await config()),
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
  })
}

// export const setPhase = async (body) => {
//   try {
//     const res = await axios.post('phase', body, await config())
//     return res
//   } catch (error) {
//     return error
//   }
// }

// export const updatePhase = async (body) => {
//   try {
//     const res = await axios.put('phase', body, await config())
//     return res
//   } catch (error) {
//     return error
//   }
// }

export const handleRetriveAllUser = (query: string = '') => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => await axios.get(`user${query}`, await config()),
  })
}

export const handleRetriveUser = (id: number, query: string = '') => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => await axios.get(`user/${id}${query}`, await config()),
  })
}

export const handlerRetriveUserByUserTypeID = (userTypeID: number) => {
  return useQuery({
    queryKey: ['users', userTypeID],
    queryFn: async () => await axios.get(`users/${userTypeID}`, await config()),
  })
}

export const handleRetriveAllJudge = (query: string = '') => {
  return useQuery({
    queryKey: ['judges'],
    queryFn: async () => await axios.get(`judge${query}`, await config()),
  })
}

export const handleRetriveJudgeByID = (id: number, query: string = '') => {
  return useQuery({
    queryKey: ['judge', id],
    queryFn: async () => await axios.get(`judge/${id}${query}`, await config()),
  })
}

export const handleRetriveJudgePhaseVote = () =>
  // id: number, query: string = ''
  {
    return useQuery({
      queryKey: ['judge', 'vote'],
      queryFn: async () => await axios.get(`judge/phase/vote`, await config()),
    })
  }

export const handleRetriveAllContest = (query: string = '') => {
  return useQuery({
    queryKey: ['contest'],
    queryFn: async () => await axios.get(`contest${query}`, await config()),
  })
}

export const handleRetriveAllEdition = (query: string = '') => {
  return useQuery({
    queryKey: ['edition'],
    queryFn: async () => await axios.get(`edition${query}`, await config()),
  })
}

export const handleLongPollingEvent = (query: string = '') => {
  return useQuery({
    queryKey: ['eventData'],
    queryFn: async () => await axios.get(`event${query}`, await config()),

    // onSuccess: (data: any) => {
    //   // Handle successful data fetch
    // },
    // onError: (error: any) => {
    //   console.error('Error:', error)
    //   // setTimeout(() => {
    //   //   queryClient.invalidateQueries('eventData')
    //   // }, 2000)
    // },
    staleTime: 1000 * 5,
  })
}
