import { faker } from '@faker-js/faker'
import type { IPerson } from './types'

const range = (len: number) => {
  const arr: number[] = []
  for (let i = 0; i < len; i++) arr.push(i)
  return arr
}

const newPerson = (): IPerson => {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    age: faker.number.int({ min: 18, max: 65 }),
    visits: faker.number.int({ min: 0, max: 1000 }),
    progress: faker.number.int({ min: 0, max: 100 }),
    status: faker.helpers.arrayElement<IPerson['status']>([
      'relationship',
      'complicated',
      'single',
    ]),
  }
}

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
