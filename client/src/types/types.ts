/* eslint-disable no-unused-vars */

// Re-export shared types from IAuth to avoid duplication
export type { ISignup, IResetPassword, IUserReponseEmailResetPassword } from './IAuth'
// Re-export IParticipant from IUser to avoid duplication
export type { IParticipant } from './IUser'
import { IParticipant } from './IUser'

export interface ICategory {
  _id?: string
  id?: string
  name: string
  description?: string
  icon?: string
  color?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface IUpdateNames {
  firstname?: string
  lastname?: string
}

export interface IFormContest {
  lastname?: string
  firstname?: string
  email?: string
  user_id?: number | string
  [key: string]: any
}

export interface IContest {
  _id: string
  title?: string
  name?: string
  description?: string
  categoryId?: string
  startDate?: string
  endDate?: string
  status?: 'draft' | 'active' | 'closed'
  rules?: string
  prizes?: string[]
  editions?: Array<any>
  createdAt?: string
  updatedAt?: string
}

export interface IUser {
  _id?: string
  id?: string
  firstname?: string
  lastname?: string
  email?: string
  phone?: string
  role?: number | string
  avatar?: string
  [key: string]: any
}

export type IUserTypeWithAction = IUser & {
  action?: any
}

export type ITypeWithAction = IParticipant & {
  action?: any
  user?: IUser
}
