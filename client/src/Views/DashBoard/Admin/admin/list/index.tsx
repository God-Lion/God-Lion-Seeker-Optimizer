import { getData } from '../service'
import LocalTable from './list/LocalTable'
import { Box } from '@mui/material'
import UserListCards from './AdminAnalyticCards'
import type { IUser } from 'src/Views/type'

export default function index() {
  // Vars
  const data = getData()

  return <UserList data={data} />
}

const UserList = ({ data }: { data: Array<IUser> }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <UserListCards />
      </Box>
      <Box>
        <AdminListTable data={data} />
      </Box>
    </Box>
  )
}

function AdminListTable({ data }: { data: Array<IUser> }) {
  return <LocalTable data={data} />
}
