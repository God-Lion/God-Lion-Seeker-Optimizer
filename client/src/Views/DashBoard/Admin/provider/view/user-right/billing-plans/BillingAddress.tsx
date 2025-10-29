import {
  ButtonProps,
  Card,
  CardHeader,
  Button,
  CardContent,
  Box,
  Typography,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material'
import OpenDialogOnElementClick from '../../OpenDialogOnElementClick'
import AddNewAddress from 'src/components/dialogs/add-edit-address'
import { AddOutlined } from '@mui/icons-material'

const data = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'johndoe@gmail.com',
  country: 'US',
  address1: '100 Water Plant Avenue,',
  address2: 'Building 1303 Wake Island',
  landmark: 'Near Water Plant',
  city: 'New York',
  state: 'Capholim',
  zipCode: '403114',
  taxId: 'TAX-875623',
  vatNumber: 'SDF754K77',
  contact: '+1(609) 933-44-22',
}

const BillingAddress = () => {
  const buttonProps: ButtonProps = {
    variant: 'contained',
    children: 'Edit Address',
    size: 'small',
    startIcon: (
      <AddOutlined
      //  className='tabler-plus'
      />
    ),
  }

  return (
    <>
      <Card>
        <CardHeader
          title='Billing Address'
          action={
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps}
              dialog={AddNewAddress}
              dialogProps={{ data }}
            />
          }
        />
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 300px' }}>
              <Table>
                <TableBody
                  sx={{ verticalAlign: 'top' }}
                  // className='align-top'
                >
                  <TableRow>
                    <TableCell
                      sx={{
                        padding: '0.25rem',
                        paddingInlineStart: '0px',
                        inlineSize: '150px',
                      }}
                      // className='p-1 pis-0 is-[150px]'
                    >
                      <Typography
                        fontWeight={500}
                        //className='font-medium'
                        color='text.primary'
                      >
                        Name:
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{ padding: '0.25rem' }} //className='p-1'
                    >
                      <Typography>{`${data.firstName} ${data.lastName}`}</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={{
                        padding: '0.25rem',
                        paddingInlineStart: '0px',
                        inlineSize: '150px',
                      }}
                      // className='p-1 pis-0 is-[150px]'
                    >
                      <Typography
                        fontWeight={500}
                        //className='font-medium'
                        color='text.primary'
                      >
                        Billing Email:
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{ padding: '0.25rem' }}
                      // className='p-1'
                    >
                      <Typography>{data.email}</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={{
                        padding: '0.25rem',
                        paddingInlineStart: '0px',
                        inlineSize: '150px',
                      }}
                      // className='p-1 pis-0 is-[150px]'
                    >
                      <Typography
                        fontWeight={500}
                        //className='font-medium'
                        color='text.primary'
                      >
                        Tax ID:
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{ padding: '0.25rem' }} // className='p-1'
                    >
                      <Typography>{data.taxId}</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={{
                        padding: '0.25rem',
                        paddingInlineStart: '0px',
                        inlineSize: '150px',
                      }}
                      // className='p-1 pis-0 is-[150px]'
                    >
                      <Typography
                        fontWeight={500}
                        //className='font-medium'
                        color='text.primary'
                      >
                        VAT Number:
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{ padding: '0.25rem' }} //className='p-1'
                    >
                      <Typography>{data.vatNumber}</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={{
                        padding: '0.25rem',
                        paddingInlineStart: '0px',
                        inlineSize: '150px',
                      }}
                      // className='p-1 pis-0 is-[150px]'
                    >
                      <Typography
                        fontWeight={500}
                        //className='font-medium'
                        color='text.primary'
                      >
                        Billing Address:
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{ padding: '0.25rem' }} //className='p-1'
                    >
                      <Typography>{`${data.address1} ${data.address2}`}</Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
            <Box sx={{ flex: '1 1 300px' }}>
              <Table>
                <Table
                  sx={{ verticalAlign: 'top' }}
                  // className='align-top'
                >
                  <TableRow>
                    <TableCell
                      sx={{
                        padding: '0.25rem',
                        paddingInlineStart: '0px',
                        inlineSize: '150px',
                      }}
                      // className='p-1 pis-0 is-[150px]'
                    >
                      <Typography
                        fontWeight={500}
                        //className='font-medium'
                        color='text.primary'
                      >
                        Contact:
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{ padding: '0.25rem' }} //className='p-1'
                    >
                      <Typography>{data.contact}</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={{
                        padding: '0.25rem',
                        paddingInlineStart: '0px',
                        inlineSize: '150px',
                      }}
                      // className='p-1 pis-0 is-[150px]'
                    >
                      <Typography
                        fontWeight={500}
                        //className='font-medium'
                        color='text.primary'
                      >
                        Landmark:
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{ padding: '0.25rem' }}
                      //className='p-1'
                    >
                      <Typography>{data.landmark}</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={{
                        padding: '0.25rem',
                        paddingInlineStart: '0px',
                        inlineSize: '150px',
                      }}
                      // className='p-1 pis-0 is-[150px]'
                    >
                      <Typography
                        fontWeight={500}
                        //className='font-medium'
                        color='text.primary'
                      >
                        Landmark:
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{ padding: '0.25rem' }} //className='p-1'
                    >
                      <Typography>{data.city}</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={{
                        padding: '0.25rem',
                        paddingInlineStart: '0px',
                        inlineSize: '150px',
                      }}
                      // className='p-1 pis-0 is-[150px]'
                    >
                      <Typography
                        fontWeight={500}
                        //className='font-medium'
                        color='text.primary'
                      >
                        Country:
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{ padding: '0.25rem' }} //className='p-1'
                    >
                      <Typography>{data.country}</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={{
                        padding: '0.25rem',
                        paddingInlineStart: '0px',
                        inlineSize: '150px',
                      }}
                      // className='p-1 pis-0 is-[150px]'
                    >
                      <Typography
                        fontWeight={500}
                        //className='font-medium'
                        color='text.primary'
                      >
                        State:
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{ padding: '0.25rem' }} //className='p-1'
                    >
                      <Typography>{data.state}</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={{
                        padding: '0.25rem',
                        paddingInlineStart: '0px',
                        inlineSize: '150px',
                      }}
                      // className='p-1 pis-0 is-[150px]'
                    >
                      <Typography
                        fontWeight={500}
                        //className='font-medium'
                        color='text.primary'
                      >
                        Zip Code:
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{ padding: '0.25rem' }}
                      // className='p-1'
                    >
                      <Typography>{data.zipCode}</Typography>
                    </TableCell>
                  </TableRow>
                </Table>
              </Table>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </>
  )
}

export default BillingAddress
