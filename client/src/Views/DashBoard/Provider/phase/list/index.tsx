import React from 'react'
import type { IEddition, IPhase } from 'src/Views/type'
import LocalTable from './list/LocalTable'
import Grid from '@mui/material/GridLegacy'
import UserListCards from './UserListCards'
import { getPhases } from '../services'

export default function index() {
  const data = getPhases()

  return <UserList data={data} />
}

const UserList = ({ data }: { data: Array<IPhase> }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12}>
        <UserListCards />
      </Grid> */}
      <Grid item xs={12}>
        <EdditonListTable data={data} />
      </Grid>
    </Grid>
  )
}

function EdditonListTable({ data }: { data: Array<IPhase> }) {
  console.log('data ', data)

  return <LocalTable data={data} />
}
