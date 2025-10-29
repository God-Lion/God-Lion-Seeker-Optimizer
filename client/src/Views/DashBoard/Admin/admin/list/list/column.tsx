/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type ColumnDef, createColumnHelper } from '@tanstack/react-table'
import type { IUserStatusType, IUserTypeWithAction } from '../type'
import {
  Avatar,
  Badge,
  Box,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Switch,
  Typography,
} from '@mui/material'
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
import type { IUser } from 'src/Views/type'

const providerStatusObj: IUserStatusType = {
  active: 'primary',
  inactive: 'warning',
  pending: 'warning',
}

const getAvatar = (
  params: Pick<IUser, 'avatar' | 'firstname' | 'lastname'>,
) => {
  const { avatar, firstname, lastname } = params

  if (avatar)
    return (
      <Avatar
        variant='rounded'
        src={avatar}
        sx={{
          height: 34,
          width: 34,
        }}
      />
    )

  return (
    <Avatar
      variant='rounded'
      sx={{
        height: 34,
        width: 34,
      }}
    >{`${firstname?.charAt(0).toLocaleUpperCase()}${lastname
      ?.charAt(0)
      .toLocaleUpperCase()}`}</Avatar>
  )
}

const columnHelper = createColumnHelper<IUserTypeWithAction>()

const columnDefault: Array<ColumnDef<IUserTypeWithAction, any>> = [
  columnHelper.accessor('firstname', {
    header: 'User',
    cell: ({ row }) => (
      <Box display='flex' alignItems='center' gap={1}>
        {getAvatar({
          avatar: row.original.avatar,
          firstname: row.original.firstname,
          lastname: row.original.lastname,
        })}
        <Box display='flex' flexDirection='column'>
          <Typography color='text.primary' className='font-medium'>
            {row.original.firstname} {row.original.lastname}
          </Typography>
          <Typography variant='body2'>
            {getRole(row.original.role ?? 0)}
          </Typography>
        </Box>
      </Box>
    ),
  }),
  {
    accessorFn: (row) => row.email,
    id: 'email',
    header: () => 'Email',
    footer: (props) => props.column.id,
  },
  {
    accessorFn: (row) => row.phone,
    id: 'phone',
    header: () => 'Phone',
    footer: (props) => props.column.id,
  },
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
          // setValue(newStatus)
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
            color={
              providerStatusObj[row.original.isActive ? 'active' : 'inactive']
            }
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
                  color={
                    providerStatusObj[
                      row.original.isActive ? 'active' : 'inactive'
                    ]
                  }
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
