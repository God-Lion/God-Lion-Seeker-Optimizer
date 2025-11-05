import React from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Search,
  FileUpload,
  StarBorder,
  Download,
  Edit,
  Delete,
  Description,
} from '@mui/icons-material';

const cvs = [
  {
    title: 'CV for Software Engineer Roles',
    uploaded: 'Oct 26, 2023',
    format: 'PDF',
    size: '2.1 MB',
    default: true,
  },
  {
    title: 'Resume for Startup Roles',
    uploaded: 'Sep 15, 2023',
    format: 'DOCX',
    size: '1.8 MB',
    default: false,
  },
  {
    title: 'General Tech CV (v2)',
    uploaded: 'Aug 02, 2023',
    format: 'PDF',
    size: '2.5 MB',
    default: false,
  },
];

const MyCVs: React.FC = () => {
  return (
    <Container maxWidth='lg'>
      <Box sx={{ my: 4 }}>
        <Typography variant='h4' component='h1' gutterBottom sx={{ fontWeight: 'bold' }}>
          My CVs
        </Typography>
        <Typography variant='subtitle1' color='text.secondary'>
          Upload and manage different versions of your CV to tailor them for each job application.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <TextField
          variant='outlined'
          placeholder='Search CVs by title'
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ width: '40%' }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControl variant='outlined' sx={{ minWidth: 200, mr: 2 }}>
            <InputLabel>Sort by</InputLabel>
            <Select label='Sort by' defaultValue='date-uploaded'>
              <MenuItem value='date-uploaded'>Date Uploaded</MenuItem>
              <MenuItem value='title'>Title</MenuItem>
            </Select>
          </FormControl>
          <Button variant='contained' startIcon={<FileUpload />}>
            Upload New CV
          </Button>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {cvs.map((cv, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant='h6' component='h2' sx={{ fontWeight: 'bold' }}>
                    {cv.title}
                  </Typography>
                  <IconButton size='small'>
                    <StarBorder />
                  </IconButton>
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  Uploaded: {cv.uploaded} | {cv.format} | {cv.size}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    my: 4,
                    color: 'text.secondary',
                  }}
                >
                  <Description sx={{ fontSize: 60 }} />
                  <Typography>Document Preview</Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant='caption' color='primary'>
                  {cv.default ? 'Default CV' : ''}
                </Typography>
                <Box>
                  <IconButton size='small'>
                    <Download />
                  </IconButton>
                  <IconButton size='small'>
                    <Edit />
                  </IconButton>
                  <IconButton size='small'>
                    <Delete />
                  </IconButton>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default MyCVs;
