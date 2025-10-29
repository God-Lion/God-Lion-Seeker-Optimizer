import type { IPhase } from 'src/Views/type'
import { getEdditions } from '../edditon/services'

const edditions = getEdditions()

export const getPhases = () =>
  edditions.map((eddition) => eddition.phase as Array<IPhase>)[0]
