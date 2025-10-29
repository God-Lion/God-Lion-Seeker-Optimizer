import { Roles } from '../types'
import type { IParticipant } from 'src/Views/type'
import range from './range'
import newUser from './newUser'

const newParticipant = (_p0: { roleId: Roles }): IParticipant => {
  return {
    user: newUser({}),
  }
}

export function makeDataParticipant(...lens: Array<number>) {
  const makeDataLevel = (depth = 0): Array<IParticipant> => {
    const len = lens[depth]!
    return range(len).map((_): IParticipant => {
      return newParticipant({
        roleId: Roles.PARTICIPANT,
      })
    })
  }

  return makeDataLevel()
}

export default newParticipant
