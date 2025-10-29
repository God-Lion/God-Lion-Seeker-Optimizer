// import { Roles } from '../types'
import type { IEddition } from 'src/Views/type'
import range from './range'
import { makeDataPhase } from './newPhase'
import { makeDataParticipant } from './newParticipant'

const newEddition = ({
  id = Math.floor(Math.random() * 1000),
  categoryId = Math.floor(Math.random() * 1000),
}: {
  id?: number
  categoryId?: number
  roleId?: number
}): IEddition => {
  return {
    id: id,
    categoryId: categoryId,
    name: `Edition ${Math.floor(Math.random() * 100)}`,
    start: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toString(),
    end: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toString(),
    theme: 'Sample theme',
    subject: 'Sample subject content',
    isActive: Math.random() > 0.5,
    isFeatured: Math.random() > 0.5,
    phase: makeDataPhase(3),
    participant: makeDataParticipant(5),
  }
}

export function makeDataEddition(...lens: Array<number>) {
  const makeDataLevel = (depth = 0): Array<IEddition> => {
    const len = lens[depth]!
    return range(len).map((_): IEddition => {
      return newEddition({})
    })
  }

  return makeDataLevel()
}

export default newEddition
