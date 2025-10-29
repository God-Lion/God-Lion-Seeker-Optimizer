import React from 'react'
import VirtualizedTable from 'src/components/virtualized/VirtualizedTable'
import { ColumnDef } from '@tanstack/react-table'
import {
  Chip,
  IconButton,
  Tooltip,
  Link,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'

interface Company {
  id: number
  name: string
  industry: string | null
  company_size: string | null
  headquarters: string | null
  website: string | null
}

interface CompaniesVirtualTableProps {
  companies: Company[]
  loading?: boolean
  onViewCompany: (companyId: number) => void
}

export const CompaniesVirtualTable: React.FC<CompaniesVirtualTableProps> = ({
  companies,
  loading = false,
  onViewCompany,
}) => {
  const columns: ColumnDef<Company>[] = [
    {
      accessorKey: 'name',
      header: 'Company',
      cell: ({ row }) => (
        <strong>{row.original.name}</strong>
      ),
    },
    {
      accessorKey: 'industry',
      header: 'Industry',
      cell: ({ row }) =>
        row.original.industry ? (
          <Chip label={row.original.industry} size='small' variant='outlined' />
        ) : (
          '-'
        ),
    },
    {
      accessorKey: 'company_size',
      header: 'Size',
      cell: ({ row }) => row.original.company_size || '-',
    },
    {
      accessorKey: 'headquarters',
      header: 'Headquarters',
      cell: ({ row }) => row.original.headquarters || '-',
    },
    {
      accessorKey: 'website',
      header: 'Website',
      cell: ({ row }) =>
        row.original.website ? (
          <Link href={row.original.website} target='_blank' rel='noopener noreferrer'>
            Visit Website
          </Link>
        ) : (
          '-'
        ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Tooltip title='View Details'>
          <IconButton size='small' onClick={() => onViewCompany(row.original.id)}>
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ]

  return (
    <VirtualizedTable
      data={companies}
      columns={columns}
      loading={loading}
      enableVirtualization={companies.length > 50}
      estimatedRowHeight={53}
      enableSearch={true}
    />
  )
}

export default CompaniesVirtualTable
