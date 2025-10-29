/* eslint-disable eqeqeq */
import { makeDataProvider } from 'src/utils/genarateFakeDate/newProvider'

export const providers = makeDataProvider(1)
// const provider = providers[0]
export const getData = () => providers

export const get = (id: number) =>
  providers.filter((provider) => provider.id == id)[0]
