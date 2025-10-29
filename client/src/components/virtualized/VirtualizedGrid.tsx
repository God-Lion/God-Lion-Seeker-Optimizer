import React, { useRef } from 'react'
import { Box, Paper } from '@mui/material'
import { useVirtualizer } from '@tanstack/react-virtual'

interface VirtualizedGridProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  columns?: number
  estimatedItemHeight?: number
  height?: number | string
  gap?: number
  overscan?: number
  enableVirtualization?: boolean
  className?: string
}

export function VirtualizedGrid<T>({
  items,
  renderItem,
  columns = 3,
  estimatedItemHeight = 200,
  height = '600px',
  gap = 2,
  overscan = 2,
  enableVirtualization = true,
  className,
}: VirtualizedGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Calculate rows based on columns
  const rows = Math.ceil(items.length / columns)
  const shouldVirtualize = enableVirtualization && rows > 20

  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan,
    enabled: shouldVirtualize,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()

  if (!shouldVirtualize) {
    // Render normally for small grids
    return (
      <Paper
        ref={parentRef}
        className={className}
        sx={{
          height,
          overflow: 'auto',
          p: 2,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: `${gap * 8}px`,
          }}
        >
          {items.map((item, index) => (
            <Box key={index}>{renderItem(item, index)}</Box>
          ))}
        </Box>
      </Paper>
    )
  }

  // Virtual scrolling for large grids
  return (
    <Paper
      ref={parentRef}
      className={className}
      sx={{
        height,
        overflow: 'auto',
        p: 2,
      }}
    >
      <Box
        sx={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * columns
          const rowItems = items.slice(startIndex, startIndex + columns)

          return (
            <Box
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gap: `${gap * 8}px`,
                }}
              >
                {rowItems.map((item, colIndex) => (
                  <Box key={startIndex + colIndex}>
                    {renderItem(item, startIndex + colIndex)}
                  </Box>
                ))}
              </Box>
            </Box>
          )
        })}
      </Box>
    </Paper>
  )
}

export default VirtualizedGrid
