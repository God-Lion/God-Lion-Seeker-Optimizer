import React from 'react'
import ConfirmationDialog from '../confirmation-dialog'
import DialogCloseButton from '../DialogCloseButton'
import {
  Dialog,
  DialogTitle,
  Typography,
  DialogContent,
  MenuItem,
  Button,
  Divider,
  TextField,
} from '@mui/material'
import { Close } from '@mui/icons-material'

type UpgradePlanProps = {
  open: boolean
  setOpen: (open: boolean) => void
}

const UpgradePlan = ({ open, setOpen }: UpgradePlanProps) => {
  const [openConfirmation, setOpenConfirmation] = React.useState(false)

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <>
      <Dialog
        fullWidth
        open={open}
        onClose={handleClose}
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
          <Close />
        </DialogCloseButton>
        <DialogTitle
          variant='h4'
          className='flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16'
        >
          Upgrade Plan
          <Typography component='span' className='flex flex-col text-center'>
            Choose the best plan for user
          </Typography>
        </DialogTitle>
        <DialogContent className='overflow-visible pbs-0 sm:pli-16 sm:pbe-16'>
          <div className='flex items-end gap-4 flex-col sm:flex-row'>
            <TextField
              select
              fullWidth
              label='Choose Plan'
              defaultValue='Standard'
              id='user-view-plans-select'
            >
              <MenuItem value='Basic'>Basic - $0/month</MenuItem>
              <MenuItem value='Standard'>Standard - $99/month</MenuItem>
              <MenuItem value='Enterprise'>Enterprise - $499/month</MenuItem>
              <MenuItem value='Company'>Company - $999/month</MenuItem>
            </TextField>
            <Button
              variant='contained'
              className='capitalize sm:is-auto is-full'
            >
              Upgrade
            </Button>
          </div>
          <Divider className='mlb-6' />
          <div className='flex flex-col gap-1'>
            <Typography variant='body2'>
              User current plan is standard plan
            </Typography>
            <div className='flex items-center justify-between flex-wrap gap-2'>
              <div className='flex justify-center items-baseline gap-1'>
                <Typography
                  component='sup'
                  className='self-start mbs-3'
                  color='primary'
                >
                  $
                </Typography>
                <Typography component='span' color='primary' variant='h1'>
                  99
                </Typography>
                <Typography
                  variant='body2'
                  component='sub'
                  className='self-baseline'
                >
                  /month
                </Typography>
              </div>
              <Button
                variant='contained'
                className='capitalize'
                color='error'
                onClick={() => setOpenConfirmation(true)}
              >
                Cancel Subscription
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        open={openConfirmation}
        setOpen={setOpenConfirmation}
        type='unsubscribe'
      />
    </>
  )
}

export default UpgradePlan
