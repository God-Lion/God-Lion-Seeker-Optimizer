import Box from '@mui/material/Box'
import UserDetails from './UserDetails'
import { useParams } from 'react-router-dom'
import { get } from '../service'
import UserPlan from './UserPlan'
// import UserPlan from './UserPlan'

const UserLeftOverview = () => {
  const { id } = useParams()
  const data = get(id as unknown as number)
  console.log('data ', data)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {data && (
        <Box>
          <UserDetails data={data} />
        </Box>
      )}

      <Box>
        <UserPlan />
      </Box>
    </Box>
  )
}

export default UserLeftOverview
