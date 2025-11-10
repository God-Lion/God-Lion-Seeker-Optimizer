import React from 'react'
import {
  Box,
  Button,
  Container,
  DialogActions,
  Grid,
  TextField,
} from '@mui/material'
import { makeStyles } from '@mui/material/styles'
import 'react-phone-input-2/lib/style.css'
import { useForm, Controller } from 'react-hook-form'
import { handlePostForme, handlePutForme } from '../../services/app/index'
import { useAuth } from '../../store'

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
  paper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
    width: 100,
    height: 100,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}))

export default function FormeForm({
  data,
  handleClose,
  handleClickStatus,
  setIsUpdated,
  setLoading,
}) {
  const classes = useStyles()
  const controlForm = useForm({
    defaultValues: {
      product: '',
    },
  })
  const { user } = useAuth()

  const onSubmit = async (data) => {
    if (data?.id) {
      setLoading(true)
      const response = await handlePutForme({
        user_modify_id: user?.id || user?.id_user,
        ...data,
      })
      setLoading(false)
      if (response?.status === 200)
        handleClickStatus({
          type: 'success',
          state: 'modify',
          msg: 'Modification de la forme du produit réussie',
        })
      if (response?.status >= 400)
        handleClickStatus({
          type: 'error',
          state: 'modify',
          msg: 'Échec de la modification de la forme du produit',
        })
    } else {
      setLoading(true)
      const response = await handlePostForme({
        user_created_id: user?.id || user?.id_user,
        ...data,
      })
      setLoading(false)
      if (response?.status === 200)
        handleClickStatus({
          type: 'success',
          state: 'save',
          msg: 'Enregistrement de la forme du produit réussi',
        })
      if (response?.status >= 400)
        handleClickStatus({
          type: 'error',
          state: 'save',
          msg: "Échec de l'enregistrement de la forme du produit",
        })
    }
    setIsUpdated(true)
    handleClose()
  }

  React.useEffect(() => {
    if (data) {
      controlForm.setValue('id', data?.id)
      controlForm.setValue('product', data?.product)
    }
  }, [controlForm, data])

  return (
    <div>
      <Container component='main' maxWidth='sm' style={{}}>
        <div className={classes.paper}>
          <Box
            component='form'
            className={classes.form}
            onSubmit={controlForm.handleSubmit(onSubmit)}
            sx={{ mt: 3 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name='product'
                  control={controlForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      required
                      autoFocus
                      type='text'
                      label='Forme produit'
                      fullWidth
                      variant='outlined'
                      error={
                        controlForm.formState?.errors?.product !== undefined
                      }
                      helperText={
                        controlForm.formState?.errors?.product?.message
                      }
                    />
                  )}
                />
              </Grid>
            </Grid>
            <DialogActions sx={{ my: '20px', mx: '0px' }}>
              <Button
                variant='contained'
                color='error'
                position='left'
                onClick={() => {
                  controlForm.reset()
                  handleClose()
                }}
              >
                Annuler
              </Button>

              <Button
                autoFocus
                type='submit'
                color='primary'
                variant='contained'
                position='right'
                className={classes.submit}
              >
                {data?.id ? 'Modifier' : 'Sauvegarder'}
              </Button>
            </DialogActions>
          </Box>
        </div>
      </Container>
    </div>
  )
}
