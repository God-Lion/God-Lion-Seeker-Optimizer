import { Roles } from './types'

const getRole = (roleId: number | string | undefined) => {
  if (roleId === null || roleId === undefined) return ''
  switch (roleId) {
    case Roles.USER:
      return 'USER'
    case Roles.PARTICIPANT:
      return 'PARTICIPANT'
    case Roles.JUDGE:
      return 'JUDGE'
    case Roles.PROVIDEREMPLOYEE:
      return 'PROVIDER-EMPLOYEE'
    case Roles.PROVIDERADMIN:
      return 'PROVIDER-ADMIN'
    case Roles.ADMIN:
      return 'ADMIN'
    case Roles.SUPERADMINEMPLOYEE:
      return 'SUPERADMIN-EMPLOYEE'
    case Roles.SUPERADMIN:
      return 'SUPER-ADMIN'
    default:
      return ''
  }
}

export default getRole
