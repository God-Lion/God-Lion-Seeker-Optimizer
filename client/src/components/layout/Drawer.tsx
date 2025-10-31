import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  AvatarProps,
} from '@mui/material'
import CssBaseline from '@mui/material/CssBaseline'
import { useTheme, styled } from '@mui/material/styles'
// import MuiAppBar from '@mui/material/AppBar'
import {
  AccountCircle,
  ChevronLeft,
  ExpandMore,
  Settings,
} from '@mui/icons-material'
import MenuIcon from '@mui/icons-material/Menu'
import DarkIcon from '@mui/icons-material/Brightness4'
import LightIcon from '@mui/icons-material/Brightness7'
import { Logout } from '@mui/icons-material'
import { useTheme as useAppTheme, useAuth } from 'src/store'
import Session from 'src/utils'
//Ressource
import { showPermissions } from 'src/utils'
import Logo from 'src/assets/svg/Logo'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import userMenu from './DrawerMenu'
import UserDropdown from './shared/UserDropdown'
import LanguageDropdown from './shared/LanguageDropdown'
import NotificationsDropdown from './shared/NotificationsDropdown'
import NavSearch from './shared/search'
import ModeDropdown from './shared/ModeDropdown'
import ShortcutsDropdown from './shared/ShortcutsDropdown'
import { Roles } from 'src/utils/types'
const drawerWidth = 250

// const AppBar = styled(MuiAppBar, {
//   shouldForwardProp: (prop) => prop !== 'open',
// })(
//   ({
//     theme,
//     // open
//   }) => ({
//     // backgroundColor: whiteColor,
//     zIndex: theme.zIndex.drawer + 1,
//     transition: theme.transitions.create(['width', 'margin'], {
//       easing: theme.transitions.easing.sharp,
//       duration: theme.transitions.duration.leavingScreen,
//     }),
//     // ...(open && {
//     //   marginLeft: drawerWidth,
//     //   width: `calc(100% - ${drawerWidth}px)`,
//     //   transition: theme.transitions.create(['width', 'margin'], {
//     //     easing: theme.transitions.easing.sharp,
//     //     duration: theme.transitions.duration.enteringScreen,
//     //   }),
//     // }),
//   }),
// )

interface IAppBarProps extends MuiAppBarProps {
  open?: boolean
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<IAppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}))

const black = '#FFFFFF' // '#000000'

export default function DrawerSide({
  children,
  window,
}: {
  children: React.JSX.Element
  window?: any
}) {
  const { toggleColorMode } = useAppTheme()
  // const { user, contests, editions, setCurrentContestId, setCurrentEditionId } =
  //   React.useContext(GlobalContext)

  const theme = useTheme()
  const showMenu = userMenu(
    Roles.PROVIDERADMIN,
    // user.role
  )
  const navigate = useNavigate()
  const location = useLocation()
  // const { window } = props
  const [open, setOpen] = React.useState<boolean>(true)
  const handleDrawerToggle = () => {
    setOpen(!open)
  }
  const container =
    window !== undefined ? () => window().document.body : undefined
  // React.useEffect(() => {
  //   set()
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [user])

  // eslint-disable-next-line no-unused-vars

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position='absolute'
        open={open}
        // color='secondary'
      >
        <Toolbar
          sx={{
            pr: '24px',

            // keep right padding when drawer closed
          }}
        >
          <IconButton
            edge='start'
            color='inherit'
            aria-label='open drawer'
            onClick={handleDrawerToggle}
            sx={{
              // marginRight: '36px',
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon
              sx={{
                color: 'black',
              }}
            />
          </IconButton>
          {/* {!open && (
            <Avatar
              // sx={{ m: 1, bgcolor: 'primary.main' }}
              variant='square'
              src={logo}
              alt='logo'
              sx={{
                // width: '3%',
                // height: '3%',
                m: {
                  xs: 2,
                  // md: 3
                },
              }}
            />
          )}

          <Grid container spacing={2}>
            <Grid item xs={6} lg={9}></Grid>

            <Grid item xs={6} lg={3}>
              <Box
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Profile />
              </Box>
            </Grid>
          </Grid> */}
          <Stack direction='row'>
            <NavSearch />
            <LanguageDropdown />
            <ModeDropdown />
            <ShortcutsDropdown shortcuts={shortcuts} />
            <NotificationsDropdown notifications={notifications} />
            <UserDropdown />
          </Stack>
        </Toolbar>
      </AppBar>

      <Box
        component='nav'
        sx={{
          display: { xs: 'none', sm: 'none', md: 'block' },
          flexShrink: { sm: 0 },
        }}
        aria-label='mailbox folders'
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        {/* Mobil */}
        <Drawer
          container={container}
          variant='temporary'
          open={open}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: {
              xs: 'block',
              md: 'none',
            },
            '& .MuiDrawer-paper': {
              // backgroundColor: primaryColor,
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              color: black,
              px: [1],
            }}
          >
            <Stack
              direction='row'
              spacing={2}
              justifyContent='space-between'
              sx={{ width: '100%', pt: '10px' }}
            >
              <Stack direction='column' sx={{ m: { xs: 2 } }}>
                <Logo />
              </Stack>

              <Stack
                direction='row'
                sx={{
                  py: '15px',
                }}
              >
                <Stack direction='column'>
                  <IconButton
                    sx={{ ml: 1 }}
                    onClick={toggleColorMode}
                    color='inherit'
                  >
                    {theme.palette.mode === 'dark' ? (
                      <LightIcon />
                    ) : (
                      <DarkIcon />
                    )}
                  </IconButton>
                </Stack>
                <Stack direction='column'>
                  <IconButton onClick={handleDrawerToggle}>
                    <ChevronLeft />
                  </IconButton>
                </Stack>
              </Stack>
              {/* <Stack direction='column'></Stack> */}
            </Stack>
          </Toolbar>
          <Divider />
          {/* <div>
            <Avatar style={{ width: 90, height: 90, backgroundColor: '#fff' }}>
              <img
                src={logo}
                style={{ width: 170, height: 70, borderRadius: 70 }}
              />
            </Avatar>
          </div> */}
          <List style={{ marginLeft: 5 }}>
            {showMenu?.map((el) => {
              if (el?.link === undefined) {
                return (
                  <Accordion
                    key={`${Math.random()}}`}
                    style={{
                      // backgroundColor: primaryColor,
                      zIndex: 2,
                    }}
                  >
                    <AccordionSummary
                      expandIcon={
                        <ExpandMore
                          style={{
                            color: black,
                          }}
                        />
                      }
                      aria-controls='panel1a-content'
                      id='panel1a-header'
                    >
                      <ListItemButton
                        style={{
                          padding: '0px',
                        }}
                      >
                        <ListItemIcon>{el?.icon}</ListItemIcon>
                        <ListItemText
                          style={{ color: black }}
                          primary={el?.name}
                        />
                      </ListItemButton>
                    </AccordionSummary>
                    <AccordionDetails
                    // style={{
                    //   backgroundColor: theme.palette.primary,
                    //   background: 'inherit',
                    //   py: '0px',
                    // }}
                    >
                      <List>
                        {el?.menu?.map((submenu) => {
                          return (
                            <ListItemButton
                              key={`${Math.random()}}`}
                              selected={
                                location.pathname.split('/')[1] ===
                                submenu?.link
                              }
                              sx={{
                                '&.MuiListItemButton-root.Mui-selected': {
                                  borderRight: '8px solid #fff',
                                },
                              }}
                              onClick={() => {
                                navigate(`/${submenu?.link}`)
                              }}
                            >
                              <ListItemIcon>{submenu?.icon}</ListItemIcon>
                              <ListItemText
                                style={{
                                  textDecoration: 'none',
                                  color: black,
                                }}
                                primary={submenu?.name}
                              />
                            </ListItemButton>
                          )
                        })}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )
              }
              return (
                <ListItemButton
                  key={`${Math.random()}}`}
                  selected={location.pathname.split('/')[1] === el?.link}
                  sx={{
                    '&.MuiListItemButton-root.Mui-selected': {
                      borderRight: '8px solid #fff',
                      zIndex: 1,
                    },
                  }}
                  onClick={() => {
                    navigate(`/${el.link}`)
                  }}
                >
                  <ListItemIcon>{el.icon}</ListItemIcon>
                  <ListItemText
                    style={{
                      textDecoration: 'none',
                      color: black,
                    }}
                    primary={el?.name}
                  />
                </ListItemButton>
              )
            })}
          </List>
        </Drawer>
        {/* Desktop */}
        <Drawer
          container={container}
          variant='permanent'
          open={open}
          sx={{
            '& .MuiDrawer-paper': {
              // backgroundColor: primaryColor,
              position: 'relative',
              whiteSpace: 'nowrap',
              width: drawerWidth,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              boxSizing: 'border-box',
              ...(!open && {
                overflowX: 'hidden',
                transition: theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.leavingScreen,
                }),
                width: theme.spacing(7),
                [theme.breakpoints.up('sm')]: {
                  width: theme.spacing(9),
                },
                '& .MuiAccordion-root': {
                  '& .MuiAccordionSummary-root': {
                    justifyContent: 'normal',
                    '& .MuiAccordionSummary-expandIconWrapper': {
                      display: 'none',
                    },

                    '& .MuiListItemText-root': { display: 'none' },
                  },
                  '& .MuiAccordionDetails-root': {
                    padding: '0px',
                  },
                },
              }),
            },
          }}
        >
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              color: black,
              px: [1],
            }}
          >
            <Stack direction='column' spacing={2}>
              <Stack
                direction='row'
                spacing={2}
                justifyContent='space-between'
                sx={{ width: '100%', pt: '10px' }}
              >
                <Stack direction='column' sx={{ m: { xs: 2 } }}>
                  <Logo />
                </Stack>

                <Stack
                  direction='row'
                  sx={{
                    py: '15px',
                  }}
                >
                  <Stack direction='column'>
                    <IconButton
                      sx={{ ml: 1 }}
                      onClick={toggleColorMode}
                      color='inherit'
                    >
                      {theme.palette.mode === 'dark' ? (
                        <LightIcon />
                      ) : (
                        <DarkIcon />
                      )}
                    </IconButton>
                  </Stack>
                  <Stack direction='column'>
                    <IconButton onClick={handleDrawerToggle}>
                      <ChevronLeft />
                    </IconButton>
                  </Stack>
                </Stack>
              </Stack>
              {/* <Stack direction='row'>
                <FormControl fullWidth>
                  <InputLabel required>Concours</InputLabel>
                  <Select
                    label='Concours'
                    onChange={(event) => {
                      setCurrentContestId(event.target.value)
                    }}
                  >
                    {contests?.map((contest: IContest, index: number) => (
                      <MenuItem key={index} value={contest.id}>
                        {contest.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <Stack direction='row'>
                <FormControl fullWidth>
                  <InputLabel required>Edition</InputLabel>
                  <Select
                    label='Edition'
                    // defaultValue={2}
                    onChange={(event) => {
                      setCurrentEditionId(event.target.value)
                    }}
                  >
                    {editions?.map((edition: IEdition, index: number) => (
                      <MenuItem key={index} value={edition.id}>
                        {edition.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack> */}
            </Stack>
          </Toolbar>
          <Divider />
          <div>
            <Typography component='h2' gutterBottom variant='h5'></Typography>
          </div>
          <List
            style={{
              marginLeft: 5,
              height: '86vh',
            }}
          >
            {showMenu?.map((el) => {
              if (el?.link === undefined) {
                return (
                  <Accordion
                    key={`${Math.random()}}`}
                    style={{
                      // backgroundColor: primaryColor,
                      zIndex: 2,
                    }}
                  >
                    <AccordionSummary
                      expandIcon={
                        <ExpandMore
                          style={{
                            color: black,
                          }}
                        />
                      }
                      aria-controls='panel1a-content'
                      id='panel1a-header'
                    >
                      <ListItemButton
                        style={{
                          padding: '0px',
                        }}
                      >
                        <ListItemIcon>{el?.icon}</ListItemIcon>
                        <ListItemText
                          style={{ color: black }}
                          primary={el?.name}
                        />
                      </ListItemButton>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {el?.menu?.map((submenu) => {
                          return (
                            <ListItemButton
                              key={`${Math.random()}}`}
                              selected={
                                location.pathname.split('/')[1] ===
                                submenu?.link
                              }
                              sx={{
                                '&.MuiListItemButton-root.Mui-selected': {
                                  borderRight: '8px solid #fff',
                                },
                              }}
                              onClick={() => {
                                navigate(`/${submenu?.link}`)
                              }}
                            >
                              <ListItemIcon>{submenu?.icon}</ListItemIcon>
                              <ListItemText
                                style={{
                                  textDecoration: 'none',
                                  color: black,
                                }}
                                primary={submenu?.name}
                              />
                            </ListItemButton>
                          )
                        })}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )
              }
              return (
                <ListItemButton
                  key={`${Math.random()}}`}
                  selected={location.pathname.split('/')[1] === el?.link}
                  sx={{
                    '&.MuiListItemButton-root.Mui-selected': {
                      borderRight: '8px solid #fff',
                      zIndex: 1,
                    },
                  }}
                  onClick={() => {
                    navigate(`/${el.link}`)
                  }}
                >
                  <ListItemIcon>{el.icon}</ListItemIcon>
                  <ListItemText
                    style={{
                      textDecoration: 'none',
                      color: black,
                    }}
                    primary={el?.name}
                  />
                </ListItemButton>
              )
            })}
          </List>
        </Drawer>
      </Box>
      <Box
        component='main'
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}

// eslint-disable-next-line no-unused-vars
function Profile() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const session = new Session()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'
  const [anchorElUser, setAnchorElUser] = React.useState(null)
  const handleOpenUserMenu = (event: any) =>
    setAnchorElUser(event.currentTarget)
  const handleCloseUserMenu = () => setAnchorElUser(null)

  const settings = [
    { icon: <AccountCircle />, name: 'Account', link: 'account' },
    { icon: <Settings />, name: 'Setting', link: 'setting' },
  ]
  const sessionData = session.read('user')
  const firstname = sessionData?.user?.firstName
  return (
    <Box sx={{ flexGrow: 0 }}>
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          marginLeft: 24,
        }}
      >
        <Box
          style={{
            marginLeft: 12,
          }}
        >
          <Tooltip title='Open settings'>
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar
              // loading='lazy'
              // {...stringAvatar(`${lastname} ${firstname}`)}
              // alt={`${lastname} ${firstname}`}
              // src={`${baseUrl()}${sessionData?.user?.media?.path}`}
              />
            </IconButton>
          </Tooltip>
        </Box>
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            marginLeft: 4,
            lineHeight: 1.1,
          }}
        >
          <Typography
            // variant='h7'
            style={{
              fontWeight: 'bold',
              fontSize: 14,
              color: 'black',
            }}
          >
            {firstname}
          </Typography>
          <Typography
            // variant='h7'
            style={{
              fontSize: 12,
              color: 'black',
            }}
          >
            {showPermissions(sessionData?.user?.userTypeID)}
          </Typography>
        </Box>
      </Box>
      <Menu
        sx={{ mt: '45px' }}
        id='menu-appbar'
        anchorEl={anchorElUser}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
      >
        {settings?.map((setting) => (
          <MenuItem
            sx={{
              p: 0,
            }}
            key={setting?.link}
            onClick={handleCloseUserMenu}
          >
            <ListItemButton
              key={`${Math.random()}}`}
              sx={{
                '&.MuiListItemButton-root.Mui-selected': {
                  borderRight: '8px solid #fff',
                  zIndex: 1,
                },
              }}
              onClick={() => {
                navigate(`/${setting?.link}`)
              }}
            >
              <ListItemIcon>{setting?.icon}</ListItemIcon>
              <ListItemText
                style={{
                  textDecoration: 'none',
                  color: '#000',
                }}
                primary={setting?.name}
              />
            </ListItemButton>
          </MenuItem>
        ))}
        <MenuItem
          onClick={() =>
            signOut(() => {
              navigate(from, { replace: true })
              window.location.reload()
            })
          }
        >
          <ListItemIcon>
            <Logout />
          </ListItemIcon>
          <ListItemText primary='signout' />
        </MenuItem>
      </Menu>
    </Box>
  )
}

export function stringToColor(string: string) {
  let hash = 0
  let i

  for (i = 0; i < string.length; i += 1)
    hash = string.charCodeAt(i) + ((hash << 5) - hash)

  let color = '#'

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff
    color += `00${value.toString(16)}`.slice(-2)
  }

  return color
}

export function stringAvatar(name: string) {
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`,
  }
}

export type IShortcutsType = {
  url: string
  icon: string
  title: string
  subtitle: string
}

const shortcuts: Array<IShortcutsType> = [
  {
    url: '/apps/calendar',
    icon: 'tabler-calendar',
    title: 'Calendar',
    subtitle: 'Appointments',
  },
  {
    url: '/apps/invoice/list',
    icon: 'tabler-file-dollar',
    title: 'Invoice App',
    subtitle: 'Manage Accounts',
  },
  {
    url: '/apps/user/list',
    icon: 'tabler-user',
    title: 'Users',
    subtitle: 'Manage Users',
  },
  {
    url: '/apps/roles',
    icon: 'tabler-users-group',
    title: 'Role Management',
    subtitle: 'Permissions',
  },
  {
    url: '/',
    icon: 'tabler-device-desktop-analytics',
    title: 'Dashboard',
    subtitle: 'User Dashboard',
  },
  {
    url: '/pages/account-settings',
    icon: 'tabler-settings',
    title: 'Settings',
    subtitle: 'Account Settings',
  },
]

export type ThemeColor =
  | 'primary'
  | 'secondary'
  | 'error'
  | 'warning'
  | 'info'
  | 'success'

export type CustomAvatarProps = AvatarProps & {
  color?: ThemeColor
  skin?: 'filled' | 'light' | 'light-static'
  size?: number
}

export type INotificationsType = {
  title: string
  subtitle: string
  time: string
  read: boolean
} & (
  | {
      avatarImage?: string
      avatarIcon?: never
      avatarText?: never
      avatarColor?: never
      avatarSkin?: never
    }
  | {
      avatarIcon?: string
      avatarColor?: ThemeColor
      avatarSkin?: CustomAvatarProps['skin']
      avatarImage?: never
      avatarText?: never
    }
  | {
      avatarText?: string
      avatarColor?: ThemeColor
      avatarSkin?: CustomAvatarProps['skin']
      avatarImage?: never
      avatarIcon?: never
    }
)

const notifications: Array<INotificationsType> = [
  {
    avatarImage: '/images/avatars/8.png',
    title: 'Congratulations Flora 🎉',
    subtitle: 'Won the monthly bestseller gold badge',
    time: '1h ago',
    read: false,
  },
  {
    title: 'Cecilia Becker',
    avatarColor: 'secondary',
    subtitle: 'Accepted your connection',
    time: '12h ago',
    read: false,
  },
  {
    avatarImage: '/images/avatars/3.png',
    title: 'Bernard Woods',
    subtitle: 'You have new message from Bernard Woods',
    time: 'May 18, 8:26 AM',
    read: true,
  },
  {
    avatarIcon: 'tabler-chart-bar',
    title: 'Monthly report generated',
    subtitle: 'July month financial report is generated',
    avatarColor: 'info',
    time: 'Apr 24, 10:30 AM',
    read: true,
  },
  {
    avatarText: 'MG',
    title: 'Application has been approved 🚀',
    subtitle: 'Your Meta Gadgets project application has been approved.',
    avatarColor: 'success',
    time: 'Feb 17, 12:17 PM',
    read: true,
  },
  {
    avatarIcon: 'tabler-mail',
    title: 'New message from Harry',
    subtitle: 'You have new message from Harry',
    avatarColor: 'error',
    time: 'Jan 6, 1:48 PM',
    read: true,
  },
]
