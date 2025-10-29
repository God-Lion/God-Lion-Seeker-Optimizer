import {
  Card,
  CardHeader,
  Typography,
  Checkbox,
  CardActions,
  Button,
  Box,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from '@mui/material'
import tableStyles from 'src/core/styles/table.module.css'

type TableDataType = {
  type: string
  app: boolean
  email: boolean
  browser: boolean
}

const tableData: Array<TableDataType> = [
  {
    app: false,
    email: true,
    browser: false,
    type: 'New for you',
  },
  {
    app: true,
    email: false,
    browser: true,
    type: 'Account activity',
  },
  {
    app: true,
    email: true,
    browser: true,
    type: 'A new browser used to sign in',
  },
  {
    app: false,
    email: false,
    browser: true,
    type: 'A new device is linked',
  },
]

const NotificationsTab = () => {
  return (
    <Card>
      <CardHeader
        title='Notifications'
        subheader='You will receive notification for the below selected items'
      />
      <Box
        sx={{ overflowX: 'auto' }}
        // className='overflow-x-auto'
      >
        <Table className={tableStyles.table}>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>App</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Browser</TableCell>
            </TableRow>
          </TableHead>
          <TableBody
            sx={{
              borderBlockEndWidth: '1px',
            }}
            // className='border-be'
          >
            {tableData.map((data, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Typography color='text.primary'>{data.type}</Typography>
                </TableCell>
                <TableCell>
                  <Checkbox defaultChecked={data.app} />
                </TableCell>
                <TableCell>
                  <Checkbox defaultChecked={data.email} />
                </TableCell>
                <TableCell>
                  <Checkbox defaultChecked={data.browser} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <CardActions
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
        // className='flex items-center gap-2'
      >
        <Button variant='contained' type='submit'>
          Save Changes
        </Button>
        <Button variant='contained' color='secondary' type='reset'>
          Discard
        </Button>
      </CardActions>
    </Card>
  )
}

export default NotificationsTab
