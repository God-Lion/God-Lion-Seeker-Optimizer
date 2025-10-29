/* eslint-disable no-unused-vars */

export interface ISession {
  id: string
  userId: string
  device: string
  browser: string
  ip: string
  location: string
  lastActive: string
  current?: boolean
}

export interface IUserReponse {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  avatar?: string
  sessions?: ISession[]
}

export interface IAuth {
  user: IUserReponse
  token: string
  refreshToken?: string
}

export interface ILogin {
  email: string
  password: string
  rememberMe?: boolean
}

export interface ISignup {
  firstName?: string
  lastName?: string
  firstname?: string
  lastname?: string
  email: string
  phone?: string
  password: string
  confirmPassword: string
  isTermsSign?: boolean
}

export interface IForgetPassword {
  email: string
}

export interface IResetPassword {
  token: string
  email?: string
  password: string
  confirmPassword: string
}

export interface IUserReponseForgetPassword {
  message: string
  success: boolean
}

export interface IUserReponseEmailResetPassword {
  message: string
  success: boolean
  token?: string
  isSignatureValid?: boolean
}

export interface IProfileSettingsReponse {
  message: string
  success: boolean
  user?: IUserReponse
  sessions?: ISession[]
}
