import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Avatar,
  Box,
  Button,
  IconButton,
  List,
  ListItemIcon,
  Menu,
  Stack,
  Tooltip,
  Typography,
  Divider,
  MenuItem,
  CircularProgress,
} from '@mui/material'
import { Settings, ColorLens, Logout } from '@mui/icons-material'
import { useAuth } from '../store'
import { useSignOut } from '../services/hooks'
import type { IUserReponse } from '../types'

const Profile: React.FC<{ user: IUserReponse }> = ({ user }) => (
  <Stack direction='column'>
    <Stack
      direction='row'
      spacing={2}
      justifyContent='start'
      alignItems='center'
      sx={{
        mx: '15px',
        my: '9px',
      }}
    >
      <Avatar
        variant='circular'
        src={user?.avatar}
        alt={`${user?.firstName || ''} ${user?.lastName || ''}`}
        style={{
          width: '40px',
          height: '40px',
        }}
        sx={{
          margin: 'auto',
        }}
      >
        {!user?.avatar && (
          <ColorLens
            style={{
              width: '60px',
              height: '60px',
            }}
          />
        )}
      </Avatar>
      <Stack direction='column'>
        <Typography noWrap>
          {user?.firstName} {user?.lastName}
        </Typography>
        <Typography>{user?.email}</Typography>
      </Stack>
    </Stack>
    <Divider sx={{ backgroundColor: '#FFF000' }} />
  </Stack>
)

const AuthProfile = () => {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const { signOut, isSigningOut } = useSignOut({
    onSuccess: () => {
      console.log('[AuthProfile] User signed out successfully')
    },
  })

  // Extract user data from IAuth structure
  const user = authUser?.user

  // Don't render if no user
  if (!user) {
    return null
  }
  const settings: Array<{
    icon: React.JSX.Element
    name: string
    link: string
  }> = [
    // {
    //   // icon: <AccountCircle fontSize='small' />,
    //   // name: 'Account',
    //   link: 'account',
    //   component: <Profile user={user} />,
    // },
    {
      icon: <Settings fontSize='small' />,
      name: 'Settings',
      link: 'settings',
    },
  ]
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <React.Fragment>
      <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
        <Tooltip title='Account settings'>
          <IconButton
            onClick={handleClick}
            size='small'
            sx={{ ml: 2 }}
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup='true'
            aria-expanded={open ? 'true' : undefined}
          >
            <Avatar
              alt={`${user?.firstName || ''} ${user?.lastName || ''}`}
              src={user?.avatar}
              sx={{ width: 32, height: 32 }}
            />
          </IconButton>
        </Tooltip>
      </Box>
      <Menu
        anchorEl={anchorEl}
        id='account-menu'
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Profile user={user} />
        {settings?.map((setting, index) => (
          <List key={index}>
            <MenuItem
              onClick={() => {
                navigate(`/${setting.link}`)
                handleClose()
              }}
            >
              <ListItemIcon>{setting?.icon}</ListItemIcon>
              {setting?.name}
            </MenuItem>
          </List>
        ))}
        <Button
          variant='contained'
          color='error'
          disabled={isSigningOut}
          sx={{
            width: '95%',
            mx: '8px',
            my: '2px',
          }}
          endIcon={
            isSigningOut ? (
              <CircularProgress size={16} color='inherit' />
            ) : (
              <Logout fontSize='small' />
            )
          }
          onClick={() => {
            handleClose()
            signOut()
          }}
        >
          {isSigningOut ? 'Signing out...' : 'Logout'}
        </Button>
      </Menu>
    </React.Fragment>
  )
}

export default AuthProfile
