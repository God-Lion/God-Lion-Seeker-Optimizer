import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Avatar,
  Stack,
  Divider,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DescriptionIcon from '@mui/icons-material/Description'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import AccessTimeIcon from '@mui/icons-material/AccessTime'

export interface ResumeProfile {
  id: string
  name: string
  fileName: string
  fileSize: string
  uploadedDate: string
  lastModified: string
  isActive: boolean
  isDefault: boolean
  version: number
  skills: string[]
  targetRole?: string
}

interface ProfileCardProps {
  profile: ResumeProfile
  onEdit?: (profileId: string) => void
  onDelete?: (profileId: string) => void
  onDownload?: (profileId: string) => void
  onSetActive?: (profileId: string) => void
  onSetDefault?: (profileId: string) => void
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onEdit,
  onDelete,
  onDownload,
  onSetActive,
  onSetDefault,
}) => {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleEdit = () => {
    onEdit?.(profile.id)
    handleMenuClose()
  }

  const handleDelete = () => {
    onDelete?.(profile.id)
    handleMenuClose()
  }

  const handleDownload = () => {
    onDownload?.(profile.id)
    handleMenuClose()
  }

  const handleSetActive = () => {
    onSetActive?.(profile.id)
  }

  const handleSetDefault = () => {
    onSetDefault?.(profile.id)
    handleMenuClose()
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: profile.isActive ? `2px solid ${theme.palette.primary.main}` : undefined,
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      {/* Default Badge */}
      {profile.isDefault && (
        <Chip
          icon={<StarIcon />}
          label='Default'
          size='small'
          color='warning'
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1,
          }}
        />
      )}

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: profile.isActive ? theme.palette.primary.main : theme.palette.grey[400],
              mr: 2,
            }}
          >
            <DescriptionIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {profile.name}
            </Typography>
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
              {profile.fileName}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {profile.fileSize} • v{profile.version}
            </Typography>
          </Box>
          <IconButton size='small' onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Target Role */}
        {profile.targetRole && (
          <Box sx={{ mb: 2 }}>
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
              Target Role
            </Typography>
            <Typography variant='body2' sx={{ fontWeight: 500 }}>
              {profile.targetRole}
            </Typography>
          </Box>
        )}

        {/* Skills */}
        <Box sx={{ mb: 2 }}>
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
            Key Skills ({profile.skills.length})
          </Typography>
          <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap>
            {profile.skills.slice(0, 5).map((skill, index) => (
              <Chip key={index} label={skill} size='small' sx={{ mb: 0.5 }} />
            ))}
            {profile.skills.length > 5 && (
              <Chip label={`+${profile.skills.length - 5}`} size='small' sx={{ mb: 0.5 }} />
            )}
          </Stack>
        </Box>

        {/* Dates */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <AccessTimeIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
            <Typography variant='caption' color='text.secondary'>
              Uploaded: {new Date(profile.uploadedDate).toLocaleDateString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
            <Typography variant='caption' color='text.secondary'>
              Modified: {new Date(profile.lastModified).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ px: 2, py: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          size='small'
          variant={profile.isActive ? 'contained' : 'outlined'}
          onClick={handleSetActive}
          disabled={profile.isActive}
          sx={{ flexGrow: 1 }}
        >
          {profile.isActive ? 'Active' : 'Set Active'}
        </Button>
        <IconButton size='small' onClick={handleSetDefault} disabled={profile.isDefault}>
          {profile.isDefault ? <StarIcon color='warning' /> : <StarBorderIcon />}
        </IconButton>
      </CardActions>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDownload}>
          <DownloadIcon sx={{ mr: 1, fontSize: 20 }} />
          Download
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: theme.palette.error.main }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>
    </Card>
  )
}

export default ProfileCard
