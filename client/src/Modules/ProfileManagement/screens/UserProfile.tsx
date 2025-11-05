import React from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  CssBaseline,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  Edit,
  Notifications,
  Settings,
} from "@mui/icons-material";

const UserProfile = () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <CssBaseline />
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
      >
        <Toolbar>
          <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
            Lion & Magnifying Glass
          </Typography>
          <IconButton color="inherit">
            <Notifications />
          </IconButton>
          <IconButton color="inherit">
            <Settings />
          </IconButton>
          <Avatar
            alt="Alexandra Chen"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBf61lXD5qQhgO7uIJ5d9jxlqvWuAn0qkCFrp-p8GyW8yRY_mU1ar5SafgG5FbC7-pf79QTn-_fQ53ambd1NOkfy0gMfEtwcaKzv8BGjuHQu9FWYOxpxBdgAtPrnGymTEp6xrHP8ZF8bxcIb1T-akCAcV6cT1qFB2ui5I-VZLpHWKBjnARypp0TEFGV03-mK2vd5OX8Sp65r61taQ5AjQSWfRPt-T84nN9WscTUfUIybLEd7FtJJuV02WWV-R1vfhMrITOw9ydKFjM"
          />
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ py: { xs: 3, md: 6 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Profile
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          View and edit your profile details and job preferences.
        </Typography>
        <Paper elevation={0} sx={{ p: 2, my: 3, border: "1px solid #E0E0E0" }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar
                alt="Alexandra Chen"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAL-D4Ji-B53ZU9TerPehRs23mF7FZx6QTwlGTQ_hTubhu9qu-Ln_uhFgjjOm5DWWAUMd2m2hmIkgEfTe2c9njezycoQWb8TtHCQs4jAelFDvRuLt69FZDbm3kdSC0tDvFMcCVWJ4_dgCNPPne_xsIvDl63rBEbAJ52bpPoit44J0g2whyzbAznhtBk-UhJadA7DUTkgvwe8XMb5L4hfTZsJjbdVXGForZxQC2JdgbInv2LDieYQs6t6Vv4HJMWdDI0_nwAdpCYesg"
                sx={{ width: 96, height: 96 }}
              />
            </Grid>
            <Grid item xs>
              <Typography variant="h5">Alexandra Chen</Typography>
              <Typography variant="body1" color="text.secondary">
                Senior Product Designer at Innovate Inc.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                San Francisco, CA | Open to relocation
              </Typography>
            </Grid>
            <Grid item>
              <Button variant="outlined">Edit Profile</Button>
            </Grid>
          </Grid>
        </Paper>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={0}>
            <Tab label="Personal Details" />
            <Tab label="Summary & Skills" />
            <Tab label="Job Preferences" />
            <Tab label="Experience & Education" />
            <Tab label="Document Management" />
          </Tabs>
        </Box>
        <Paper elevation={0} sx={{ mt: 3, border: "1px solid #E0E0E0" }}>
          <Box
            sx={{
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #E0E0E0",
            }}
          >
            <Typography variant="h6">Personal Information</Typography>
            <Button variant="outlined" startIcon={<Edit />}>
              Edit
            </Button>
          </Box>
          <Grid container spacing={2} sx={{ p: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Email
              </Typography>
              <Typography>a.chen@email.com</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Phone
              </Typography>
              <Typography>(555) 123-4567</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                LinkedIn
              </Typography>
              <Typography>linkedin.com/in/alexandrachen</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Portfolio Website
              </Typography>
              <Typography>alexandrachen.design</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Address
              </Typography>
              <Typography>
                123 Design Lane, San Francisco, CA 94103
              </Typography>
            </Grid>
          </Grid>
        </Paper>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button variant="outlined" sx={{ mr: 2 }}>
            Cancel
          </Button>
          <Button variant="contained">Save Changes</Button>
        </Box>
      </Container>
    </Box>
  );
};

export default UserProfile;