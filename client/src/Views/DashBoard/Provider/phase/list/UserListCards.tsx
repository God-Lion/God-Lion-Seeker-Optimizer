import Grid from '@mui/material/GridLegacy'
import type { UserDataType } from './type'
import HorizontalWithSubtitle from './HorizontalWithSubtitle'
import { Group, PersonAddAlt } from '@mui/icons-material'

const data: Array<UserDataType> = [
  {
    title: 'Session',
    value: '21,459',
    avatarIcon: <Group />,
    avatarColor: 'primary',
    change: 'positive',
    changeNumber: '29%',
    subTitle: 'Total User',
  },
  {
    title: 'Paid Users',
    value: '4,567',
    avatarIcon: <PersonAddAlt />,
    avatarColor: 'error',
    change: 'positive',
    changeNumber: '18%',
    subTitle: 'Last week analytics',
  },
  {
    title: 'Active Users',
    value: '19,860',
    avatarIcon: 'tabler-user-check',
    avatarColor: 'success',
    change: 'negative',
    changeNumber: '14%',
    subTitle: 'Last week analytics',
  },
  {
    title: 'Pending Users',
    value: '237',
    avatarIcon: 'tabler-user-search',
    avatarColor: 'warning',
    change: 'positive',
    changeNumber: '42%',
    subTitle: 'Last week analytics',
  },
]

const UserListCards = () => {
  return (
    <Grid container spacing={6}>
      {data.map((item, i) => (
        <Grid key={i} item xs={12} sm={6} md={3}>
          <HorizontalWithSubtitle {...item} />
        </Grid>
      ))}
    </Grid>
  )
}

export default UserListCards
