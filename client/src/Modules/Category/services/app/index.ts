/* eslint-disable react-hooks/rules-of-hooks */
import { useQuery } from '@tanstack/react-query'
import axios, { AxiosResponse } from 'axios'
import { baseUrl } from 'src/utils/api_link'
import config from 'src/services/headers'
import { ICategory } from 'src/types'

axios.defaults.baseURL = baseUrl()
axios.defaults.withCredentials = true

export const handleRetriveAllCategory = (query: string = '') => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () =>
      (await axios.get(`category${query}.json`, config())) as AxiosResponse<
        Array<ICategory>
      >,
  })
}
