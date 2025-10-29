import React from 'react'
import type { ThemeColor } from 'src/lib/types'
import CustomAvatar from 'src/core/components/mui/Avatar'
import {
  Box,
  type ButtonProps,
  Card,
  CardContent,
  Chip,
  Divider,
  Typography,
  Button,
  Collapse,
  IconButton,
  type IconButtonProps,
} from '@mui/material'
// import { CheckBox, Work } from '@mui/icons-material'
import OpenDialogOnElementClick from './OpenDialogOnElementClick'
import type { IProvider } from 'src/Views/type'
// import { StatusObj } from '../utils'
// import EditUserInfo from 'src/components/dialogs/edit-user-info'
// import ConfirmationDialog from 'src/components/dialogs/confirmation-dialog'
// import OpenDialogOnElementClick from 'src/components/dialogs/OpenDialogOnElementClick'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
// import styled from '@mui/styles/styled'
import EditUserInfo from 'src/components/dialogs/edit-user-info'
import ConfirmationDialog from 'src/components/dialogs/confirmation-dialog'
import { styled } from '@mui/material/styles'
// const userData = {
//   firstName: 'Seth',
//   lastName: 'Hallam',
//   userName: '@shallamb',
//   billingEmail: 'shallamb@gmail.com',
//   status: 'active',
//   role: 'Subscriber',
//   taxId: 'Tax-8894',
//   contact: '+1 (234) 464-0600',
//   language: ['English'],
//   country: 'France',
//   useAsBillingAddress: true,
// }

const InfoDetail = ({ label, value }: { label: string; value: string }) => {
  return (
    <Box
      display='flex'
      alignItems='center'
      flexWrap='nowrap'
      rowGap={1.5}
      // marginRight='10px'
      // className='flex items-center flex-wrap gap-x-1.5'
    >
      <Typography
        className='font-medium'
        color='text.primary'
        sx={{
          marginRight: '10px',
        }}
      >
        {label}:
      </Typography>
      <Typography>{value}</Typography>
    </Box>
  )
}

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props
  return <IconButton {...other} />
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  borderRadius: 0,
  // transition: theme.transitions.create('transform', {
  //   duration: theme.transitions.duration.shortest,
  // }),
}))

const UserDetails = ({ data }: { data: IProvider }) => {
  const buttonProps = (
    children: string,
    color: ThemeColor,
    variant: ButtonProps['variant'],
  ): ButtonProps => ({
    children,
    color,
    variant,
  })

  const [expanded, setExpanded] = React.useState<boolean>(false)

  const handleExpandClick = () => {
    setExpanded(!expanded)
  }

  return (
    <>
      <Card>
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            paddingBlockStart: '3rem',
            gap: 6,
          }}
        >
          <Box display='flex' flexDirection='column' gap={6}>
            <Box
              display='flex'
              alignItems='center'
              justifyContent='center'
              flexDirection='column'
              gap={4}
            >
              <Box
                display='flex'
                flexDirection='column'
                alignItems='center'
                gap={4}
              >
                <CustomAvatar
                  alt='user-profile'
                  src={data.logo}
                  variant='rounded'
                  size={120}
                />
                <Typography
                  variant='h5'
                  fontSize='1.125rem'
                  fontWeight='500'
                  lineHeight='1.5556'
                >
                  {data.name}
                </Typography>
              </Box>
              {/* <Chip
                label='Author'
                color='secondary'
                size='small'
                variant='outlined'
              /> */}
            </Box>
            {/* <Box
              display='flex'
              alignItems='center'
              justifyContent='space-around'
              flexWrap='wrap'
              gap={4}
              // className='flex items-center justify-around flex-wrap gap-4'
            >
              <Box
                display='flex'
                alignItems='center'
                gap={4}
                justifyItems='center'
                // className='flex items-center gap-4'
              >
                <CustomAvatar variant='rounded' color='primary' skin='light'>
                  <CheckBox className='tabler-checkbox' />
                </CustomAvatar>
                <Box>
                  <Typography variant='h5'>1.23k</Typography>
                  <Typography>Task Done</Typography>
                </Box>
              </Box>
              <Box
                display='flex'
                alignItems='center'
                gap={4}
                // className='flex items-center gap-4'
              >
                <CustomAvatar variant='rounded' color='primary' skin='light'>
                  <Work className='tabler-briefcase' />
                </CustomAvatar>
                <Box>
                  <Typography variant='h5'>568</Typography>
                  <Typography>Project Done</Typography>
                </Box>
              </Box>
            </Box> */}
          </Box>
          <Box>
            <Typography
              variant='h5'
              fontSize='1.125rem'
              fontWeight='500'
              lineHeight='1.555'
            >
              Details
            </Typography>
            <Divider
              sx={{
                marginBlock: '1rem',
              }}
              // className='mlb-4'
            />
            <Box
              display='flex'
              flexDirection='column'
              gap={2}
              // className='flex flex-col gap-2'
            >
              <InfoDetail label='Phone' value={data.phone} />
              <InfoDetail label='Email' value={data.email} />
              <InfoDetail label='Address' value={data.address} />
              <Box
                display='flex'
                alignItems='center'
                flexWrap='wrap'
                rowGap={1.5}
              >
                <Typography
                  className='font-medium'
                  color='text.primary'
                  sx={{
                    marginRight: '10px',
                  }}
                >
                  Status:
                </Typography>
                {/* <Typography color='text.primary'>
                  {data?.isActive ? 'active' : 'inactive'}
                </Typography> */}
                <Chip
                  variant='outlined'
                  label={data.isActive ? 'active' : 'inactive'}
                  color={data.isActive ? 'success' : 'error'}
                  size='small'
                  sx={{
                    my: '10px',
                    textTransform: 'capitalize',
                  }}
                />
              </Box>
              <ExpandMore
                expand={expanded}
                onClick={handleExpandClick}
                aria-expanded={expanded}
                aria-label='show more'
                sx={{
                  borderRadius: 0,
                }}
              >
                <ExpandMoreIcon />
              </ExpandMore>
              <Collapse in={expanded} timeout='auto' unmountOnExit>
                <Box display='flex' flexDirection='column' gap={6}>
                  <Box
                    // display='flex'
                    // flexDirection='column'
                    // alignItems='center'
                    gap={4}
                  >
                    <CustomAvatar
                      alt='user-profile'
                      src={data.owner_provider.avatar}
                      // variant='rounded'
                      size={64}
                    />
                    {/* <Typography variant='h5'>{data.name}</Typography> */}
                  </Box>
                  <Box display='flex' flexDirection='column' gap={2}>
                    <InfoDetail
                      label='Firstname'
                      value={data.owner_provider.firstname}
                    />
                    <InfoDetail
                      label='Lastname'
                      value={data.owner_provider.lastname}
                    />
                    <InfoDetail
                      label='Email'
                      value={data.owner_provider.email}
                    />
                    <InfoDetail
                      label='Phone'
                      value={data.owner_provider.phone}
                    />
                  </Box>
                </Box>
              </Collapse>
              {/* <Box
                display='flex'
                alignItems='center'
                flexWrap='wrap'
                rowGap={1.5}
                // className='flex items-center flex-wrap gap-x-1.5'
              >
                <Typography className='font-medium' color='text.primary'>
                  Username:
                </Typography>
                <Typography>{userData?.userName}</Typography>
              </Box> */}
              {/* <Box
                display='flex'
                alignItems='center'
                flexWrap='wrap'
                gap={1.5}
                // className='flex items-center flex-wrap gap-x-1.5'
              >
                <Typography className='font-medium' color='text.primary'>
                  Billing Email:
                </Typography>
                <Typography>{userData.billingEmail}</Typography>
              </Box> */}

              {/* <Box
                display='flex'
                alignItems='center'
                flexWrap='wrap'
                rowGap={1.5}
                // className='flex items-center flex-wrap gap-x-1.5'
              >
                <Typography className='font-medium' color='text.primary'>
                  Role:
                </Typography>
                <Typography color='text.primary'>{userData.role}</Typography>
              </Box> */}
              {/* <Box
                display='flex'
                alignItems='center'
                flexWrap='wrap'
                gap={1.5}
                // className='flex items-center flex-wrap gap-x-1.5'
              >
                <Typography className='font-medium' color='text.primary'>
                  Tax ID:
                </Typography>
                <Typography color='text.primary'>{userData.taxId}</Typography>
              </Box> */}
              {/* <Box
                display='flex'
                alignItems='center'
                flexWrap='wrap'
                rowGap={1.5}
                // className='flex items-center flex-wrap gap-x-1.5'
              >
                <Typography className='font-medium' color='text.primary'>
                  Contact:
                </Typography>
                <Typography color='text.primary'>{userData.contact}</Typography>
              </Box> */}
              {/* <Box
                display='flex'
                alignItems='center'
                flexWrap='wrap'
                gap={1.5}
                // className='flex items-center flex-wrap gap-x-1.5'
              >
                <Typography className='font-medium' color='text.primary'>
                  Language:
                </Typography>
                <Typography color='text.primary'>
                  {userData.language}
                </Typography>
              </Box> */}
              {/* <Box
                display='flex'
                alignItems='center'
                flexWrap='wrap'
                rowGap={1.5}
                // className='flex items-center flex-wrap gap-x-1.5'
              >
                <Typography className='font-medium' color='text.primary'>
                  Country:
                </Typography>
                <Typography color='text.primary'>{userData.country}</Typography>
              </Box> */}
            </Box>
          </Box>
          <Box display='flex' gap={4} justifyContent='center'>
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps('Edit', 'primary', 'contained')}
              dialog={EditUserInfo}
              dialogProps={{ data: data }}
            />
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps('Suspend', 'error', 'contained')}
              dialog={ConfirmationDialog}
              dialogProps={{ type: 'suspend-account' }}
            />
          </Box>
        </CardContent>
      </Card>
    </>
  )
}

export default UserDetails
