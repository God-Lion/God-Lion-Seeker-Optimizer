/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type ColumnDef, createColumnHelper } from '@tanstack/react-table'
import type { IProvideStatusType, IProvidersTypeWithAction } from '../type'
import type { IEddition } from 'src/Views/type'
import {
  Avatar,
  Badge,
  Box,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  // Menu,
  MenuItem,
  Switch,
  Typography,
} from '@mui/material'
import Menu, { MenuProps } from '@mui/material/Menu'
import { styled, alpha } from '@mui/material/styles'
import { Roles } from 'src/utils/types'
import {
  DeleteForever,
  Edit,
  MoreVert,
  RunningWithErrors,
  Visibility,
} from '@mui/icons-material'
import StyledMenu from 'src/components/StyledMenu'
import getRole from 'src/lib/utils'
import { StatusObj } from 'src/Views/DashBoard/Admin/admin/utils'

export type ITypeWithAction = IEddition & {
  action?: string
}

const columnHelper = createColumnHelper<ITypeWithAction>()

const columnDefault: Array<ColumnDef<ITypeWithAction, any>> = [
  columnHelper.accessor('name', {
    header: 'Eddition',
    cell: ({ row }) => (
      <Box display='flex' alignItems='center' gap={1}>
        {/* {getAvatar({ image: row.original.image, name: row.original.name })} */}
        <Box display='flex' flexDirection='column'>
          <Typography color='text.primary' className='font-medium'>
            {row.original.name}
          </Typography>
        </Box>
      </Box>
    ),
  }),
  columnHelper.accessor('start', {
    header: 'Start',
    cell: ({ row }) => (
      <Box display='flex' alignItems='center' gap={1}>
        {/* {getAvatar({ image: row.original.image, name: row.original.name })} */}
        <Box display='flex' flexDirection='column'>
          <Typography color='text.primary' className='font-medium'>
            {row.original.start}
          </Typography>
        </Box>
      </Box>
    ),
  }),
  columnHelper.accessor('end', {
    header: 'End',
    cell: ({ row }) => (
      <Box display='flex' alignItems='center' gap={1}>
        {/* {getAvatar({ image: row.original.image, name: row.original.name })} */}
        <Box display='flex' flexDirection='column'>
          <Typography color='text.primary' className='font-medium'>
            {row.original.end}
          </Typography>
        </Box>
      </Box>
    ),
  }),
  columnHelper.accessor('theme', {
    header: 'theme',
    cell: ({ row }) => (
      <Box display='flex' alignItems='center' gap={1}>
        {/* {getAvatar({ image: row.original.image, name: row.original.name })} */}
        <Box display='flex' flexDirection='column'>
          <Typography color='text.primary' className='font-medium'>
            {row.original.theme}
          </Typography>
        </Box>
      </Box>
    ),
  }),
  columnHelper.accessor('subject', {
    header: 'subject',
    cell: ({ row }) => (
      <Box display='flex' alignItems='center' gap={1}>
        {/* {getAvatar({ image: row.original.image, name: row.original.name })} */}
        <Box display='flex' flexDirection='column'>
          <Typography color='text.primary' className='font-medium'>
            {row.original.subject}
          </Typography>
        </Box>
      </Box>
    ),
  }),

  columnHelper.accessor('isActive', {
    header: 'Status',
    cell: ({ getValue, row, column, table }) => {
      const initialValue = getValue()
      const [loading, setLoading] = React.useState<boolean>(false)
      const [value, setValue] = React.useState(initialValue)

      // const onBlur = () => {
      //   table.options.meta?.updateData(row.index, column.id, value)
      // }
      const handleChange = async (
        event: React.ChangeEvent<HTMLInputElement>,
      ) => {
        // const checked = event.target.checked
        const newStatus = !row.original.isActive
        try {
          setLoading(true)
          // const response = await handleUpdateStatus({
          //   status: newStatus ? 1 : 0,
          //   admin_ids: [row.original.id],
          // })
          // if (
          //   response.response_code == DEFAULT_STATUS_UPDATE_200.response_code
          // ) {
          setValue(newStatus)
          table.options.meta?.updateData(row.index, column.id, newStatus)
          //   toast.success('Update status sucess')
          // }
          // if (response.response_code == DEFAULT_400.response_code) {
          //   response.errors.forEach((error) => {
          //     toast.error(`${error.message}`)
          //   })
          // }
        } catch (error) {
          console.log(error)
          // toast.error('Update status error')
        } finally {
          setLoading(false)
        }
      }
      React.useEffect(() => {
        setValue(initialValue)
      }, [initialValue])

      return (
        <Box display='flex' alignItems='center' gap={3}>
          <Chip
            variant='outlined'
            className='capitalize'
            label={row.original.isActive ? 'active' : 'inactive'}
            // color={StatusObj[row.original.isActive ? 'active' : 'inactive']}
            size='small'
            sx={{
              my: '10px',
            }}
          />

          {loading && <CircularProgress color='success' />}
          {!loading && (
            <FormControlLabel
              control={
                <Switch
                  sx={{
                    padding: '0px',
                  }}
                  // color={
                  //   StatusObj[row.original.isActive ? 'active' : 'inactive']
                  // }
                  checked={value as boolean}
                  onChange={handleChange}
                />
              }
              label=''
            />
          )}
        </Box>
      )
    },
  }),
  columnHelper.accessor('action', {
    header: 'Action',
    cell: ({ row }) => {
      const navigate = useNavigate()

      const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
      const open = Boolean(anchorEl)
      const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
      }
      const handleClose = () => {
        setAnchorEl(null)
      }
      const MenuOptions: Array<{
        key: string
        label: string
        icon?: React.JSX.Element
        onclick?: Function
      }> = [
        {
          key: 'badge',
          label: 'Badge',
          icon: <Badge />,
          onclick: () => {
            navigate(`/badge/${row.original.id}`)
          },
        },
        {
          key: 'processing',
          label: 'Traiter',
          icon: <RunningWithErrors />,
          onclick: () => {
            navigate(`/processing/${row.original.id}`)
          },
        },
        {
          key: 'edit',
          label: 'Modidier',
          icon: <Edit />,
          onclick: () => {
            navigate(`/edit/${row.original.id}`)
          },
        },
        {
          key: 'delete',
          label: 'Suppimer',
          icon: <DeleteForever />,
          onclick: () => {
            navigate(`/delete/${row.original.id}`)
          },
        },
      ]

      return (
        <Box display='flex' alignItems='center'>
          <IconButton>
            <Box
              component={Link}
              to={`/admin/provider/${row.original.id}`}
              sx={{ display: 'flex' }}
            >
              <Visibility />
            </Box>
          </IconButton>
          <IconButton
            aria-label='more'
            id='long-button'
            aria-controls={open ? 'long-menu' : undefined}
            aria-expanded={open ? 'true' : undefined}
            aria-haspopup='true'
            onClick={handleClick}
          >
            <MoreVert />
          </IconButton>
          <StyledMenu
            id='long-menu'
            MenuListProps={{ 'aria-labelledby': 'long-button' }}
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
          >
            {MenuOptions.map((option) => (
              <MenuItem
                key={option.key}
                // selected={option.key === 'badge'}
                onClick={() => {
                  if (option?.onclick !== undefined) option.onclick()
                  handleClose()
                }}
              >
                {option.icon}
                {option.label}
              </MenuItem>
            ))}
          </StyledMenu>
        </Box>
      )
    },
    enableSorting: false,
  }),
]
export default columnDefault
