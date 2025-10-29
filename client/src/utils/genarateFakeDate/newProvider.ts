import { Roles } from '../types'
import type { IProvider } from 'src/Views/type'
import newUser from './newUser'
import range from './range'
import { makeDataCategory } from './newCategory'

const newProvider = ({
  id = Math.floor(Math.random() * 1000),
}: {
  id?: number
}): IProvider => {
  const user = newUser({ roleId: Roles.PROVIDERADMIN })
  return {
    id: id,
    userId: user.id,
    logo: 'https://via.placeholder.com/150',
    name: `Provider ${Math.floor(Math.random() * 100)}`,
    phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    address: `${Math.floor(Math.random() * 9999) + 1} Main St, City, State ${Math.floor(Math.random() * 90000) + 10000}`,
    email: `provider${Math.floor(Math.random() * 100)}@example.com`,
    contactPersonName: `Contact Person ${Math.floor(Math.random() * 100)}`,
    contactPersonPhone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    contactPersonEmail: `contact${Math.floor(Math.random() * 100)}@example.com`,
    isActive: Math.random() > 0.5 ? 1 : 0,
    isApproved: Math.random() > 0.5 ? 1 : 0,
    isSuspended: Math.random() > 0.5 ? 1 : 0,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toString(),
    updatedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toString(),
    owner_provider: user,
    category: makeDataCategory(1)[0],
  }
}

export function makeDataProvider(...lens: Array<number>) {
  const makeDataLevel = (depth = 0): Array<IProvider> => {
    const len = lens[depth]!
    return range(len).map((_): IProvider => {
      return newProvider({})
    })
  }

  return makeDataLevel()
}

export default newProvider
