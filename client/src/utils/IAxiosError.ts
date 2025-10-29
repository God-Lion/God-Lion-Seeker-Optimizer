export default interface IAxiosError {
  message: string
  name: string
  stack: string
  config: Config
  code: string
  status?: any
}
export interface Config {
  transitional: Transitional
  adapter: string[]
  transformRequest: null[]
  transformResponse: null[]
  timeout: number
  xsrfCookieName: string
  xsrfHeaderName: string
  maxContentLength: number
  maxBodyLength: number
  env: Env
  headers: Headers
  baseURL: string
  withCredentials: boolean
  method: string
  url: string
  data: string
}
export interface Headers {
  Accept: string
  'Content-Type': string
  Authorization: string
}

export interface Env {}

export interface Transitional {
  silentJSONParsing: boolean
  forcedJSONParsing: boolean
  clarifyTimeoutError: boolean
}
