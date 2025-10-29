/* eslint-disable eqeqeq */
import { makeDataUserSuperAdmin } from 'src/lib/utils'
const users = makeDataUserSuperAdmin(5)

export const getData = () => {
  return users
}

export const get = (id: number) => users.filter((user) => user.id == id)[0]
