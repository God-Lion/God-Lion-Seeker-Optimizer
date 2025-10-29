import type { IEddition } from 'src/Views/type'
import { getCategories } from '../category/services'

const categories = getCategories()

export const getEdditions = () =>
  categories.map((category) => category?.eddition as Array<IEddition>)[0]
