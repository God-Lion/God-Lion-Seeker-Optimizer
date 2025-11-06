export const VIRTUAL_PAGE_SIZE = 100
export const MAX_ROWS = 3125

export const initialState = {
  rows: [],
  skip: 0,
  requestedSkip: 0,
  take: VIRTUAL_PAGE_SIZE * 2,
  totalCount: 0,
  loadingDataTable: false,
  lastQuery: '',
  sorting: [],
  filters: [],
  forceReload: false,
}
