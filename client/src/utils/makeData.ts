import type { IPerson } from 'src/components/react-table/types'
import { Roles } from './types'
import type { IUser } from 'src/Views/type'
import newPerson from './genarateFakeDate/newPerson'
import newUser from './genarateFakeDate/newUser'
import range from './genarateFakeDate/range'

export function makeData(...lens: Array<number>) {
  const makeDataLevel = (depth = 0): Array<IPerson> => {
    const len = lens[depth]!
    return range(len).map((_): IPerson => {
      return {
        ...newPerson(),
        subRows: lens[depth + 1] ? makeDataLevel(depth + 1) : undefined,
      }
    })
  }

  return makeDataLevel()
}

export function makeDataUserSuperAdmin(...lens: Array<number>) {
  const makeDataLevel = (depth = 0): Array<IUser> => {
    const len = lens[depth]!
    return range(len).map((_): IUser => {
      return newUser({
        roleId: [Roles.ADMIN, Roles.SUPERADMINEMPLOYEE, Roles.SUPERADMIN][Math.floor(Math.random() * 3)]!,
      })
    })
  }

  return makeDataLevel()
}
