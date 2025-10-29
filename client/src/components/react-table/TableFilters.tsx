import React from 'react'
import type { IPerson } from './types'
import { CardContent, Grid, MenuItem, TextField } from '@mui/material'

const TableFilters = ({
  setData,
  tableData,
}: {
  setData: any
  tableData?: Array<IPerson>
}) => {
  // const [role, setRole] = React.useState<IPerson['user_type']>('')
  const [status, setStatus] = React.useState<string>('')
  // const [plan, setPlan] = React.useState<IContent['currentPlan']>('')

  React.useEffect(() => {
    const filteredData = tableData?.filter((user) => {
      // if (role && user.user_type !== role) return false
      // const is_active = user.is_active ? 'active' : 'inactive'
      if (status && user.status !== status) return false
      // if (plan && user.currentPlan !== plan) return false

      return true
    })

    setData(filteredData)
  }, [
    // role, plan,
    status,
    tableData,
    setData,
  ])

  return (
    <CardContent>
      <Grid container spacing={6}>
        {/* <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            id='select-role'
            value={role}
            onChange={(e) => setRole(e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value=''>Select Role</MenuItem>
            {USER_TYPES.map((USER_TYPE) => (
              <MenuItem value={USER_TYPE.key}>{USER_TYPE.key}</MenuItem>
            ))}
          </TextField>
        </Grid> */}
        {/* <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            id='select-plan'
            // value={plan}
            // onChange={e => setPlan(e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value=''>Select Plan</MenuItem>
            <MenuItem value='basic'>Basic</MenuItem>
            <MenuItem value='company'>Company</MenuItem>
            <MenuItem value='enterprise'>Enterprise</MenuItem>
            <MenuItem value='team'>Team</MenuItem>
          </TextField>
        </Grid> */}
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            id='select-status'
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value=''>Select Status</MenuItem>
            <MenuItem value='relationship'>relationship</MenuItem>
            <MenuItem value='complicated'>complicated</MenuItem>
            <MenuItem value='single'>single</MenuItem>
          </TextField>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
