import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Container,
  Toolbar,
  IconButton,
  Link as HLink,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  Stack,
  Theme,
  useTheme,
  InputBase,
} from '@mui/material'
import MuiAppBar from '@mui/material/AppBar'
import { alpha, styled } from '@mui/material/styles'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import Logo from 'src/assets/svg/Logo'
import ModeDropdown from './layout/shared/ModeDropdown'
import ProfileDefault from './AuthProfile'
import AuthButtons from './AuthButtons'
import { isObjectEmpty } from 'src/utils'
import { useAuth } from 'src/store'

export let whiteColor = '#ffffff'
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme }) => ({
  backgroundColor: 'var(--mui-palette-background-paper)',
  // backgroundColor: '#EF5350',
  maxWidth: '100%',
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  // ...(open && {
  //   marginLeft: drawerWidth,
  //   width: `calc(100% - ${drawerWidth}px)`,
  //   transition: theme.transitions.create(['width', 'margin'], {
  //     easing: theme.transitions.easing.sharp,
  //     duration: theme.transitions.duration.enteringScreen,
  //   }),
  // }),
}))

const Search = styled('div')(({ theme }) => ({
  marginRight: '20px',
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(
    theme.palette.primary.main,
    // theme.palette.common.white
    0.15,
  ),
  // backgroundColor: '#D81B60',

  '&:hover': {
    backgroundColor: alpha(
      theme.palette.primary.main,
      // theme.palette.common.white
      0.25,
    ),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}))

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}))

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  // backgroundColor: '#D81B60',
  // color: 'inherit',

  color:
    theme.palette.mode === 'dark'
      ? theme.palette.primary.light
      : theme.palette.primary.dark,

  // color: theme.palette.secondary.main,
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    paddingBottom: 0,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '12ch',
      '&:focus': {
        width: '20ch',
      },
    },
  },
}))

// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
function SearchBar() {
  const theme: Theme = useTheme()
  // return ''
  return (
    <React.Fragment>
      <Search>
        <SearchIconWrapper>
          <SearchIcon
            sx={{
              color:
                theme.palette.mode === 'dark'
                  ? theme.palette.primary.light
                  : theme.palette.primary.dark,
            }}
          />
        </SearchIconWrapper>
        <StyledInputBase
          placeholder='Search…'
          inputProps={{ 'aria-label': 'search' }}
        />
      </Search>
      <IconButton
        sx={{
          display: { lg: 'none', md: 'none', sm: 'none', xs: 'flex' },
        }}
      >
        <Search />
      </IconButton>
    </React.Fragment>
  )
}

export default function NavBar() {
  const theme: Theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  // Define navigation pages based on available routes
  const publicPages = [
    { name: 'Home', link: '' },
    { name: 'Profile Analyzer', link: 'profile-analyzer' },
    { name: 'Jobs', link: 'jobs' },
    { name: 'Scraper', link: 'scraper' },
    { name: 'Statistics', link: 'statistics' },
    { name: 'Companies', link: 'companies' },
    { name: 'Job Analysis', link: 'job-analysis' },
  ]

  // Admin-specific pages
  const adminPages = [
    { name: 'Admin Panel', link: 'admin' },
    { name: 'Provider Management', link: 'admin-provider' },
  ]

  // Provider-specific pages  
  const providerPages = [
    { name: 'Provider Portal', link: 'provider' },
  ]

  // Combine pages based on user role
  const getPages = () => {
    if (!user || isObjectEmpty(user)) {
      return publicPages
    }

    // Check user role and return appropriate pages
    // Role is a number: 1=admin, 2=provider, 3=user (or similar mapping)
    const userRole = user?.role
    switch (userRole) {
      case 1: // admin
        return [...publicPages, ...adminPages]
      case 2: // provider
        return [...publicPages, ...providerPages]
      default:
        return publicPages
    }
  }

  const pages = getPages()
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null)

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget)
  }
  const handleCloseNavMenu = () => {
    setAnchorElNav(null)
  }

  return (
    <AppBar position='static'>
      <Container
        maxWidth='xl'
        sx={{
          maxWidth: '100%',
          width: '100%',
          mx: 0,
          pt: 2,
          [theme.breakpoints.up('lg')]: {
            width: '100%',
            maxWidth: '100%',
            pt: 2,
            mx: 0,
          },
          [theme.breakpoints.up('md')]: {
            width: '100%',
            maxWidth: '100%',
            mx: 0,
            pt: 2,
          },
          [theme.breakpoints.up('sm')]: {
            width: '100%',
            maxWidth: '100%',
            mx: 0,
            pt: 2,
          },
          [theme.breakpoints.up('xl')]: {
            width: '100%',
            maxWidth: '100%',
            mx: 0,
            pt: 2,
          },
          [theme.breakpoints.up('xs')]: {
            width: '100%',
            maxWidth: '100%',
            mx: 0,
            pt: 2,
          },
        }}
      >
        <Toolbar disableGutters>
          <Link
            to='/'
            style={{
              margin: '0px',
              padding: '0px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: { lg: 'flex', md: 'flex', sm: 'flex', xs: 'none' } }}>
              <Logo />
            </Box>
          </Link>
          {/* Desktop */}
          <Box
            sx={{
              marginLeft: '20px',
              flexGrow: 1,
              display: { xs: 'none', md: 'flex' },
            }}
          >
            {pages?.map((page) => (
              <List key={Math.random()} onClick={handleCloseNavMenu}>
                <ListItemButton
                  key={`${Math.random()}}`}
                  selected={location.pathname === `/${page?.link}` || (page?.link === '' && location.pathname === '/')}
                  sx={{
                    '&.MuiListItemButton-root.Mui-selected': {
                      borderRight: '8px solid #fff',
                      zIndex: 1,
                    },
                  }}
                  onClick={() => {
                    navigate(`/${page.link}`, { state: { from: location } })
                  }}
                >
                  <ListItemText
                    style={{
                      textDecoration: 'none',
                      color: theme.palette.primary.main,
                    }}
                    primary={page?.name}
                  />
                </ListItemButton>
              </List>
            ))}
          </Box>
          {/* Mobil */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
            }}
          >
            <IconButton
              size='large'
              aria-label='account of current user'
              aria-controls='menu-appbar'
              aria-haspopup='true'
              onClick={handleOpenNavMenu}
              color='inherit'
            >
              <MenuIcon
                sx={{
                  color:
                    theme.palette.mode === 'dark'
                      ? theme.palette.primary.light
                      : theme.palette.primary.dark,
                }}
              />
            </IconButton>
            <Menu
              id='menu-appbar'
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {pages?.map((page) => (
                <List
                  // style={{ marginLeft: 5 }}
                  key={Math.random()}
                  onClick={handleCloseNavMenu}
                >
                  <ListItemButton
                    key={`${Math.random()}}`}
                    selected={location.pathname === `/${page?.link}` || (page?.link === '' && location.pathname === '/')}
                    sx={{
                      '&.MuiListItemButton-root.Mui-selected': {
                        borderRight: '8px solid #fff',
                        zIndex: 1,
                      },
                    }}
                    onClick={() => {
                      navigate(`/${page?.link}`)
                    }}
                  >
                    {/* <ListItemIcon>{el.icon}</ListItemIcon> */}
                    <ListItemText
                      style={{
                        textDecoration: 'none',
                        // color: '#000000',
                      }}
                      primary={page.name}
                    />
                  </ListItemButton>
                </List>
              ))}
            </Menu>
          </Box>

          <HLink
            component={Link}
            to='/'
            sx={{
              display: { lg: 'none', md: 'none', sm: 'none', xs: 'flex' },
              margin: '0px',
              padding: '0px',
            }}
          >
            <Logo />
          </HLink>
          <Box
            sx={{
              marginRight: 0,
              marginLeft: 'auto',
              display: 'flex',
              justifyContent: 'flex-start',
            }}
          >
            <Stack direction='row'>
              <SearchBar />
              <ModeDropdown />
              {user === undefined || isObjectEmpty(user) ? (
                <AuthButtons />
              ) : (
                <ProfileDefault />
              )}
            </Stack>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
