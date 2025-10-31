// App React Toastify Styles
import { styled } from '@mui/material/styles'
import { ToastContainer } from 'react-toastify'

const AppReactToastify = styled(ToastContainer)(({ theme }) => ({
  '& .Toastify__toast': {
    borderRadius: theme.shape.borderRadius,
  },
  '& .Toastify__toast--success': {
    backgroundColor: theme.palette.success.main,
  },
  '& .Toastify__toast--error': {
    backgroundColor: theme.palette.error.main,
  },
  '& .Toastify__toast--warning': {
    backgroundColor: theme.palette.warning.main,
  },
  '& .Toastify__toast--info': {
    backgroundColor: theme.palette.info.main,
  },
}))

export default AppReactToastify
