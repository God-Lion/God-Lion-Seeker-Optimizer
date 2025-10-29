import React from 'react'
import VirtualizedGrid from '../VirtualizedGrid'
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
} from '@mui/material'
import { faker } from '@faker-js/faker'

interface Product {
  id: string
  name: string
  price: number
  image: string
  category: string
  rating: number
  inStock: boolean
}

// Generate large dataset
const generateProducts = (count: number): Product[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `product-${i}`,
    name: faker.commerce.productName(),
    price: parseFloat(faker.commerce.price()),
    image: faker.image.urlPicsumPhotos({ width: 300, height: 200 }),
    category: faker.commerce.department(),
    rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
    inStock: faker.datatype.boolean(),
  }))
}

export default function VirtualizedGridExample() {
  const [products] = React.useState(() => generateProducts(1000))

  return (
    <Box sx={{ p: 3 }}>
      <h1>Virtualized Grid Example</h1>
      <p>Rendering 1,000 products in a 3-column grid with virtual scrolling</p>
      <VirtualizedGrid
        items={products}
        columns={3}
        renderItem={(product) => (
          <Card sx={{ height: '100%' }}>
            <CardMedia
              component='img'
              height='140'
              image={product.image}
              alt={product.name}
            />
            <CardContent>
              <Typography gutterBottom variant='h6' component='div' noWrap>
                {product.name}
              </Typography>
              <Typography variant='body2' color='text.secondary' noWrap>
                {product.category}
              </Typography>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mt={2}
              >
                <Typography variant='h6' color='primary'>
                  ${product.price}
                </Typography>
                <Chip
                  label={product.inStock ? 'In Stock' : 'Out of Stock'}
                  color={product.inStock ? 'success' : 'error'}
                  size='small'
                />
              </Box>
              <Box display='flex' alignItems='center' mt={1}>
                <Typography variant='body2' color='text.secondary'>
                  ⭐ {product.rating}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
        height='800px'
        estimatedItemHeight={280}
        gap={2}
        enableVirtualization={true}
      />
    </Box>
  )
}
