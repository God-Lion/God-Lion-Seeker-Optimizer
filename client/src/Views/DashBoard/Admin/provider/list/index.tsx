import { getData } from '../service'
import type { IProvider } from 'src/Views/type'
import LocalTable from './list/LocalTable'
import { Box } from '@mui/material'
import UserListCards from './UserListCards'

export default function index() {
  // Vars
  const data = getData()

  return <UserList data={data} />
}

const UserList = ({ data }: { data: Array<IProvider> }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <UserListCards />
      </Box>
      <Box>
        <ProviderListTable data={data} />
      </Box>
    </Box>
  )
}

function ProviderListTable({ data }: { data: Array<IProvider> }) {
  return <LocalTable data={data} />
}
