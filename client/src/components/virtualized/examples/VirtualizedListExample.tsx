import React from 'react'
import VirtualizedList from '../VirtualizedList'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
} from '@mui/material'
import { faker } from '@faker-js/faker'

interface Message {
  id: string
  sender: string
  subject: string
  preview: string
  timestamp: Date
  avatar: string
  unread: boolean
}

// Generate large dataset
const generateMessages = (count: number): Message[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `msg-${i}`,
    sender: faker.person.fullName(),
    subject: faker.lorem.sentence(),
    preview: faker.lorem.paragraph(),
    timestamp: faker.date.recent({ days: 30 }),
    avatar: faker.image.avatar(),
    unread: faker.datatype.boolean(),
  }))
}

export default function VirtualizedListExample() {
  const [messages] = React.useState(() => generateMessages(2000))

  return (
    <Box sx={{ p: 3 }}>
      <h1>Virtualized List Example</h1>
      <p>Rendering 2,000 messages with virtual scrolling</p>
      <VirtualizedList
        items={messages}
        renderItem={(message) => (
          <Card
            sx={{
              mb: 1,
              backgroundColor: message.unread ? 'action.hover' : 'background.paper',
            }}
          >
            <CardContent>
              <Box display='flex' alignItems='center' gap={2}>
                <Avatar src={message.avatar} alt={message.sender} />
                <Box flex={1}>
                  <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Typography variant='h6' component='div'>
                      {message.sender}
                    </Typography>
                    {message.unread && (
                      <Chip label='Unread' color='primary' size='small' />
                    )}
                  </Box>
                  <Typography variant='subtitle2' color='text.secondary'>
                    {message.subject}
                  </Typography>
                  <Typography variant='body2' color='text.secondary' noWrap>
                    {message.preview}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {message.timestamp.toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
        height='700px'
        estimatedItemHeight={120}
        enableVirtualization={true}
      />
    </Box>
  )
}
