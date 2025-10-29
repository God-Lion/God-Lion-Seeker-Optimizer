import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
  LinearProgress,
  Chip,
  Stack,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DescriptionIcon from '@mui/icons-material/Description'
import { useTheme } from '@mui/material/styles'

interface CreateProfileDialogProps {
  open: boolean
  onClose: () => void
  onSave: (profileData: ProfileFormData) => Promise<void>
}

export interface ProfileFormData {
  name: string
  targetRole: string
  file: File | null
  skills: string[]
  setAsDefault: boolean
}

export const CreateProfileDialog: React.FC<CreateProfileDialogProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const theme = useTheme()
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    targetRole: '',
    file: null,
    skills: [],
    setAsDefault: false,
  })
  const [skillInput, setSkillInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        setError('Only PDF and Word documents are supported')
        return
      }
      setFormData({ ...formData, file })
      setError(null)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        setError('Only PDF and Word documents are supported')
        return
      }
      setFormData({ ...formData, file })
      setError(null)
    }
  }

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      })
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((skill) => skill !== skillToRemove),
    })
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Profile name is required')
      return
    }
    if (!formData.file) {
      setError('Please upload a resume file')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await onSave(formData)
      handleClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create profile')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      targetRole: '',
      file: null,
      skills: [],
      setAsDefault: false,
    })
    setSkillInput('')
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
            Create New Profile
          </Typography>
          <IconButton onClick={handleClose} size='small'>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Profile Name */}
          <TextField
            label='Profile Name'
            fullWidth
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder='e.g., Senior Developer Resume'
            helperText='A descriptive name for this profile'
          />

          {/* Target Role */}
          <TextField
            label='Target Role'
            fullWidth
            value={formData.targetRole}
            onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
            placeholder='e.g., Software Engineer, Product Manager'
            helperText='Optional: The role you are targeting with this resume'
          />

          {/* File Upload */}
          <Box>
            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              Upload Resume *
            </Typography>
            <Box
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              sx={{
                border: `2px dashed ${dragActive ? theme.palette.primary.main : theme.palette.divider}`,
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                backgroundColor: dragActive ? `${theme.palette.primary.main}10` : 'transparent',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
            >
              {formData.file ? (
                <Box>
                  <DescriptionIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 1 }} />
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    {formData.file.name}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {(formData.file.size / 1024).toFixed(2)} KB
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Button
                      size='small'
                      onClick={() => setFormData({ ...formData, file: null })}
                    >
                      Remove
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <CloudUploadIcon sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 1 }} />
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    Drag and drop your resume here or
                  </Typography>
                  <Button
                    variant='outlined'
                    component='label'
                    startIcon={<CloudUploadIcon />}
                  >
                    Browse Files
                    <input
                      type='file'
                      hidden
                      accept='.pdf,.doc,.docx'
                      onChange={handleFileChange}
                    />
                  </Button>
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                    PDF or Word document, max 5MB
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Skills */}
          <Box>
            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              Key Skills (Optional)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size='small'
                fullWidth
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSkill()
                  }
                }}
                placeholder='Add a skill and press Enter'
              />
              <Button onClick={handleAddSkill} variant='outlined'>
                Add
              </Button>
            </Box>
            <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap>
              {formData.skills.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  onDelete={() => handleRemoveSkill(skill)}
                  size='small'
                  sx={{ mb: 0.5 }}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={loading || !formData.name || !formData.file}
        >
          Create Profile
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateProfileDialog
