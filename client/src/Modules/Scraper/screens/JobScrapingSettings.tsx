import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Switch,
  TextField,
  Button,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Divider,
  Toolbar,
  Grid,
  AppBar
} from '@mui/material';
import {
  Public,
  FilterAlt,
  CalendarToday,
  Settings,
  Logout,
  Work
} from '@mui/icons-material';

const drawerWidth = 240;

const JobScrapingSettings = () => {
  const [keywords, setKeywords] = React.useState(['React Developer', 'Product Manager']);
  const [locations, setLocations] = React.useState(['Remote']);
  const [newKeyword, setNewKeyword] = React.useState('');
  const [newLocation, setNewLocation] = React.useState('');

  const handleAddKeyword = () => {
    if (newKeyword && !keywords.includes(newKeyword)) {
      setKeywords([...keywords, newKeyword]);
      setNewKeyword('');
    }
  };

  const handleDeleteKeyword = (keywordToDelete: string) => {
    setKeywords((chips) => chips.filter((chip) => chip !== keywordToDelete));
  };

  const handleAddLocation = () => {
    if (newLocation && !locations.includes(newLocation)) {
      setLocations([...locations, newLocation]);
      setNewLocation('');
    }
  };

  const handleDeleteLocation = (locationToDelete: string) => {
    setLocations((chips) => chips.filter((chip) => chip !== locationToDelete));
  };


  const drawer = (
    <div>
      <Toolbar>
        <Work sx={{ mr: 2 }} />
        <Typography variant="h6" noWrap component="div">
          Job Scraper
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {['Scraping Sources', 'Keywords & Filters', 'Schedule'].map((text, index) => (
          <ListItem key={text} disablePadding>
            <ListItemButton>
              <ListItemIcon>
                {index === 0 && <Public />}
                {index === 1 && <FilterAlt />}
                {index === 2 && <CalendarToday />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        {['Settings', 'Log Out'].map((text, index) => (
          <ListItem key={text} disablePadding>
            <ListItemButton>
              <ListItemIcon>
                {index === 0 ? <Settings /> : <Logout />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        <Typography variant="h4" gutterBottom>
            Job Scraping Settings
        </Typography>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Manage Job Sources
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Enable or disable the platforms you want to scrape for jobs.
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="LinkedIn" />
              <Switch defaultChecked />
            </ListItem>
            <ListItem>
              <ListItemText primary="Indeed" />
              <Switch defaultChecked />
            </ListItem>
            <ListItem>
              <ListItemText primary="Glassdoor" />
              <Switch />
            </ListItem>
            <ListItem>
              <ListItemText primary="ZipRecruiter" />
              <Switch />
            </ListItem>
          </List>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Keywords and Filters
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Specify keywords, locations, and other criteria to refine your job search.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <TextField
                label="Keywords"
                placeholder="e.g., UI/UX Designer"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
              />
            </FormControl>
            <Button onClick={handleAddKeyword} variant="outlined" sx={{ mt: 1 }}>Add</Button>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {keywords.map((data) => (
                <Chip
                  key={data}
                  label={data}
                  onDelete={() => handleDeleteKeyword(data)}
                />
              ))}
            </Box>
          </Box>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <TextField
                label="Locations to Include"
                placeholder="e.g., Remote, New York"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
              />
            </FormControl>
            <Button onClick={handleAddLocation} variant="outlined" sx={{ mt: 1 }}>Add</Button>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {locations.map((data) => (
                <Chip
                  key={data}
                  label={data}
                  onDelete={() => handleDeleteLocation(data)}
                />
              ))}
            </Box>
          </Box>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select label="Job Type" defaultValue="Any">
                  <MenuItem value="Any">Any</MenuItem>
                  <MenuItem value="Full-time">Full-time</MenuItem>
                  <MenuItem value="Part-time">Part-time</MenuItem>
                  <MenuItem value="Contract">Contract</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Experience Level</InputLabel>
                <Select label="Experience Level" defaultValue="Any">
                  <MenuItem value="Any">Any</MenuItem>
                  <MenuItem value="Internship">Internship</MenuItem>
                  <MenuItem value="Entry Level">Entry Level</MenuItem>
                  <MenuItem value="Mid-Level">Mid-Level</MenuItem>
                  <MenuItem value="Senior Level">Senior Level</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button variant="outlined" sx={{ mr: 1 }}>
            Reset to Defaults
          </Button>
          <Button variant="contained">
            Save Changes
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default JobScrapingSettings;
