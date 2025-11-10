import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TextField, Button, Box, } from '@mui/material'
import { useChangePassword } from '../../hooks/useAuthQuery'

const schema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

type FormData = z.infer<typeof schema>

export function ChangePasswordForm() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  
  const changePasswordMutation = useChangePassword()
  
  const onSubmit = (data: FormData) => {
    changePasswordMutation.mutate(data, {
      onSuccess: () => {
        alert('Password changed successfully! Please login again.')
        reset()
        // Redirect to login
        window.location.href = '/auth/signin'
      },
      onError: (error: any) => {
        alert(error.response?.data?.detail || 'Failed to change password')
      },
    })
  }
  
  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
      <TextField
        fullWidth
        type="password"
        label="Current Password"
        {...register('current_password')}
        error={!!errors.current_password}
        helperText={errors.current_password?.message}
        margin="normal"
      />
      
      <TextField
        fullWidth
        type="password"
        label="New Password"
        {...register('new_password')}
        error={!!errors.new_password}
        helperText={errors.new_password?.message}
        margin="normal"
      />
      
      <TextField
        fullWidth
        type="password"
        label="Confirm New Password"
        {...register('confirm_password')}
        error={!!errors.confirm_password}
        helperText={errors.confirm_password?.message}
        margin="normal"
      />
      
      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{ mt: 3 }}
        disabled={changePasswordMutation.isPending}
      >
        {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
      </Button>
    </Box>
  )
}