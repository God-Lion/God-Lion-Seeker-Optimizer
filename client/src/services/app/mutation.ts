// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import axios, { AxiosResponse } from 'axios'
import { baseUrl } from 'src/utils/api_link'
import config from 'src/services/headers'
import {
  IForgetPassword,
  IResetPassword,
  ISignup,
  IUserReponseForgetPassword,
  IUserReponse,
} from 'src/types'

import { IResponse } from 'src/types'
axios.defaults.baseURL = baseUrl()
axios.defaults.withCredentials = true

export const signUp = async (
  body: ISignup,
): Promise<AxiosResponse<IUserReponse>> =>
  await axios.post('signup', body, await config())

export const forgetPassword = async (
  body: IForgetPassword,
): Promise<AxiosResponse<IUserReponseForgetPassword>> =>
  await axios.post('forgot-password', body, await config())

export const resetPassword = async (
  body: IResetPassword,
): Promise<AxiosResponse<IUserReponse>> =>
  await axios.post('reset-password', body, await config())

export const updateNames = async (body: {
  lastname?: string
  firstname?: string
}): Promise<AxiosResponse<IResponse>> =>
  await axios.put('/users/update/names', body, await config())

export const updateEmail = async (body: {
  email?: string
  password: string
}): Promise<AxiosResponse<IResponse>> =>
  await axios.put('/update/email', body, await config())

export const updatePhotoProfileUser = async (data: any) => {
  try {
    const formData = new FormData()
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key])
    })
    return await axios.patch(`photoProfile/${data?.id}`, formData, {
      headers: {
        ...(await config().headers),
        'Content-Type': 'multipart/form-data',
      },
    })
  } catch (error) {
    return error
  }
}

export const setParticipantMusic = async (data: any) => {
  const formData = new FormData()
  Object.keys(data).forEach((key) => formData.append(key, data[key]))
  return axios.post(`participant/music`, formData, {
    headers: {
      ...(await config().headers),
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const UpdateParticipantMusic = async (data: any) => {
  try {
    const formData = new FormData()
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key])
    })
    return await axios.put(`participant/music`, formData, {
      headers: {
        ...(await config().headers),
        'Content-Type': 'multipart/form-data',
      },
    })
  } catch (error) {
    return error
  }
}

export const setParticipantDrawer = async (data: any) => {
  try {
    const formData = new FormData()
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key])
    })
    return await axios.post(`participant/drawer`, formData, {
      headers: {
        ...(await config().headers),
        'Content-Type': 'multipart/form-data',
      },
    })
  } catch (error) {
    return error
  }
}

export const UpdateParticipantDrawer = async (data: any) => {
  try {
    const formData = new FormData()
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key])
    })
    return await axios.put(`participant/drawer`, formData, {
      headers: {
        ...(await config().headers),
        'Content-Type': 'multipart/form-data',
      },
    })
  } catch (error) {
    return error
  }
}

export const setParticipantPhase = async (body: any) => {
  try {
    return await axios.post('participant/phase', body, await config())
  } catch (error) {
    return error
  }
}

export const updateParticipantPhase = async (body: any) => {
  try {
    return await axios.put('participant/phase', body, await config())
  } catch (error) {
    return error
  }
}

export const setPhase = async (body: any) => {
  try {
    return await axios.post('phase', body, await config())
  } catch (error) {
    return error
  }
}

export const updatePhase = async (body: any) => {
  try {
    return await axios.put('phase', body, await config())
  } catch (error) {
    return error
  }
}
