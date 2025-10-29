import ConfirmationDialog from 'src/components/dialogs/confirmation-dialog'
import UpgradePlan from 'src/components/dialogs/upgrade-plan'
import OpenDialogOnElementClick from 'src/components/dialogs/OpenDialogOnElementClick'
import {
  type ButtonProps,
  Card,
  CardHeader,
  CardContent,
  Box,
  Typography,
  Chip,
  Alert,
  AlertTitle,
  LinearProgress,
  Button,
} from '@mui/material'
import { ThemeColor } from 'src/core'
import { PricingPlanType } from '../../type'

const CurrentPlan = ({ data }: { data: Array<PricingPlanType> }) => {
  const buttonProps = (
    children: string,
    variant: ButtonProps['variant'],
    color: ThemeColor,
  ): ButtonProps => ({
    children,
    variant,
    color,
  })

  return (
    <Card>
      <CardHeader title='Current Plan' />
      <CardContent>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: '1 1 300px' }}>
            <div>
              <Typography className='font-medium text-textPrimary'>
                Your Current Plan is Basic
              </Typography>
              <Typography>A simple start for everyone</Typography>
            </div>
            <div>
              <Typography className='font-medium' color='text.primary'>
                Active until Dec 09, 2021
              </Typography>
              <Typography>
                We will send you a notification upon Subscription expiration
              </Typography>
            </div>
            <Box
              display='flex'
              flexDirection='column'
              gap={1}
              // className='flex flex-col gap-1'
            >
              <Box
                display='flex'
                alignItems='center'
                gap={2}
                // className='flex items-center gap-2'
              >
                <Typography className='font-medium' color='text.primary'>
                  $99 Per Month
                </Typography>
                <Chip
                  color='primary'
                  label='Popular'
                  size='small'
                  variant='filled'
                />
              </Box>
              <Typography>
                Standard plan for small to medium businesses
              </Typography>
            </Box>
          </Box>
          <Box sx={{ flex: '1 1 300px' }}>
            <Alert icon={false} severity='warning' className='mbe-4'>
              <AlertTitle>We need your attention!</AlertTitle>
              Your plan requires update
            </Alert>
            <Box
              display='flex'
              alignItems='center'
              justifyContent='space-between'
              // className='flex items-center justify-between'
            >
              <Typography className='font-medium' color='text.primary'>
                Days
              </Typography>
              <Typography className='font-medium' color='text.primary'>
                26 of 30 Days
              </Typography>
            </Box>
            <LinearProgress
              variant='determinate'
              value={80}
              className='mlb-1 bs-2.5'
            />
            <Typography variant='body2'>Your plan requires update</Typography>
          </Box>
          <Box sx={{ flex: '1 1 300px', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps('Upgrade plan', 'contained', 'primary')}
              dialog={UpgradePlan}
              dialogProps={{ data: data }}
            />
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps(
                'Cancel Subscription',
                'contained',
                'error',
              )}
              dialog={ConfirmationDialog}
              dialogProps={{ type: 'unsubscribe' }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default CurrentPlan
