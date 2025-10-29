import type { IPerson } from 'src/components/react-table/types'

const newPerson = (): IPerson => {
  return {
    firstName: `Person${Math.floor(Math.random() * 100)}`,
    lastName: `Last${Math.floor(Math.random() * 100)}`,
    age: Math.floor(Math.random() * 40) + 18,
    visits: Math.floor(Math.random() * 1000),
    progress: Math.floor(Math.random() * 100),
    status: (['relationship', 'complicated', 'single'] as const)[Math.floor(Math.random() * 3)],
  }
}

export default newPerson
