import React from 'react'
import {
  type ButtonProps,
  Card,
  CardHeader,
  Button,
  CardContent,
  Typography,
  Chip,
  Box,
} from '@mui/material'
import BillingCard from 'src/components/dialogs/billing-card'
import OpenDialogOnElementClick from 'src/components/dialogs/OpenDialogOnElementClick'
import { ThemeColor } from 'src/core'
import { AddOutlined } from '@mui/icons-material'

type DataType = {
  name: string
  imgSrc: string
  imgAlt: string
  cardCvv: string
  expiryDate: string
  cardNumber: string
  cardStatus?: string
  badgeColor?: ThemeColor
}

const data: Array<DataType> = [
  {
    cardCvv: '587',
    name: 'Tom McBride',
    expiryDate: '12/24',
    imgAlt: 'Mastercard',
    badgeColor: 'primary',
    cardStatus: 'Primary',
    cardNumber: '5577 0000 5577 9865',
    imgSrc: '/images/logos/mastercard.png',
  },
  {
    cardCvv: '681',
    imgAlt: 'Visa card',
    expiryDate: '02/24',
    name: 'Mildred Wagner',
    cardNumber: '4532 3616 2070 5678',
    imgSrc: '/images/logos/visa.png',
  },
  {
    cardCvv: '3845',
    expiryDate: '08/20',
    badgeColor: 'error',
    cardStatus: 'Expired',
    name: 'Lester Jennings',
    imgAlt: 'American Express card',
    cardNumber: '3700 000000 00002',
    imgSrc: '/images/logos/american-express.png',
  },
]

const PaymentMethod = () => {
  const [creditCard, setCreditCard] = React.useState(0)

  const handleAddCard = () => {
    setCreditCard(-1)
  }

  const handleClickOpen = (index: number) => {
    setCreditCard(index)
  }

  const addButtonProps: ButtonProps = {
    variant: 'contained',
    children: 'Add Card',
    size: 'small',
    color: 'primary',
    startIcon: (
      <AddOutlined
      // className='tabler-plus'
      />
    ),
    onClick: handleAddCard,
  }

  const editButtonProps = (index: number): ButtonProps => ({
    variant: 'contained',
    children: 'Edit',
    size: 'small',
    onClick: () => handleClickOpen(index),
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Payment Methods'
          action={
            <OpenDialogOnElementClick
              element={Button}
              elementProps={addButtonProps}
              dialog={BillingCard}
            />
          }
        />
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
          // className='flex flex-col gap-4'
        >
          {data.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
              className='flex justify-between border rounded sm:items-center p-6 flex-col !items-start sm:flex-row gap-2'
            >
              <Box
                display='flex'
                flexDirection='column'
                alignItems='flex-start'
                gap={2}
                // className='flex flex-col items-start gap-2'
              >
                <img src={item.imgSrc} alt={item.imgAlt} height={25} />
                <Box
                  display='flex'
                  alignItems='center'
                  gap={2}
                  // className='flex items-center gap-2'
                >
                  <Typography className='font-medium' color='text.primary'>
                    {item.name}
                  </Typography>
                  {item.cardStatus ? (
                    <Chip
                      color={item.badgeColor}
                      label={item.cardStatus}
                      size='small'
                      variant='outlined'
                    />
                  ) : null}
                </Box>
                <Typography>
                  {item.cardNumber &&
                    item.cardNumber.slice(0, -4).replace(/[0-9]/g, '*') +
                      item.cardNumber.slice(-4)}
                </Typography>
              </Box>
              <Box
                display='flex'
                flexDirection='column'
                gap={4}
                // className='flex flex-col gap-4'
              >
                <Box
                  display='flex'
                  alignItems='center'
                  justifyContent='flex-end'
                  gap={4}
                  // className='flex items-center justify-end gap-4'
                >
                  <OpenDialogOnElementClick
                    element={Button}
                    elementProps={editButtonProps(index)}
                    dialog={BillingCard}
                    dialogProps={{ data: data[creditCard] }}
                  />
                  <Button variant='contained' color='error' size='small'>
                    Delete
                  </Button>
                </Box>
                <Typography variant='body2'>
                  Card expires at {item.expiryDate}
                </Typography>
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    </>
  )
}

export default PaymentMethod
