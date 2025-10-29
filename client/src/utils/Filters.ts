import type { IQuery, ITableData } from 'src/components/table/types'

export default class Filters {
  static search(data: ITableData, query: string | IQuery): ITableData {
    if (typeof query === 'string')
      if ((query as string).trim() === '') return data
    if (typeof query === 'object') {
      if (query.value === undefined) return data
      if ((query.value as string)?.trim() === '') return data
    }
    const rows = data.rows
    if (!Array.isArray(rows)) return data

    return {
      ...data,
      rows: rows.filter((row) => {
        const keys =
          typeof query === 'object' ? query.columns : Object.keys(row)
        return keys.some((key: string) => {
          const value = typeof query === 'object' ? query.value : query
          if (typeof row[key] === 'string')
            return (
              (row[key] as string)
                .toLowerCase()
                .indexOf(value.toLowerCase()) !== -1
            )

          return false
        })
      }),
    }
  }
}
