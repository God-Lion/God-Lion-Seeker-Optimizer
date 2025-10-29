import { createTheme } from '@mui/material'
import BaseTheme from './Base'
/* eslint-disable prettier/prettier */
const lightTheme = createTheme({
  ...BaseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#82368C', // '#F96156',
    },
    secondary: {
      main: '#07AEB5', // '#004AAD',
    },
  },
  // palette: {
  //   mode: 'light',
  //   primary: {
  //     // main: '#b2ff59',
  //     main: '#30cd9f'
  //   },
  //   secondary: {
  //     // main: green[500],
  //     main: '#ff7043'
  //   }
  // },
  // Button: {
  //   primary: {
  //     main: '#215E43',
  //   },
  // },
})
export default lightTheme
