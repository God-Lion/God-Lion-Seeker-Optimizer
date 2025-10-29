import React from 'react'
import type { MouseEvent } from 'react'
import {
  Avatar,
  Badge,
  Box,
  Button,
  ClickAwayListener,
  CircularProgress,
  Divider,
  Fade,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Typography,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import {
  AttachMoney,
  Help,
  Logout,
  Person,
  Settings,
} from '@mui/icons-material'
import { useSettings } from 'src/core/contexts/settingsContext'
import { useAuth } from 'src/store'
import { useSignOut } from 'src/lib/hooks'
import { useNavigate } from 'react-router-dom'

const BadgeContentSpan = styled('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  cursor: 'pointer',
  backgroundColor: 'var(--mui-palette-success-main)',
  boxShadow: '0 0 0 2px var(--mui-palette-background-paper)',
})

const UserDropdown = () => {
  const { user: authUser } = useAuth()
  const { signOut, isSigningOut } = useSignOut({
    onSuccess: () => {
      console.log('[UserDropdown] User signed out successfully')
      setOpen(false)
    },
  })
  const [open, setOpen] = React.useState<boolean>(false)
  const anchorRef = React.useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { settings } = useSettings()

  // Extract user data from IAuth structure
  const user = authUser?.user

  const handleDropdownOpen = () => {
    !open ? setOpen(true) : setOpen(false)
  }

  const handleDropdownClose = (
    event?: MouseEvent<HTMLLIElement> | (MouseEvent | TouchEvent),
    url?: string,
  ) => {
    if (url) navigate(url)

    if (
      anchorRef.current &&
      anchorRef.current.contains(event?.target as HTMLElement)
    )
      return

    setOpen(false)
  }

  const handleUserLogout = () => {
    signOut()
  }

  return (
    <React.Fragment>
      <Badge
        ref={anchorRef}
        overlap='circular'
        badgeContent={<BadgeContentSpan onClick={handleDropdownOpen} />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{
          marginInlineStart: '0.5rem',
        }}
      >
        <Avatar
          ref={anchorRef}
          alt={user?.firstName || ''}
          src={user?.avatar || ''}
          onClick={handleDropdownOpen}
          sx={{
            cursor: 'pointer',
            blockSize: '38px',
            inlineSize: '38px',
          }}
        />
      </Badge>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        sx={{
          minInlineSize: '240px',
          marginBlockStart: '0.75rem !important',
          zIndex: 1,
        }}
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom-end' ? 'right top' : 'left top',
            }}
          >
            <Paper
              sx={{
                ...(settings.skin === 'bordered'
                  ? {
                      borderWidth: '1px',
                      // --tw-shadow: 0 0 #0000;
                      // --tw-shadow-colored: 0 0 #0000;
                      boxShadow:
                        'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)',
                    }
                  : {
                      //--tw-shadow: var(--mui-customShadows-lg);
                      // --tw-shadow-colored: var(--mui-customShadows-lg);
                      boxShadow:
                        'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)',
                    }),
              }}
              // className={
              //   settings.skin === 'bordered'
              //     ? 'border shadow-none'
              //     : 'shadow-lg'
              // }
            >
              <ClickAwayListener
                onClickAway={(e) =>
                  handleDropdownClose(e as MouseEvent | TouchEvent)
                }
              >
                <MenuList>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      paddingBlock: '0.5rem',
                      paddingInline: '1.5rem',
                      gap: '0.5rem',
                    }}
                    tabIndex={-1}
                  >
                    <Avatar
                      alt={user?.firstName || ''}
                      src={user?.avatar || ''}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        flexDirection: 'column',
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 500,
                        }}
                        color='text.primary'
                      >
                        {user?.firstName || ''}
                      </Typography>
                      <Typography variant='caption'>
                        {user?.email || ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider
                    sx={{
                      marginBlock: '0.25rem',
                    }}
                  />
                  <MenuItem
                    onClick={(e) =>
                      handleDropdownClose(e, '/pages/user-profile')
                    }
                    sx={{
                      marginInline: '0.5rem',
                      gap: '0.75rem',
                    }}
                  >
                    <Person sx={{ fontSize: '22px' }} />
                    <Typography color='text.primary'>My Profile</Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={(e) =>
                      handleDropdownClose(e, '/pages/account-settings')
                    }
                    sx={{
                      marginInline: '0.5rem',
                      gap: '0.75rem',
                    }}
                  >
                    <Settings sx={{ fontSize: '22px' }} />
                    <Typography color='text.primary'>Settings</Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={(e) => handleDropdownClose(e, '/pages/pricing')}
                    sx={{
                      marginInline: '0.5rem',
                      gap: '0.75rem',
                    }}
                  >
                    <AttachMoney sx={{ fontSize: '22px' }} />
                    <Typography color='text.primary'>Pricing</Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={(e) => handleDropdownClose(e, '/pages/faq')}
                    sx={{
                      marginInline: '0.5rem',
                      gap: '0.75rem',
                    }}
                  >
                    <Help sx={{ fontSize: '22px' }} />
                    <Typography color='text.primary'>FAQ</Typography>
                  </MenuItem>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      paddingBlock: '0.5rem',
                      paddingInline: '0.75rem',
                    }}
                  >
                    <Button
                      fullWidth
                      variant='contained'
                      color='error'
                      size='small'
                      disabled={isSigningOut}
                      endIcon={
                        isSigningOut ? (
                          <CircularProgress size={16} color='inherit' />
                        ) : (
                          <Logout />
                        )
                      }
                      onClick={handleUserLogout}
                      sx={{
                        '& .MuiButton-endIcon': { marginInlineStart: 1.5 },
                      }}
                    >
                      {isSigningOut ? 'Signing out...' : 'Logout'}
                    </Button>
                  </Box>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </React.Fragment>
  )
}

export default UserDropdown
