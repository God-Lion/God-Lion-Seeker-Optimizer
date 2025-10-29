import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  AvatarGroup,
  Avatar,
  Box,
} from '@mui/material'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline from '@mui/lab/Timeline'
import type { TimelineProps } from '@mui/lab/Timeline'
import styled from '@emotion/styled'

import CustomAvatar from 'src/core/components/mui/Avatar'

const Timeline = styled(MuiTimeline)<TimelineProps>({
  paddingLeft: 0,
  paddingRight: 0,
  '& .MuiTimelineItem-root': {
    width: '100%',
    '&:before': {
      display: 'none',
    },
  },
})

const UserActivityTimeLine = () => {
  return (
    <Card>
      <CardHeader title='User Activity Timeline' />
      <CardContent>
        <Timeline>
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color='primary' />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Box
                display='flex'
                flexWrap='wrap'
                alignItems='center'
                justifyContent='space-between'
                rowGap={2}
                marginBlockEnd='0.625rem'
                // className='flex flex-wrap items-center justify-between gap-x-2 mbe-2.5'
              >
                <Typography
                  fontWeight={500}
                  // className='font-medium'
                  color='text.primary'
                >
                  12 Invoices have been paid
                </Typography>
                <Typography variant='caption' color='text.disabled'>
                  12 min ago
                </Typography>
              </Box>
              <Typography //className='mbe-2'
                marginBlockEnd='0.625rem'
              >
                Invoices have been paid to the company
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2.5,
                  inlineSize: 'fit-content',
                  backgroundColor: 'rgb(var(#E91E63 / 0.06)',
                  borderRadius: '0.375rem',
                  paddingInline: '0.625rem',
                }}
                // className='flex items-center gap-2.5 is-fit bg-actionHover rounded plb-[5px] pli-2.5'
              >
                <img
                  height={20}
                  alt='invoice.pdf'
                  src='/images/icons/pdf-document.png'
                />
                <Typography
                  fontWeight={500}
                  //  className='font-medium'
                >
                  invoices.pdf
                </Typography>
              </Box>
            </TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color='success' />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Box
                display='flex'
                flexWrap='wrap'
                alignItems='center'
                justifyContent='space-between'
                rowGap={2}
                marginBlockEnd='0.625rem'
                // className='flex flex-wrap items-center justify-between gap-x-2 mbe-2.5'
              >
                <Typography
                  fontWeight={500}
                  // className='font-medium'
                  color='text.primary'
                >
                  Client Meeting
                </Typography>
                <Typography variant='caption' color='text.disabled'>
                  45 min ago
                </Typography>
              </Box>
              <Typography
                marginBlockEnd='0.5rem'
                // className='mbe-2'
              >
                Project meeting with john @10:15am
              </Typography>
              <Box
                display='flex'
                alignItems='center'
                gap={2.5}
                // className='flex items-center gap-2.5'
              >
                <CustomAvatar src='/images/avatars/1.png' size={32} />
                <Box
                  display='flex'
                  flexDirection='column'
                  flexWrap='wrap'
                  // className='flex flex-col flex-wrap'
                >
                  <Typography
                    variant='body2'
                    fontWeight={500}
                    // className='font-medium'
                  >
                    Lester McCarthy (Client)
                  </Typography>
                  <Typography variant='body2'>CEO of Pixinvent</Typography>
                </Box>
              </Box>
            </TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color='info' />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Box
                display='flex'
                flexWrap='wrap'
                alignItems='center'
                justifyContent='space-between'
                rowGap={2}
                marginBlockEnd='0.625rem'
                // className='flex flex-wrap items-center justify-between gap-x-2 mbe-2.5'
              >
                <Typography className='font-medium' color='text.primary'>
                  Create a new project for client
                </Typography>
                <Typography variant='caption' color='text.disabled'>
                  2 Day Ago
                </Typography>
              </Box>
              <Typography
                marginBlockEnd='0.5rem' //className='mbe-2'
              >
                6 team members in a project
              </Typography>
              <AvatarGroup total={6} className='pull-up'>
                <Avatar alt='Travis Howard' src='/images/avatars/1.png' />
                <Avatar alt='Agnes Walker' src='/images/avatars/4.png' />
                <Avatar alt='John Doe' src='/images/avatars/2.png' />
              </AvatarGroup>
            </TimelineContent>
          </TimelineItem>
        </Timeline>
      </CardContent>
    </Card>
  )
}

export default UserActivityTimeLine
