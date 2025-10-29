import type { ICategory } from 'src/Views/type'
import LocalTable from './list/LocalTable'
import Box from '@mui/material/Box'
import { getCategories } from '../services'

export default function index() {
  const data = getCategories()

  return <UserList data={data} />
}

const UserList = ({ data }: { data: Array<ICategory> }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* <Box>
        <UserListCards />
      </Box> */}
      <Box>
        <CategoryListTable data={data} />
      </Box>
    </Box>
  )
}

function CategoryListTable({ data }: { data: Array<ICategory> }) {
  return <LocalTable data={data} />
}
