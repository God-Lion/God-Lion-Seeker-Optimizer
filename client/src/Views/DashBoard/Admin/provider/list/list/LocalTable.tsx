import React from 'react'
import { ArrowUpward, ArrowDownward } from '@mui/icons-material'
import {
  Box,
  Card,
  CardContent,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Skeleton,
} from '@mui/material'
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  flexRender,
} from '@tanstack/react-table'
import type { IProvider } from 'src/Views/type'
import columnDefault from './column'
import fuzzyFilter from './fuzzyFilter'
import DebouncedInput from 'src/components/react-table/DebouncedInput'
import { StatusObj } from '../../utils'

export default function LocalTable({
  data,
  loading = false,
}: {
  data: Array<IProvider>
  loading?: boolean
}) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [tableData, setTableData] = React.useState(...[data])
  //   const [density, setDensity] = React.useState<DensityState>('md')
  //   const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper()
  const columns = React.useMemo<Array<ColumnDef<IProvider>>>(
    () => columnDefault,
    [],
  )

  const table = useReactTable({
    data: tableData as Array<IProvider>,
    columns,
    // defaultColumn,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      rowSelection,
      globalFilter,
      //   density,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    // autoResetPageIndex,
    // Pipeline
    // globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    //
    // _features: [DensityFeature],
    // onDensityChange: setDensity,
    // Provide our updateData function to our table meta
    // meta: {
    //   updateData: (rowIndex, columnId, value) => {
    //     // Skip page index reset until after next rerender
    //     skipAutoResetPageIndex()
    //     setTableData((old) =>
    //       old.map((row, index) => {
    //         if (index === rowIndex) {
    //           return {
    //             ...old[rowIndex]!,
    //             [columnId]: value,
    //           }
    //         }
    //         return row
    //       }),
    //     )
    //   },
    // },
    enableRowSelection: true,
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
  })

  //   const { pageSize, pageIndex } = table.getState().pagination
  const fillArray = Array.apply(null, Array(5)).map((_, idx) => idx)

  return (
    <Box sx={{ width: '100%' }}>
      <Card
      // {...ref}
      // padding='0'
      >
        <CardContent>
          {/* <Button
            variant='contained'
            onClick={() => table.toggleDensity()}
            // className="border rounded p-1 bg-blue-500 text-white mb-2 w-64"
          >
            Toggle Density
          </Button> */}
          {/* <TableFilters setData={setTableData} tableData={data} /> */}
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='start'
            padding={6}
            gap={4}
            //   className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'
          >
            {/* <TextField
                select
                value={table.getState().pagination.pageSize}
                onChange={e => table.setPageSize(Number(e.target.value))}
                className='is-[70px]'
              >
                <MenuItem value='10'>10</MenuItem>
                <MenuItem value='25'>25</MenuItem>
                <MenuItem value='50'>50</MenuItem>
              </TextField> */}
            <Box
              display='flex'
              justifyContent='space-between'
              gap={4}
              alignItems='start'
              sx={{
                flexDirection: { sm: 'row' },
                alignItems: { sm: 'center' },
              }}
              // className='flex flex-col sm:flex-row is-full sm:is-auto items-start sm:items-center gap-4'
            >
              <DebouncedInput
                value={globalFilter ?? ''}
                onChange={(value) => setGlobalFilter(String(value))}
                placeholder='Search User'
                className='is-full sm:is-auto'
              />
              {/* <Button
                  color='secondary'
                  variant='contained'
                  startIcon={<i className='tabler-upload' />}
                  className='is-full sm:is-auto'
                >
                  Export
                </Button> */}
              {/* <Button
                  variant='contained'
                  startIcon={<i className='tabler-plus' />}
                  onClick={() => setAddUserOpen(!addUserOpen)}
                  className='is-full sm:is-auto'
                >
                  Add New User
                </Button> */}
            </Box>
          </Box>

          <TableContainer
          // component={Paper}
          >
            <Table
              sx={{ minWidth: 650 }}
              stickyHeader
              aria-label='sticky table'
            >
              <TableHead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableCell
                          key={header.id}
                          colSpan={header.colSpan}
                          //   style={{
                          //     //using our new feature
                          //     padding:
                          //       density === 'sm'
                          //         ? '4px'
                          //         : density === 'md'
                          //         ? '8px'
                          //         : '16px',
                          //     transition: 'padding 0.2s',
                          //   }}
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {{
                                asc: <ArrowUpward />,
                                desc: <ArrowDownward />,
                              }[
                                header.column.getIsSorted() as 'asc' | 'desc'
                              ] ?? null}
                              {/* {header.column.getCanFilter() ? (
                                  <div>
                                    <Filter column={header.column} table={table} />
                                  </div>
                                ) : null} */}
                            </div>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHead>
              {table.getFilteredRowModel().rows.length === 0 ? (
                <TableBody>
                  <TableRow>
                    <TableCell
                      colSpan={table.getVisibleFlatColumns().length}
                      //   className='text-center'
                      align='center'
                    >
                      No data available
                    </TableCell>
                  </TableRow>
                </TableBody>
              ) : (
                <TableBody>
                  {loading &&
                    fillArray.map(() => (
                      <TableRow key={`TableRow${Math.random()}`}>
                        {table.getHeaderGroups().map((i_) => (
                          <TableCell key={`${Math.random()}`}>
                            <Skeleton
                              variant='text'
                              sx={{ fontSize: '1rem' }}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  {!loading &&
                    table.getRowModel().rows.map((row) => {
                      return (
                        <TableRow
                          hover
                          key={row.id}
                          sx={{
                            backgroundColor:
                              StatusObj[
                                row.original.isApproved ? 'active' : 'inactive'
                              ],
                          }}
                        >
                          {row.getVisibleCells().map((cell) => {
                            return (
                              <TableCell
                                key={cell.id}
                                // style={{
                                //   //using our new feature
                                //   padding:
                                //     density === 'sm'
                                //       ? '4px'
                                //       : density === 'md'
                                //       ? '8px'
                                //       : '16px',
                                //   transition: 'padding 0.2s',
                                // }}
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      )
                    })}
                </TableBody>
              )}
            </Table>
          </TableContainer>
        </CardContent>

        {/* <TablePagination
              rowsPerPageOptions={[5, 10, 25, { label: 'All', value: data.length }]}
              component='div'
              count={table.getFilteredRowModel().rows.length}
              rowsPerPage={pageSize}
              page={pageIndex}
              slotProps={{
                select: {
                  inputProps: { 'aria-label': 'rows per page' },
                  native: true,
                },
              }}
              onPageChange={(_, page) => {
                table.setPageIndex(page)
              }}
              onRowsPerPageChange={(e) => {
                const size = e.target.value ? Number(e.target.value) : 10
                table.setPageSize(size)
              }}
              ActionsComponent={TablePaginationActions}
            /> */}
      </Card>
      {/* <pre>{JSON.stringify(table.getState().pagination, null, 2)}</pre> */}
    </Box>
  )
}
