import React, { useRef } from 'react'
import { Box, List, ListItem, Paper } from '@mui/material'
import { useVirtualizer } from '@tanstack/react-virtual'

interface VirtualizedListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  estimatedItemHeight?: number
  height?: number | string
  overscan?: number
  enableVirtualization?: boolean
  className?: string
}

export function VirtualizedList<T>({
  items,
  renderItem,
  estimatedItemHeight = 50,
  height = '600px',
  overscan = 5,
  enableVirtualization = true,
  className,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const shouldVirtualize = enableVirtualization && items.length > 50

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan,
    enabled: shouldVirtualize,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  if (!shouldVirtualize) {
    // Render normally for small lists
    return (
      <Paper
        ref={parentRef}
        className={className}
        sx={{
          height,
          overflow: 'auto',
        }}
      >
        <List>
          {items.map((item, index) => (
            <ListItem key={index} disablePadding>
              {renderItem(item, index)}
            </ListItem>
          ))}
        </List>
      </Paper>
    )
  }

  // Virtual scrolling for large lists
  return (
    <Paper
      ref={parentRef}
      className={className}
      sx={{
        height,
        overflow: 'auto',
      }}
    >
      <Box
        sx={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => (
          <Box
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={rowVirtualizer.measureElement}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

export default VirtualizedList
