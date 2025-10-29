import { createTheme } from '@mui/material'
import { orange, red } from '@mui/material/colors'
import { primary, surface, surfaceMixed } from 'src/assets/colors'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',

    // palette values for dark mode
    primary: primary,
    error: red,
    warning: orange,
    // divider: primary[600],
    //     action:{
    // hover
    //     },
    background: {
      default: surface[300],
      paper: surface[200],
    },
    text: {
      primary: primary[600],
      secondary: surfaceMixed[500],
    },

    //==================================
    // Highlight Palette
    // primary: {
    //   light: '#30CD9F',
    //   main: '#005A2C',
    //   dark: '#D9EDDF',
    //   contrastText: '#386C5F',
    // },
    // primary: {
    //   light: '#30CD9F',
    //   main: '#218f6f',
    //   dark: '#30CD9F',
    //   contrastText: '#59d7b2',
    // },
    // secondary: {
    //   light: '#005A2C',
    //   main: '#003e1e',
    //   dark: '#005A2C',
    //   contrastText: '#337b5',
    // },
    // primary: {
    //   // main: '#5cbc63',
    //   main: '#30cd9f',
    // },
    // secondary: {
    //   main: '#EBA33E',
    // },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          // backgroundColor: surface[300],
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          backgroundColor: '#030327',
        },
      },
    },
    MuiButton: {
      variants: [
        {
          props: { variant: 'contained' },
          style: {
            backgroundColor: primary[500],
          },
        },
      ],
      // styleOverrides: {
      //   root: {
      //     // backgroundColor: primary[500],
      //     // Targets the base button styles
      //     // borderRadius: 28, // Set custom border radius
      //   },
      // },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          // backgroundColor: surface[200],
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: surface[200],
        },
      },
    },
    // MuiTabs: {
    //   styleOverrides: {
    //     root: {
    //       minHeight: '38px',
    //       '& .MuiTabs-indicator': {
    //         display: 'none',
    //       },
    //     },
    //   },
    // },
    // MuiTab: {
    //   styleOverrides: {
    //     root: {
    //       minHeight: '38px',
    //       padding: '0.5rem 1.375rem',
    //       mr: '10px',
    //       borderRadius: '4px', //'50px',
    //       // backgroundColor: primary[500],
    //       // borderRadius: '30px',
    //       '& .MuiTabs-indicator': {
    //         display: 'none',
    //       },
    //       '&.Mui-selected': {
    //         backgroundColor: primary[500],
    //         color: surface[200],
    //       },
    //     },
    //   },
    // },
  },
})
export default darkTheme
