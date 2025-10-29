import React from 'react'
import Box from '@mui/material/Box'
import { KBarResults, useKBar, useMatches } from 'kbar'
import type { ActionImpl } from 'kbar'
import DefaultSuggestions from './DefaultSuggestions'
import NoResult from './NoResult'
import SearchResultItem from './SearchResultItem'
import type { SearchData } from './types'

type Results = (string | ActionImpl)[]

// Filter the search result data by limiting the number of results per section to 3 if
// there is more than one section. Otherwise, limit the number of results to 5.
const getFilteredResults = (results: Results): Results => {
  const sectionIndices: Array<number> = []

  results.forEach((item, index) => {
    if (typeof item === 'string') sectionIndices.push(index)
  })

  if (sectionIndices.length === 1) return results.slice(0, 6)

  const data: Results = []

  sectionIndices.forEach((sectionIndex, index) => {
    const nextSectionIndex = sectionIndices[index + 1] || results.length
    const sectionResults = results.slice(
      sectionIndex,
      Math.min(sectionIndex + 4, nextSectionIndex),
    )

    data.push(...sectionResults)
  })

  return data
}

const SearchResults: React.FC<{
  currentPath: string
  data: Array<SearchData>
}> = ({ currentPath, data }) => {
  let query: string | undefined
  useKBar((state) => {
    query = state.searchQuery
  })
  const { results, rootActionId } = useMatches()

  if (query === '') return <DefaultSuggestions />

  if (results.length === 0) return <NoResult query={query} />

  return (
    <KBarResults
      // eslint-disable-next-line lines-around-comment
      // If you do not want to filter the search data, you can remove `getFilteredResults`
      // function below and directly pass `results` to `items` prop.
      items={getFilteredResults(results)}
      onRender={({ item, active }) =>
        typeof item === 'string' ? (
          <Box
            sx={{
              paddingBlockStart: '1rem',
              paddingBlockEnd: '0.5rem',
              paddingInline: '1rem',
              fontSize: '15px',
              lineHeight: 1.16667,
              color: 'var(--mui-palette-text-disabled)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}
          >
            {item}
          </Box>
        ) : (
          <SearchResultItem
            action={item}
            active={active}
            currentRootActionId={rootActionId}
            currentPath={currentPath}
            data={data.filter((d) => d.id === item.id)[0]}
          />
        )
      } // @ts-ignore
      maxHeight='100%'
    />
  )
}

export default SearchResults
