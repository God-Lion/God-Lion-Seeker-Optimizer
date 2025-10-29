import React, { useRef } from 'react'
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
  Button,
} from '@mui/material'
import { ArrowUpward, ArrowDownward } from '@mui/icons-material'
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import fuzzyFilter from '../react-table/fuzzyFilter'
import type { DensityState } from '../react-table/types'
import DebouncedInput from '../react-table/DebouncedInput'
import DensityFeature from '../react-table/DensityFeature'
import useSkipper from '../react-table/useSkipper'

interface VirtualizedTableProps<T> {
  data: Array<T>
  columns: Array<ColumnDef<T>>
  loading?: boolean
  enableVirtualization?: boolean
  estimatedRowHeight?: number
  enableSearch?: boolean
}

export default function VirtualizedTable<T>({
  data,
  columns,
  loading = false,
  enableVirtualization = true,
  estimatedRowHeight = 53,
  enableSearch = true,
}: VirtualizedTableProps<T>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [tableData, setTableData] = React.useState([...data])
  const [density, setDensity] = React.useState<DensityState>('md')
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper()

  const tableContainerRef = useRef<HTMLDivElement>(null)

  const table = useReactTable({
    data: tableData as Array<T>,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      rowSelection,
      globalFilter,
      density,
    },
    initialState: {
      pagination: {
        pageSize: enableVirtualization ? tableData.length : 10,
      },
    },
    autoResetPageIndex,
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    _features: [DensityFeature],
    onDensityChange: setDensity,
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex()
        setTableData((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex]!,
                [columnId]: value,
              }
            }
            return row
          }),
        )
      },
    },
    enableRowSelection: true,
    debugTable: false,
    debugHeaders: false,
    debugColumns: false,
  })

  const { rows } = table.getRowModel()

  // Virtual scrolling setup
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 10,
    enabled: enableVirtualization && rows.length > 50,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
      : 0

  const fillArray = Array.apply(null, Array(5)).map((_, idx) => idx)

  const shouldVirtualize = enableVirtualization && rows.length > 50

  return (
    <Box sx={{ width: '100%' }}>
      <Card>
        <CardContent>
          <Box display='flex' gap={2} mb={2}>
            <Button
              variant='contained'
              onClick={() => table.toggleDensity()}
            >
              Toggle Density
            </Button>
          </Box>
          {enableSearch && (
            <Box
              display='flex'
              justifyContent='space-between'
              sx={{ mb: 2 }}
            >
              <Box className='flex flex-col sm:flex-row is-full sm:is-auto items-start sm:items-center gap-4'>
                <DebouncedInput
                  value={globalFilter ?? ''}
                  onChange={(value) => setGlobalFilter(String(value))}
                  placeholder='Search...'
                  className='is-full sm:is-auto'
                />
              </Box>
            </Box>
          )}

          <TableContainer
            ref={tableContainerRef}
            sx={{
              maxHeight: shouldVirtualize ? '600px' : 'none',
              overflow: shouldVirtualize ? 'auto' : 'visible',
            }}
          >
            <Table
              sx={{ minWidth: 650 }}
              stickyHeader
              aria-label='virtualized table'
            >
              <TableHead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableCell
                          key={header.id}
                          colSpan={header.colSpan}
                          style={{
                            padding:
                              density === 'sm'
                                ? '4px'
                                : density === 'md'
                                ? '8px'
                                : '16px',
                            transition: 'padding 0.2s',
                          }}
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              onClick={header.column.getToggleSortingHandler()}
                              style={{ cursor: 'pointer' }}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {{
                                asc: <ArrowUpward fontSize='small' />,
                                desc: <ArrowDownward fontSize='small' />,
                              }[
                                header.column.getIsSorted() as 'asc' | 'desc'
                              ] ?? null}
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
                        {table.getHeaderGroups().map(() => (
                          <TableCell key={`${Math.random()}`}>
                            <Skeleton
                              variant='text'
                              sx={{ fontSize: '1rem' }}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  {!loading && shouldVirtualize && (
                    <>
                      {paddingTop > 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={table.getVisibleFlatColumns().length}
                            style={{ height: `${paddingTop}px` }}
                          />
                        </TableRow>
                      )}
                      {virtualRows.map((virtualRow) => {
                        const row = rows[virtualRow.index]
                        return (
                          <TableRow hover key={row.id}>
                            {row.getVisibleCells().map((cell) => {
                              return (
                                <TableCell
                                  key={cell.id}
                                  style={{
                                    padding:
                                      density === 'sm'
                                        ? '4px'
                                        : density === 'md'
                                        ? '8px'
                                        : '16px',
                                    transition: 'padding 0.2s',
                                  }}
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
                      {paddingBottom > 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={table.getVisibleFlatColumns().length}
                            style={{ height: `${paddingBottom}px` }}
                          />
                        </TableRow>
                      )}
                    </>
                  )}
                  {!loading &&
                    !shouldVirtualize &&
                    rows.map((row) => {
                      return (
                        <TableRow hover key={row.id}>
                          {row.getVisibleCells().map((cell) => {
                            return (
                              <TableCell
                                key={cell.id}
                                style={{
                                  padding:
                                    density === 'sm'
                                      ? '4px'
                                      : density === 'md'
                                      ? '8px'
                                      : '16px',
                                  transition: 'padding 0.2s',
                                }}
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
          {shouldVirtualize && (
            <Box sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
              Showing {virtualRows.length} of {rows.length} rows (Virtual
              Scrolling Enabled)
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
