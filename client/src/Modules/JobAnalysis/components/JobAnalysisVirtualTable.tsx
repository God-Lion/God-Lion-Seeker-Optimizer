import React from 'react'
import VirtualizedTable from 'src/components/virtualized/VirtualizedTable'
import { ColumnDef } from '@tanstack/react-table'
import {
  Box,
  Chip,
  LinearProgress,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import DeleteIcon from '@mui/icons-material/Delete'

interface JobAnalysis {
  skills_match: number
  experience_match: number
  education_match: number
}

interface RecommendedJob {
  id: number
  title: string
  company_name: string
  location: string
  match_score: number
  analysis: JobAnalysis
}

interface JobAnalysisVirtualTableProps {
  jobs: RecommendedJob[]
  loading?: boolean
  onDeleteAnalysis: (jobId: number) => void
}

const getMatchScoreColor = (score: number): 'success' | 'warning' | 'error' => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'error'
}

const getMatchScoreLabel = (score: number): string => {
  if (score >= 80) return 'Excellent Match'
  if (score >= 60) return 'Good Match'
  if (score >= 40) return 'Fair Match'
  return 'Poor Match'
}

export const JobAnalysisVirtualTable: React.FC<JobAnalysisVirtualTableProps> = ({
  jobs,
  loading = false,
  onDeleteAnalysis,
}) => {
  const theme = useTheme()

  const columns: ColumnDef<RecommendedJob>[] = [
    {
      accessorKey: 'title',
      header: 'Job Title',
      cell: ({ row }) => (
        <Typography sx={{ fontWeight: 'bold' }}>{row.original.title}</Typography>
      ),
    },
    {
      accessorKey: 'company_name',
      header: 'Company',
    },
    {
      accessorKey: 'location',
      header: 'Location',
    },
    {
      accessorKey: 'match_score',
      header: 'Match Score',
      cell: ({ row }) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant='determinate'
              value={row.original.match_score}
              sx={{
                width: 60,
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.palette.grey[300],
                '& .MuiLinearProgress-bar': {
                  backgroundColor:
                    theme.palette[getMatchScoreColor(row.original.match_score)].main,
                },
              }}
            />
            <Typography variant='body2' sx={{ fontWeight: 'bold', minWidth: 35 }}>
              {row.original.match_score}%
            </Typography>
          </Box>
          <Typography variant='caption' sx={{ color: theme.palette.text.secondary }}>
            {getMatchScoreLabel(row.original.match_score)}
          </Typography>
        </Box>
      ),
    },
    {
      accessorKey: 'analysis.skills_match',
      header: 'Skills',
      cell: ({ row }) => (
        <Chip
          label={`${row.original.analysis.skills_match}%`}
          size='small'
          color={
            row.original.analysis.skills_match >= 70
              ? 'success'
              : row.original.analysis.skills_match >= 50
              ? 'warning'
              : 'error'
          }
        />
      ),
    },
    {
      accessorKey: 'analysis.experience_match',
      header: 'Experience',
      cell: ({ row }) => (
        <Chip
          label={`${row.original.analysis.experience_match}%`}
          size='small'
          color={
            row.original.analysis.experience_match >= 70
              ? 'success'
              : row.original.analysis.experience_match >= 50
              ? 'warning'
              : 'error'
          }
        />
      ),
    },
    {
      accessorKey: 'analysis.education_match',
      header: 'Education',
      cell: ({ row }) => (
        <Chip
          label={`${row.original.analysis.education_match}%`}
          size='small'
          color={
            row.original.analysis.education_match >= 70
              ? 'success'
              : row.original.analysis.education_match >= 50
              ? 'warning'
              : 'error'
          }
        />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Tooltip title='Delete Analysis'>
          <IconButton
            size='small'
            color='error'
            onClick={() => onDeleteAnalysis(row.original.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ]

  return (
    <VirtualizedTable
      data={jobs}
      columns={columns}
      loading={loading}
      enableVirtualization={jobs.length > 50}
      estimatedRowHeight={80}
      enableSearch={true}
    />
  )
}

export default JobAnalysisVirtualTable
