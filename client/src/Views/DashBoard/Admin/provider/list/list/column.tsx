/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type ColumnDef, createColumnHelper } from '@tanstack/react-table'
import type { IProvideStatusType, IProvidersTypeWithAction } from '../type'
import type { IProvider } from 'src/Views/type'
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
import getRole from 'src/utils'

const providerStatusObj: IProvideStatusType = {
  active: 'primary',
  inactive: 'warning',
  pending: 'warning',
}

const getLogo = (params: Pick<IProvider, 'logo' | 'name'>) => {
  const { logo, name } = params

  if (logo)
    return (
      <Avatar
        variant='rounded'
        src={logo}
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
    >{`${name?.charAt(0).toLocaleUpperCase()}`}</Avatar>
  )
}

const getAvatar = (
  params: Pick<
    IProvider['owner_provider'],
    'avatar' | 'firstname' | 'lastname'
  >,
) => {
  const { avatar, firstname, lastname } = params

  if (avatar)
    return (
      <Avatar
        src={avatar}
        sx={{
          height: 34,
          width: 34,
        }}
      />
    )

  return (
    <Avatar
      sx={{
        height: 34,
        width: 34,
      }}
    >
      {' '}
      {`${firstname?.charAt(0).toLocaleUpperCase()} ${lastname
        ?.charAt(0)
        .toLocaleUpperCase()}`}
    </Avatar>
  )
}
const columnHelper = createColumnHelper<IProvidersTypeWithAction>()

const columnDefault: Array<ColumnDef<IProvidersTypeWithAction, any>> = [
  columnHelper.accessor('name', {
    header: 'Provider',
    cell: ({ row }) => (
      <Box display='flex' alignItems='center' gap={1}>
        {getLogo({ logo: row.original.logo, name: row.original.name })}
        <Box display='flex' flexDirection='column'>
          <Typography color='text.primary' className='font-medium'>
            {row.original.name}
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
  columnHelper.accessor('owner_provider.firstname', {
    header: 'Owner',
    cell: ({ row }) => (
      <Box display='flex' alignItems='center' gap={1}>
        {getAvatar({
          avatar: row.original.owner_provider.avatar,
          firstname: row.original.owner_provider.firstname,
          lastname: row.original.owner_provider.lastname,
        })}
        <Box display='flex' flexDirection='column'>
          <Typography color='text.primary' className='font-medium'>
            {row.original.owner_provider.firstname}{' '}
            {row.original.owner_provider.lastname}
          </Typography>
          <Typography variant='body2'>
            {getRole(row.original.owner_provider.role ?? 0)}
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
  // columnHelper.accessor('user_type', {
  //   header: 'Role',
  //   cell: ({ row }) => (
  //     <div className='flex items-center gap-2'>
  //       <Icon
  //         className={userRoleObj[row.original.user_type].icon}
  //         sx={{
  //           color: `var(--mui-palette-${
  //             userRoleObj[row.original.user_type].color
  //           }-main)`,
  //         }}
  //       />
  //       <Typography className='capitalize' color='text.primary'>
  //         {row.original.user_type}
  //       </Typography>
  //     </div>
  //   ),
  // }),
  // columnHelper.accessor('currentPlan', {
  //   header: 'Plan',
  //   cell: ({ row }) => (
  //     <Typography className='capitalize' color='text.primary'>
  //       {row.original.currentPlan}
  //     </Typography>
  //   )
  // }),
  // columnHelper.accessor('billing', {
  //   header: 'Billing',
  //   cell: ({ row }) => <Typography>{row.original.billing}</Typography>
  // }),
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
