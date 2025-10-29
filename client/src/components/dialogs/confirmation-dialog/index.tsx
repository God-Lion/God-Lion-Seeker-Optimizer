import React from 'react'
// import Dialog from '@mui/material/Dialog'
// import DialogContent from '@mui/material/DialogContent'
// import DialogActions from '@mui/material/DialogActions'
// import Typography from '@mui/material/Typography'
// import Button from '@mui/material/Button'

// Third-party Imports
import classnames from 'classnames'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
} from '@mui/material'
import { Error } from '@mui/icons-material'

type ConfirmationType = 'delete-account' | 'unsubscribe' | 'suspend-account'

type ConfirmationDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  type: ConfirmationType
}

const ConfirmationDialog = ({
  open,
  setOpen,
  type,
}: ConfirmationDialogProps) => {
  // States
  const [secondDialog, setSecondDialog] = React.useState(false)
  const [userInput, setUserInput] = React.useState(false)

  // Vars
  const Wrapper = type === 'suspend-account' ? 'div' : React.Fragment

  const handleSecondDialogClose = () => {
    setSecondDialog(false)
    setOpen(false)
  }

  const handleConfirmation = (value: boolean) => {
    setUserInput(value)
    setSecondDialog(true)
    setOpen(false)
  }

  // console.log('userInput', userInput)

  // console.log('ass ', {
  //   'tabler-circle-check': userInput,
  //   'text-success': userInput,
  //   'tabler-circle-x': !userInput,
  //   'text-error': !userInput,
  // })

  // console.log(
  //   classnames('text-[88px] mbe-5 sm:mbe-8', {
  //     'tabler-circle-check': userInput,
  //     'text-success': userInput,
  //     'tabler-circle-x': !userInput,
  //     'text-error': !userInput,
  //   }),
  // )

  return (
    <>
      <Dialog
        fullWidth
        maxWidth='xs'
        open={open}
        onClose={() => setOpen(false)}
      >
        <DialogContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            textAlign: 'center',
          }}
          // className='flex items-center flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'
        >
          <Error
            sx={{
              fontSize: '88px',
            }}
            // className='tabler-alert-circle text-[88px] mbe-6 text-warning'
          />
          <Wrapper
            style={
              type === 'suspend-account'
                ? {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                  }
                : {}
            }
            // {...(type === 'suspend-account' && {
            //   className: 'flex flex-col items-center gap-5',
            // })}
          >
            <Typography variant='h5'>
              {type === 'delete-account' &&
                'Are you sure you want to deactivate your account?'}
              {type === 'unsubscribe' &&
                'Are you sure to cancel your subscription?'}
              {type === 'suspend-account' && 'Are you sure?'}
            </Typography>
            {type === 'suspend-account' && (
              <Typography color='text.primary'>
                You won&#39;t be able to revert user!
              </Typography>
            )}
          </Wrapper>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: 'center',
          }}
          // className='justify-center pbs-0 sm:pbe-16 sm:pli-16'
        >
          <Button variant='contained' onClick={() => handleConfirmation(true)}>
            {type === 'suspend-account' ? 'Yes, Suspend User!' : 'Yes'}
          </Button>
          <Button
            variant='outlined'
            color='secondary'
            onClick={() => {
              handleConfirmation(false)
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={secondDialog} onClose={handleSecondDialogClose}>
        <DialogContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            textAlign: 'center',
          }}
          // className='flex items-center flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'
        >
          <i
            className={classnames('text-[88px] mbe-5 sm:mbe-8', {
              'tabler-circle-check': userInput,
              'text-success': userInput,
              'tabler-circle-x': !userInput,
              'text-error': !userInput,
            })}
          />
          <Typography variant='h4' className='mbe-5'>
            {userInput
              ? `${
                  type === 'delete-account'
                    ? 'Deactivated'
                    : type === 'unsubscribe'
                    ? 'Unsubscribed'
                    : 'Suspended!'
                }`
              : 'Cancelled'}
          </Typography>
          <Typography color='text.primary'>
            {userInput ? (
              <>
                {type === 'delete-account' &&
                  'Your account has been deactivated successfully.'}
                {type === 'unsubscribe' &&
                  'Your subscription cancelled successfully.'}
                {type === 'suspend-account' && 'User has been suspended.'}
              </>
            ) : (
              <>
                {type === 'delete-account' && 'Account Deactivation Cancelled!'}
                {type === 'unsubscribe' && 'Unsubscription Cancelled!!'}
                {type === 'suspend-account' && 'Cancelled Suspension :)'}
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: 'center',
          }}
          // className='justify-center pbs-0 sm:pbe-16 sm:pli-16'
        >
          <Button
            variant='contained'
            color='success'
            onClick={handleSecondDialogClose}
          >
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ConfirmationDialog
