/* eslint-disable no-unused-vars */

export interface IResponse<T = any> {
  data?: T
  message: string
  success: boolean
  error?: string
  errors?: Record<string, string[]>
}

export interface IError {
  message: string
  field?: string
  code?: string
}
