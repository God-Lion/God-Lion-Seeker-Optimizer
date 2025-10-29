/**
 * Example: Integration Examples for New State Management
 * 
 * This file shows how to integrate the new Zustand store
 * with existing modules.
 */

import React, { useEffect, useState } from 'react'
import { useJobs, useAuth, useGuest, useProfile, useNotifications } from 'src/store'
import { Box, Button, Alert, Badge } from '@mui/material'

/**
 * Example 1: Job Search with State Persistence
 */
export const JobSearchExample: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const { isGuest } = useGuest()
  const { 
    jobs, 
    searchFilters, 
    setSearchFilters, 
    resetSearchFilters,
    saveJob,
    isSaved 
  } = useJobs()

  const [loading, setLoading] = useState(false)

  const handleSearch = async (newFilters: any) => {
    setLoading(true)
    setSearchFilters(newFilters)
    
    try {
      // Your existing API call
      // const results = await fetchJobs(newFilters)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveJob = (job: any) => {
    if (isGuest) {
      alert('Please sign up to save jobs')
      return
    }
    saveJob(job)
  }

  return (
    <Box>
      {isGuest && (
        <Alert severity="info">
          Sign up to save jobs and access more features!
        </Alert>
      )}

      <div>
        {jobs.map(job => (
          <div key={job.id}>
            <h3>{job.title}</h3>
            <Button 
              onClick={() => handleSaveJob(job)}
              variant={isSaved(job.id) ? 'contained' : 'outlined'}
            >
              {isSaved(job.id) ? 'Saved' : 'Save'}
            </Button>
          </div>
        ))}
      </div>
    </Box>
  )
}

/**
 * Example 2: Profile Analyzer with Guest Session
 */
export const ProfileAnalyzerExample: React.FC = () => {
  const { isGuest, addGuestData, getGuestData } = useGuest()
  const { addProfile, activeProfile } = useProfile()
  const { addNotification } = useNotifications()

  const handleAnalyze = async (resumeFile: File) => {
    try {
      // Analyze resume
      const analysis = await analyzeResume(resumeFile)
      
      if (isGuest) {
        // Save to session storage for guests
        addGuestData('profileAnalysis', analysis)
        addGuestData('resumeData', resumeFile.name)
        
        addNotification({
          type: 'info',
          title: 'Analysis Complete',
          message: 'Sign up to save your analysis permanently'
        })
      } else {
        // Save to database for authenticated users
        addProfile({
          id: `profile_${Date.now()}`,
          name: resumeFile.name,
          fileName: resumeFile.name,
          uploadedAt: new Date().toISOString(),
          isActive: true,
          summary: analysis
        })
        
        addNotification({
          type: 'success',
          title: 'Profile Saved',
          message: 'Your profile has been analyzed and saved'
        })
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Analysis Failed',
        message: 'Failed to analyze your resume'
      })
    }
  }

  // Retrieve previous analysis for guests
  const previousAnalysis = getGuestData('profileAnalysis')

  return (
    <Box>
      {isGuest && previousAnalysis && (
        <Alert severity="warning">
          You have unsaved analysis. Sign up to keep your data!
        </Alert>
      )}
      
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => e.target.files && handleAnalyze(e.target.files[0])}
      />
    </Box>
  )
}

/**
 * Example 3: Authentication Flow
 */
export const AuthExample: React.FC = () => {
  const { user, isAuthenticated, signIn, signOut, isLoading, error } = useAuth()
  const [credentials, setCredentials] = useState({ email: '', password: '' })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signIn(credentials)
      // User is now authenticated, state is persisted
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  const handleLogout = async () => {
    await signOut(() => {
      // Redirect to home page
      window.location.href = '/'
    })
  }

  if (isAuthenticated) {
    return (
      <Box>
        <p>Welcome, {user?.name}!</p>
        <Button onClick={handleLogout}>Sign Out</Button>
      </Box>
    )
  }

  return (
    <form onSubmit={handleLogin}>
      {error && <Alert severity="error">{error}</Alert>}
      
      <input
        type="email"
        value={credentials.email}
        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
        placeholder="Email"
      />
      <input
        type="password"
        value={credentials.password}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        placeholder="Password"
      />
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  )
}

/**
 * Example 4: Notification System
 */
export const NotificationExample: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    addNotification 
  } = useNotifications()

  const showTestNotification = () => {
    addNotification({
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification'
    })
  }

  return (
    <Box>
      <Button onClick={showTestNotification}>
        Show Test Notification
      </Button>

      <Badge badgeContent={unreadCount} color="error">
        <span>Notifications</span>
      </Badge>

      {unreadCount > 0 && (
        <Button onClick={markAllAsRead}>Mark All as Read</Button>
      )}

      <div>
        {notifications.map(notif => (
          <div 
            key={notif.id}
            style={{ 
              opacity: notif.read ? 0.5 : 1,
              cursor: 'pointer' 
            }}
            onClick={() => markAsRead(notif.id)}
          >
            <h4>{notif.title}</h4>
            <p>{notif.message}</p>
            <small>{new Date(notif.timestamp).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </Box>
  )
}

/**
 * Example 5: Application Tracking
 */
export const ApplicationTrackingExample: React.FC = () => {
  const { applications, addApplication, updateApplication } = useJobs()
  const { addNotification } = useNotifications()

  const handleApply = async (jobId: string, jobTitle: string) => {
    const application = {
      id: `app_${Date.now()}`,
      jobId,
      status: 'applied' as const,
      appliedDate: new Date().toISOString(),
      notes: '',
    }

    addApplication(application)
    
    addNotification({
      type: 'success',
      title: 'Application Submitted',
      message: `Applied to ${jobTitle}`
    })

    // Your existing API call
    // await submitApplication(application)
  }

  const handleUpdateStatus = (appId: string, status: string) => {
    updateApplication(appId, { status: status as any })
    
    addNotification({
      type: 'info',
      title: 'Status Updated',
      message: `Application status changed to ${status}`
    })
  }

  return (
    <Box>
      <h2>My Applications ({applications.length})</h2>
      {applications.map(app => (
        <div key={app.id}>
          <p>Status: {app.status}</p>
          <p>Applied: {new Date(app.appliedDate).toLocaleDateString()}</p>
          <select 
            value={app.status}
            onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
          >
            <option value="applied">Applied</option>
            <option value="interviewing">Interviewing</option>
            <option value="offered">Offered</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      ))}
    </Box>
  )
}

/**
 * Example 6: Multi-Profile Management
 */
export const ProfileManagementExample: React.FC = () => {
  const { profiles, activeProfile, addProfile, setActiveProfile, deleteProfile } = useProfile()
  const { addNotification } = useNotifications()

  const handleAddProfile = async (file: File) => {
    try {
      const profile = {
        id: `profile_${Date.now()}`,
        name: file.name.replace(/\.(pdf|docx?)$/i, ''),
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        isActive: profiles.length === 0, // First profile is active
        summary: {
          skills: [],
          experience: '',
          education: ''
        }
      }

      addProfile(profile)
      
      addNotification({
        type: 'success',
        title: 'Profile Added',
        message: `${profile.name} has been added`
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload profile'
      })
    }
  }

  const handleSetActive = (profileId: string) => {
    setActiveProfile(profileId)
    addNotification({
      type: 'info',
      title: 'Active Profile Changed',
      message: 'Your active profile has been updated'
    })
  }

  return (
    <Box>
      <h2>Resume Profiles</h2>
      
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => e.target.files && handleAddProfile(e.target.files[0])}
      />

      <div>
        {profiles.map(profile => (
          <div 
            key={profile.id}
            style={{
              border: profile.isActive ? '2px solid blue' : '1px solid gray',
              padding: '10px',
              margin: '10px 0'
            }}
          >
            <h3>{profile.name}</h3>
            <p>Uploaded: {new Date(profile.uploadedAt).toLocaleDateString()}</p>
            
            {!profile.isActive && (
              <Button onClick={() => handleSetActive(profile.id)}>
                Set as Active
              </Button>
            )}
            
            {profile.isActive && <Badge color="primary">Active</Badge>}
            
            <Button 
              onClick={() => deleteProfile(profile.id)}
              color="error"
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
    </Box>
  )
}

// Mock function for examples
const analyzeResume = async (file: File) => {
  // Simulate API call
  return {
    skills: ['JavaScript', 'React', 'Node.js'],
    experience: '5 years',
    education: 'Bachelor of Science'
  }
}
