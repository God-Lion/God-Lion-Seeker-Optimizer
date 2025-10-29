import { makeDataProvider } from 'src/utils/genarateFakeDate/newProvider'

const providers = makeDataProvider(5)

export const getData = () => {
  // Vars
  //   const res = await fetch(`${process.env.API_URL}/apps/user-list`)

  //   if (!res.ok) {
  //     throw new Error('Failed to fetch userData')
  //   }

  //   return res.json()
  return providers
}

export const get = (id: number) =>
  providers.filter((provider) => provider.id == id)[0]
