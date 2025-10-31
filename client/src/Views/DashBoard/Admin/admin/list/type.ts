import type {
  DensityTableState,
  DensityOptions,
  DensityInstance,
} from 'src/components/react-table/types'
import type { ThemeColor } from 'src/types'
import type { RankingInfo } from '@tanstack/match-sorter-utils'
import type { FilterFn, RowData } from '@tanstack/react-table'
import React from 'react'
import type { IUser } from 'src/Views/type'

export type IUserTypeWithAction = IUser & {
  action?: string
  role?: number | string
}

export type IUserRoleType = {
  [key: string]: { icon: string; color: string }
}

export type IUserStatusType = {
  [key: string]: ThemeColor
}

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
  interface TableState extends DensityTableState {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableOptionsResolved<TData extends RowData>
    extends DensityOptions {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Table<TData extends RowData> extends DensityInstance {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void
  }
}

export type UserDataType = {
  title: string
  value: string
  avatarIcon: string | React.JSX.Element
  avatarColor?: ThemeColor
  change: string
  changeNumber: string
  subTitle: string
}
