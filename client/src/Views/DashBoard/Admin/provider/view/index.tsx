import React from 'react'
import {
  CreditCard,
  Lock,
  Notifications,
  PeopleOutline,
} from '@mui/icons-material'
import LinkIcon from '@mui/icons-material/Link'
import { Container, Tabs, Tab, Box } from '@mui/material'
import { primary, surface } from 'src/assets/colors'
import { useAuth } from 'src/store'
import { handleSettingProfile } from 'src/services/app'
import { ITab } from 'src/utils/types'
import Overview from './user-right/overview'
import Security from './user-right/security'
import BillingPlans from './user-right/billing-plans'
import Notificaton from './user-right/notifications'
import Connection from './user-right/connections'
// import UserLeftOverview from '@views/apps/user/view/user-left-overview'
// import UserRight from '@views/apps/user/view/user-right'

// const OverViewTab = dynamic(() => import('@views/apps/user/view/user-right/overview'))
// const SecurityTab = dynamic(() => import('@views/apps/user/view/user-right/security'))
// const BillingPlans = dynamic(() => import('@views/apps/user/view/user-right/billing-plans'))
// const NotificationsTab = dynamic(() => import('@views/apps/user/view/user-right/notifications'))
// const ConnectionsTab = dynamic(() => import('@views/apps/user/view/user-right/connections'))

// Vars
// const tabContentList = (data: Array<PricingPlanType>): { [key: string]: React.ReactElement } => ({
//   overview: <OverViewTab />,
//   security: <SecurityTab />,
//   'billing-plans': <BillingPlans data={data} />,
//   notifications: <NotificationsTab />,
//   connections: <ConnectionsTab />
// })

// const getPricingData = async () => {
//   // Vars
//   const res = await fetch(`${process.env.API_URL}/pages/pricing`)

//   if (!res.ok) {
//     throw new Error('Failed to fetch data')
//   }

//   return res.json()
// }

export default function index() {
  // Vars
  // const data = await getPricingData()
  // const provider =  getPricingData()
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Settings />
      </Box>
    </Box>
  )
}

function Settings() {
  const { user } = useAuth()
  const { data } = handleSettingProfile()
  console.log(data?.data.sessions)

  const tabs: Array<ITab> = [
    {
      key: 'overview',
      label: 'overview',
      icon: <PeopleOutline />,
      component: <Overview />,
    },
    {
      key: 'security',
      label: 'Security',
      icon: <Lock />,
      component: <Security />,
    },
    {
      key: 'billing-plan',
      label: 'Billing & Plan',
      icon: <CreditCard />,
      component: <BillingPlans data={[]} />,
    },
    {
      key: 'notificatons',
      label: 'Notificatons',
      icon: <Notifications />,
      component: <Notificaton />,
    },
    {
      key: 'connections',
      label: 'Connections',
      icon: <LinkIcon />,
      component: <Connection />,
    },
    // {
    //   key: 'profile',
    //   label: 'Profile',
    //   icon: <Person />,
    //   component: <Profile user={user} profile={data?.data.profile} />,
    // },
  ]
  const [value, setValue] = React.useState<number>(0)
  const [handleChange, setHandleChange] = React.useState<{
    event?: React.SyntheticEvent
    value: ITab
  }>({
    value: tabs[value],
  })
  const onChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
    setHandleChange({ event: event, value: tabs[newValue] })
  }

  return (
    <Container>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ flex: '1 1 20%' }}>
          <Tabs
            orientation='vertical'
            value={value}
            onChange={onChange}
            // centered
            variant='scrollable'
            scrollButtons={false}
            aria-label='scrollable filter'
            key={`Tabs${Math.random() * (Math.random() * tabs.length) + 100}`}
            sx={{
              minHeight: '38px',
              '& .MuiTabs-indicator': {
                display: 'none',
              },
            }}
          >
            {tabs.map((item) => (
              <Tab
                key={`Tab${item.key.toString()}${
                  Math.random() * (Math.random() * tabs.length) + 100
                }`}
                icon={item?.icon}
                iconPosition='start'
                label={item.label}
                sx={{
                  minHeight: '38px',
                  padding: '0.5rem 1.375rem',
                  mr: '10px',
                  borderRadius: '4px', //'50px',
                  // backgroundColor: primary[500],
                  // borderRadius: '30px',
                  '& .MuiTabs-indicator': {
                    display: 'none',
                  },
                  '&.Mui-selected': {
                    backgroundColor: primary[500],
                    color: surface[200],
                  },
                }}
              />
            ))}
          </Tabs>
        </Box>
        <Box sx={{ flex: '1 1 70%' }}>
          {handleChange?.value?.component}
        </Box>
      </Box>
    </Container>
  )
}
