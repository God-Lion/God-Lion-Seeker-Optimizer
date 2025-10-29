import React from 'react'
import MuiAlert from '@mui/material/Alert'

export default React.forwardRef((props: any, ref: any) => (
  <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />
))
