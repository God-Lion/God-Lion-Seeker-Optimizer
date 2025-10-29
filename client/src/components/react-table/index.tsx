import React from 'react'
import { makeData } from './makeData'
import { type ColumnDef } from '@tanstack/react-table'
import type { IPerson } from './types'
import LocalTable from './LocalTable'
import columnDefault from './columns'

export default function App() {
  const rerender = React.useReducer(() => ({}), {})[1]

  const columns = React.useMemo<Array<ColumnDef<IPerson>>>(
    () => columnDefault,
    [],
  )

  const numRows = 10

  const [data, setData] = React.useState(() => makeData(numRows))
  const refreshData = () => setData(() => makeData(numRows))

  return (
    <>
      <LocalTable {...{ data, columns }} />
      <hr />
      <div>
        <button onClick={() => rerender()}>Force Rerender</button>
      </div>
      <div>
        <button onClick={() => refreshData()}>Refresh Data</button>
      </div>
    </>
  )
}
