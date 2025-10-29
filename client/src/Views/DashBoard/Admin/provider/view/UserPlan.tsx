import React from 'react'
// import Card from '@mui/material/Card'
// import CardContent from '@mui/material/CardContent'
// import Chip from '@mui/material/Chip'
// import Typography from '@mui/material/Typography'
// import LinearProgress from '@mui/material/LinearProgress'
// import Button from '@mui/material/Button'
// import type { ButtonProps } from '@mui/material/Button'
// import UpgradePlan from '@components/dialogs/upgrade-plan'
// import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

import {
  type ButtonProps,
  Card,
  CardContent,
  Chip,
  Typography,
  LinearProgress,
  Button,
  Box,
} from '@mui/material'
import OpenDialogOnElementClick from './OpenDialogOnElementClick'
import { Circle } from '@mui/icons-material'
import UpgradePlan from 'src/components/dialogs/upgrade-plan'

const InfoPlanDetail = ({
  children,
  icon = (
    <Circle
      sx={{ fontSize: '10px' }}
      // className='tabler-circle-filled text-[10px] text-secondary'
    />
  ),
}: {
  children: string | React.JSX.Element
  icon?: React.JSX.Element
}) => {
  return (
    <Box display='flex' alignItems='center' gap={2}>
      {icon}
      <Typography component='span'>{children}</Typography>
    </Box>
  )
}

const UserPlan = () => {
  const buttonProps: ButtonProps = {
    variant: 'contained',
    children: 'Upgrade Plan',
  }

  return (
    <>
      <Card
        sx={{
          borderWidth: '2px',
          borderColor: '#F57F17',
          borderRadius: '0.375rem',
          boxShadow: '0px 2px 6px rgb(115 103 240 / 0.3)',
        }}
        // className='border-2 border-primary rounded shadow-primarySm'
      >
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            paddingBlockEnd: '1.5rem',
            paddingBottom: '9px',
          }}
          // className='flex flex-col gap-6'
        >
          <Box display='flex' justifyContent='space-between'>
            <Chip
              label='Standard'
              size='small'
              color='primary'
              variant='outlined'
            />
            <Box
              // display='flex'
              justifyContent='center'
            >
              <Typography
                variant='h5'
                component='sup'
                alignItems='flex-start'
                // className='self-start'
                color='primary'
              >
                $
              </Typography>
              <Typography
                component='span'
                variant='h1'
                color='primary'
                sx={{
                  fontWeight: 500,
                  fontSize: '2.875rem',
                  lineHeight: '1.47826',
                }}
              >
                99
              </Typography>
              <Typography
                component='sub'
                alignItems='flex-end'
                // className='self-end'
                color='text.primary'
                sx={{
                  fontWeight: 400,
                  fontSize: '0.9375rem',
                  lineHeight: '1.46667',
                }}
              >
                /month
              </Typography>
            </Box>
          </Box>
          <Box display='flex' flexDirection='column' gap={2}>
            <InfoPlanDetail children='10 Users' />
            <InfoPlanDetail children='Up to 10 GB storage' />
            <InfoPlanDetail children='Basic Support' />
          </Box>
          <Box display='flex' flexDirection='column' gap={1}>
            <Box
              display='flex'
              alignItems='center'
              justifyContent='space-between'
              // className='flex items-center justify-between'
            >
              <Typography className='font-medium' color='text.primary'>
                Days
              </Typography>
              <Typography className='font-medium' color='text.primary'>
                26 of 30 Days
              </Typography>
            </Box>
            <LinearProgress variant='determinate' value={65} />
            <Typography variant='body2'>4 days remaining</Typography>
          </Box>
          <OpenDialogOnElementClick
            element={Button}
            elementProps={buttonProps}
            dialog={UpgradePlan}
          />
        </CardContent>
      </Card>
    </>
  )
}

export default UserPlan
