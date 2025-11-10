import React from 'react'
import {
  Box,
  Button,
  Checkbox,
  Container,
  DialogActions,
  Grid,
  FormControlLabel,
  FormHelperText,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
} from '@mui/material'
import { makeStyles } from '@mui/material/styles'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { useForm, Controller } from 'react-hook-form'
import { cinInput } from './InputCustom'
// import { handleUserRegister, handlePutUser } from '../../services/app/index'

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

// eslint-disable-next-line react/prop-types
export default function UserForm({
  data,
  handleClose,
  handleClickStatus,
  setIsUpdated,
}) {
  const classes = useStyles()
  // eslint-disable-next-line no-unused-vars
  const [admin, setAdmin] = React.useState(false)
  const controlForm = useForm({
    defaultValues: {
      userTypeID: '',
      store_fk: '',
      first_name: '',
      last_name: '',
      username: '',
      adress: '',
      cin_nif: '',
      email: '',
      phone: '',
      password: '',
      photo: '',
      createByAdmin: false,
      actif: false,
    },
  })

  const onSubmit = async (data) => {
    // if (data?.id_user) {
    //   const response = await handlePutUser(data)
    //   if (response?.status === 200)
    //     handleClickStatus({
    //       type: 'success',
    //       state: 'modify',
    //       masg: "Modification de l'utilisateur réussie",
    //     })
    //   if (response?.status >= 400)
    //     handleClickStatus({
    //       type: 'error',
    //       state: 'modify',
    //       masg: "Échec de la modification de l'utilisateur",
    //     })
    // } else {
    //   const response = await handleUserRegister(data)
    //   if (response?.status === 200)
    //     handleClickStatus({
    //       type: 'success',
    //       state: 'save',
    //       masg: "Enregistrement de l'utilisateur réussi",
    //     })
    //   if (response?.status >= 400)
    //     handleClickStatus({
    //       type: 'error',
    //       state: 'save',
    //       masg: "Échec de l'enregistrement de l'utilisateur",
    //     })
    // }
    setIsUpdated(true)
    handleClose()
  }

  React.useEffect(() => {
    if (data) {
      controlForm.setValue('id_user', data?.id_user)
      controlForm.setValue('userTypeID', data?.userTypeID)
      controlForm.setValue('store_fk', data?.store_fk)
      controlForm.setValue('first_name', data?.first_name)
      controlForm.setValue('last_name', data?.last_name)
      controlForm.setValue('username', data?.username)
      controlForm.setValue('adress', data?.adress)
      controlForm.setValue('cin_nif', data?.cin_nif)
      controlForm.setValue('email', data?.email)
      controlForm.setValue('phone', data?.phone)
      controlForm.setValue('password', data?.password)
      controlForm.setValue('photo', data?.photo)
      controlForm.setValue(
        'createByAdmin',
        data?.createByAdmin === 1 ? true : false,
      )
      setAdmin(controlForm.getValues('createByAdmin'))
      controlForm.setValue('actif', data?.actif === 1 ? true : false)
    }
  }, [controlForm, data])

  return (
    <div>
      <Container component='main' maxWidth='sm' style={{}}>
        <div className={classes.paper}>
          <Box
            component='form'
            onSubmit={controlForm.handleSubmit(onSubmit)}
            sx={{ mt: 3 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name='userTypeID'
                  control={controlForm.control}
                  render={({ field }) => (
                    <FormControl
                      fullWidth
                      error={
                        controlForm.formState?.errors?.userTypeID !== undefined
                      }
                    >
                      <InputLabel id='demo-simple-select-label'>
                        Type utilisateur
                      </InputLabel>
                      <Select
                        {...field}
                        style={{ width: '100%' }}
                        labelId='demo-simple-select-label'
                        id='demo-simple-select'
                        variant='outlined'
                      >
                        {[
                          { id: 1, role: 'SuperAdmin' },
                          { id: 2, role: 'Admin' },
                          { id: 3, role: 'Superviseur' },
                          { id: 4, role: 'Juge' },
                        ].map((el) => (
                          <MenuItem key={el.id} value={el.id}>
                            {el.role}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {controlForm.formState?.errors?.userTypeID?.message}
                      </FormHelperText>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name='store_fk'
                  control={controlForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      autoFocus
                      type='text'
                      label='store_fk'
                      fullWidth
                      variant='outlined'
                      error={
                        controlForm.formState?.errors?.store_fk !== undefined
                      }
                      helperText={
                        controlForm.formState?.errors?.store_fk?.message
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name='first_name'
                  control={controlForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      required
                      autoFocus
                      type='text'
                      label='Prénom'
                      fullWidth
                      variant='outlined'
                      error={
                        controlForm.formState?.errors?.first_name !== undefined
                      }
                      helperText={
                        controlForm.formState?.errors?.first_name?.message
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name='last_name'
                  control={controlForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      required
                      autoFocus
                      type='text'
                      label='Nom'
                      fullWidth
                      variant='outlined'
                      error={
                        controlForm.formState?.errors?.last_name !== undefined
                      }
                      helperText={
                        controlForm.formState?.errors?.last_name?.message
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name='username'
                  control={controlForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      required
                      autoFocus
                      type='text'
                      label='Pseudo'
                      fullWidth
                      variant='outlined'
                      error={
                        controlForm.formState?.errors?.username !== undefined
                      }
                      helperText={
                        controlForm.formState?.errors?.username?.message
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name='adress'
                  control={controlForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      autoFocus
                      type='address'
                      label='Adresse'
                      fullWidth
                      variant='outlined'
                      error={
                        controlForm.formState?.errors?.adress !== undefined
                      }
                      helperText={
                        controlForm.formState?.errors?.adress?.message
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name='cin_nif'
                  control={controlForm.control}
                  render={({ field }) => (
                    <FormControl
                      fullWidth
                      variant='outlined'
                      error={
                        controlForm.formState?.errors?.cin_nif !== undefined
                      }
                    >
                      <InputLabel required>Cin Nif</InputLabel>
                      <OutlinedInput
                        {...field}
                        onChange={(nif) => field.onChange(nif)}
                        inputComponent={cinInput}
                      />
                      <FormHelperText>
                        {controlForm.formState?.errors?.cin_nif?.message}
                      </FormHelperText>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name='email'
                  control={controlForm.control}
                  rules={{
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: 'Adresse e-mail invalide',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      required
                      autoFocus
                      type='email'
                      label='Email'
                      fullWidth
                      variant='outlined'
                      error={controlForm.formState?.errors?.email !== undefined}
                      helperText={controlForm.formState?.errors?.email?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name='phone'
                  control={controlForm.control}
                  render={({ field }) => (
                    <PhoneInput
                      {...field}
                      country={'ht'}
                      placeholder='Téléphone'
                      inputProps={{
                        name: 'phone',
                        required: true,
                        autoFocus: false,
                      }}
                      inputStyle={{
                        paddding: 12,
                        width: '100%',
                      }}
                      error={controlForm.formState?.errors?.phone !== undefined}
                      helperText={controlForm.formState?.errors?.phone?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name='password'
                  control={controlForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      required
                      autoFocus
                      type='text'
                      label='Mot de passe'
                      fullWidth
                      variant='outlined'
                      error={
                        controlForm.formState?.errors?.password !== undefined
                      }
                      helperText={
                        controlForm.formState?.errors?.password?.message
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name='photo'
                  control={controlForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      autoFocus
                      type='text'
                      label='Photo'
                      fullWidth
                      variant='outlined'
                      error={controlForm.formState?.errors?.photo !== undefined}
                      helperText={controlForm.formState?.errors?.photo?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name='actif'
                  control={controlForm.control}
                  render={({ field }) => (
                    <FormControl component='fieldset'>
                      <FormControlLabel
                        control={<Checkbox {...field} />}
                        label='Actif'
                        labelPlacement='end'
                        checked={data?.id ? controlForm.watch('actif') : true}
                        onClick={(event) => {
                          controlForm.setValue('actif', event?.target?.value)
                        }}
                      />
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
            <DialogActions>
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
                {data?.id_user ? 'Modifier' : 'Sauvegarder'}
              </Button>
            </DialogActions>
          </Box>
        </div>
      </Container>
    </div>
  )
}
