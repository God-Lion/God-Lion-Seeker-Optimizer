import { providers } from 'src/Views/DashBoard/Provider/service'
import type { ICategory } from 'src/Views/type'

export const getCategories = () =>
  providers.map((provider) => provider.category as ICategory)
