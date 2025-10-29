// import { Roles } from '../types'
import type { ICategory } from 'src/Views/type'
import range from './range'
import { makeDataEddition } from './newEddition'

const newCategory = ({
  id = Math.floor(Math.random() * 1000),
}: {
  id?: number
}): ICategory => {
  return {
    id: id,
    // parentId?: number,
    name: (['MUSIC', 'DRAWER'] as const)[Math.floor(Math.random() * 2)],
    image: 'https://via.placeholder.com/150',
    // position?: number,
    description: 'Sample category description',
    isActive: Math.random() > 0.5,
    isFeatured: Math.random() > 0.5,
    eddition: makeDataEddition(2, id),
  }
}

export function makeDataCategory(...lens: Array<number>) {
  const makeDataLevel = (depth = 0): Array<ICategory> => {
    const len = lens[depth]!
    return range(len).map((_): ICategory => {
      return newCategory({})
    })
  }

  return makeDataLevel()
}

export default newCategory
