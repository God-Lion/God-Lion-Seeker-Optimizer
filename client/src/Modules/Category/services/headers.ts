import type {
  AxiosHeaders,
  AxiosRequestConfig,
  RawAxiosRequestHeaders,
} from 'axios'
// import Session from 'src/utils'

// eslint-disable-next-line import/no-anonymous-default-export
export default (): AxiosRequestConfig => {
  // const session = new Session()
  // const token = session.read('user')?.token
  return {
    headers: {
      // Authorization: `Bearer ${token}`,
      // 'Access-Control-Allow-Origin': '*',
      // 'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    } as unknown as AxiosHeaders,
  }
}
