import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material'
import Grid from 'src/components/Grid'
import AddIcon from '@mui/icons-material/Add'
import { ProfileCard, CreateProfileDialog, ResumeProfile, ProfileFormData } from '../components'

// Mock data
const mockProfiles: ResumeProfile[] = [
  {
    id: '1',
    name: 'Senior Software Engineer Resume',
    fileName: 'resume_senior_swe.pdf',
    fileSize: '245 KB',
    uploadedDate: '2025-10-20T10:00:00',
    lastModified: '2025-10-23T14:30:00',
    isActive: true,
    isDefault: true,
    version: 3,
    skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker', 'Python'],
    targetRole: 'Senior Software Engineer',
  },
  {
    id: '2',
    name: 'Full Stack Developer Resume',
    fileName: 'resume_fullstack.pdf',
    fileSize: '198 KB',
    uploadedDate: '2025-09-15T09:00:00',
    lastModified: '2025-10-10T11:20:00',
    isActive: false,
    isDefault: false,
    version: 2,
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express'],
    targetRole: 'Full Stack Developer',
  },
  {
    id: '3',
    name: 'Frontend Specialist Resume',
    fileName: 'resume_frontend.pdf',
    fileSize: '210 KB',
    uploadedDate: '2025-08-01T08:00:00',
    lastModified: '2025-09-05T16:45:00',
    isActive: false,
    isDefault: false,
    version: 1,
    skills: ['React', 'Vue.js', 'CSS', 'HTML5', 'Tailwind CSS'],
    targetRole: 'Frontend Developer',
  },
]

const ProfileManagement: React.FC = () => {
  const [profiles, setProfiles] = useState<ResumeProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Replace with actual API call
      // const response = await profileService.getAll()
      // setProfiles(response.data)
      
      await new Promise(resolve => setTimeout(resolve, 500))
      setProfiles(mockProfiles)
    } catch (err: any) {
      setError(err.message || 'Failed to load profiles')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProfile = async (profileData: ProfileFormData) => {
    try {
      // TODO: Replace with actual API call
      // const response = await profileService.create(profileData)
      
      const newProfile: ResumeProfile = {
        id: Date.now().toString(),
        name: profileData.name,
        fileName: profileData.file?.name || 'unknown',
        fileSize: `${((profileData.file?.size || 0) / 1024).toFixed(0)} KB`,
        uploadedDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isActive: profiles.length === 0,
        isDefault: profileData.setAsDefault || profiles.length === 0,
        version: 1,
        skills: profileData.skills,
        targetRole: profileData.targetRole,
      }

      setProfiles([newProfile, ...profiles])
      setCreateDialogOpen(false)
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create profile')
    }
  }

  const handleEditProfile = (profileId: string) => {
    // TODO: Open edit dialog
    console.log('Edit profile:', profileId)
  }

  const handleDeleteProfile = async (profileId: string) => {
    setProfileToDelete(profileId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!profileToDelete) return

    try {
      // TODO: Replace with actual API call
      // await profileService.delete(profileToDelete)
      
      setProfiles(profiles.filter(p => p.id !== profileToDelete))
      setDeleteDialogOpen(false)
      setProfileToDelete(null)
    } catch (err: any) {
      setError(err.message || 'Failed to delete profile')
    }
  }

  const handleDownloadProfile = async (profileId: string) => {
    try {
      // TODO: Replace with actual API call
      // await profileService.download(profileId)
      console.log('Download profile:', profileId)
    } catch (err: any) {
      setError(err.message || 'Failed to download profile')
    }
  }

  const handleSetActive = async (profileId: string) => {
    try {
      // TODO: Replace with actual API call
      // await profileService.setActive(profileId)
      
      setProfiles(profiles.map(p => ({
        ...p,
        isActive: p.id === profileId,
      })))
    } catch (err: any) {
      setError(err.message || 'Failed to set active profile')
    }
  }

  const handleSetDefault = async (profileId: string) => {
    try {
      // TODO: Replace with actual API call
      // await profileService.setDefault(profileId)
      
      setProfiles(profiles.map(p => ({
        ...p,
        isDefault: p.id === profileId,
      })))
    } catch (err: any) {
      setError(err.message || 'Failed to set default profile')
    }
  }

  if (loading && profiles.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 1 }}>
            Profile Management
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Manage your resume profiles for different job applications
          </Typography>
        </Box>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Profile
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Profiles Grid */}
      {profiles.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant='h6' color='text.secondary' sx={{ mb: 1 }}>
            No profiles yet
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            Create your first profile to get started
          </Typography>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Your First Profile
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {profiles.map((profile) => (
            <Grid item xs={12} sm={6} md={4} key={profile.id}>
              <ProfileCard
                profile={profile}
                onEdit={handleEditProfile}
                onDelete={handleDeleteProfile}
                onDownload={handleDownloadProfile}
                onSetActive={handleSetActive}
                onSetDefault={handleSetDefault}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Profile Dialog */}
      <CreateProfileDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSave={handleCreateProfile}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Profile</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this profile? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color='error' variant='contained'>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ProfileManagement
