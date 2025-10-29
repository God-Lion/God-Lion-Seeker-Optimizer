import React from 'react'
import {
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  TableContainer,
  TablePagination,
  Box,
} from '@mui/material'
import PerfectScrollbar from 'react-perfect-scrollbar'
import type { ITableData } from './types'
import TableComponent from './TableComponent'

export default React.forwardRef(
  ({
    loading = false,
    data = {
      header: [],
      rows: [],
    },
    ref,
  }: {
    loading: boolean
    data: ITableData
    ref?: any
  }) => {
    const [rowsPerPage, setRowsPerPage] = React.useState<number>(5)
    const [page, setPage] = React.useState<number>(0)
    const handlePageChange = (event: unknown, newPagE: number) =>
      setPage(newPagE)
    const handleRowsPerPageChange = (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      setRowsPerPage(event.target.value as unknown as number)
      setPage(0)
    }

    return (
      <>
        {loading && <LinearProgress />}
        <Card {...ref} padding='0'>
          <CardContent>
            <PerfectScrollbar>
              <TableContainer>
                <TableComponent
                  ref={ref}
                  loading={loading}
                  data={data}
                  rowsPerPage={rowsPerPage}
                  page={page}
                />
              </TableContainer>
            </PerfectScrollbar>
          </CardContent>
          <CardActions>
            <TablePagination
              component={Box}
              labelRowsPerPage='Lignes par page'
              count={data.rows.length}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
            />
          </CardActions>
        </Card>
      </>
    )
  },
)
