import type { IPhase } from 'src/Views/type'
import range from './range'

const newPhase = ({
  id = Math.floor(Math.random() * 1000),
}: {
  id?: number
}): IPhase => {
  return {
    id: id,
    name: (['Phase1', 'Phase2', 'Phase3'] as const)[Math.floor(Math.random() * 3)],
  }
}

export function makeDataPhase(...lens: Array<number>) {
  const makeDataLevel = (depth = 0): Array<IPhase> => {
    const len = lens[depth]!
    return range(len).map((_): IPhase => {
      return newPhase({})
    })
  }

  return makeDataLevel()
}

export default newPhase
