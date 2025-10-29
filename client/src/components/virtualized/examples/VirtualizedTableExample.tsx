import React from 'react'
import VirtualizedTable from '../VirtualizedTable'
import { ColumnDef } from '@tanstack/react-table'
import { Chip, Avatar, Box } from '@mui/material'
import { faker } from '@faker-js/faker'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  age: number
  status: 'active' | 'inactive' | 'pending'
  avatar: string
}

// Generate large dataset
const generateUsers = (count: number): User[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i}`,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    age: faker.number.int({ min: 18, max: 80 }),
    status: faker.helpers.arrayElement(['active', 'inactive', 'pending']),
    avatar: faker.image.avatar(),
  }))
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'avatar',
    header: 'Avatar',
    cell: ({ row }) => (
      <Avatar src={row.original.avatar} alt={row.original.firstName} />
    ),
  },
  {
    accessorKey: 'firstName',
    header: 'First Name',
  },
  {
    accessorKey: 'lastName',
    header: 'Last Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'age',
    header: 'Age',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Chip
        label={row.original.status}
        color={
          row.original.status === 'active'
            ? 'success'
            : row.original.status === 'inactive'
            ? 'error'
            : 'warning'
        }
        size='small'
      />
    ),
  },
]

export default function VirtualizedTableExample() {
  const [data] = React.useState(() => generateUsers(5000))

  return (
    <Box sx={{ p: 3 }}>
      <h1>Virtualized Table Example</h1>
      <p>Rendering 5,000 users with virtual scrolling</p>
      <VirtualizedTable
        data={data}
        columns={columns}
        loading={false}
        enableVirtualization={true}
        estimatedRowHeight={53}
      />
    </Box>
  )
}
