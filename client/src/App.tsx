import React from 'react'
import { 
  Routes,
  Route
} from 'react-router-dom'
import { Backdrop, CircularProgress } from '@mui/material'
import GuestRoute from 'src/middlewares/GuestRoute'
// import AuthRoute from 'src/middlewares/AuthRoute'
// import AdminRoute from 'src/middlewares/AdminRoute'



// Admin Module (only loaded for admin users)
// const AdminRoutes = React.lazy(() => import('src/Modules/Admin/routes/routes'))
// const UserManagementRoutes = React.lazy(() => import('src/Modules/UserManagement/routes/routes'))

const HomeRoutes = React.lazy(() => import('src/Modules/Home/routes/routes'))


// const ApplicationTrackerRoutes = React.lazy(() => import('src/Modules/ApplicationTracker/routes/routes'))

const AuthenticationRoutes = React.lazy(() => import('src/Modules/Auth/routes/routes'))
// const AutomationRoutes = React.lazy(() => import('src/Modules/Automation/routes/routes'))


// const CommonRoutes = React.lazy(() => import('src/Modules/Common/routes/routes'))
// const JobsRoutes = React.lazy(() => import('src/Modules/Jobs/routes/routes'))


// Protected Modules (only loaded for authenticated users)
// const CompaniesRoutes = React.lazy(() => import('src/Modules/Companies/routes/routes'))
// const DashboardRoutes = React.lazy(() => import('src/Modules/Dashboard/routes/routes'))
// const JobAnalysisRoutes = React.lazy(() => import('src/Modules/JobAnalysis/routes/routes'))
// const NotificationsRoutes = React.lazy(() => import('src/Modules/Notifications/routes/routes'))
// const ProfileManagementRoutes = React.lazy(() => import('src/Modules/ProfileManagement/routes/routes'))
// const ScraperRoutes = React.lazy(() => import('src/Modules/Scraper/routes/routes'))
// const StatisticsRoutes = React.lazy(() => import('src/Modules/Statistics/routes/routes'))

// const ProfileAnalyzerRoutes = React.lazy(() => import('src/Modules/ProfileAnalyzer/routes/routes'))



// Error & Utility Modules
// const ERR0RRoutes = React.lazy(() => import('src/Modules/ERR0R/routes/routes'))
const Home = React.lazy(() => import('src/Modules/Home/screens/Home'))
// const NotFound = React.lazy(() => import('src/Modules/ERR0R/screens/NotFound'))

const LoadingBackdrop: React.FC = () => (
  <Backdrop open style={{ background: '#FFF', zIndex: 1301 }}>
    <CircularProgress color='inherit' />
  </Backdrop>
)

/**
 * SuspenseWrapper Component
 * Wraps lazy-loaded components with Suspense fallback
 * @param children - Child components to be rendered
 */
const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({
  children
}) => (
  <React.Suspense fallback={<LoadingBackdrop />}>
    {children}
  </React.Suspense>
)

const App: React.FC = (): React.ReactElement => {
  return (
    <Routes>
      <Route
        path='/'
        element={<SuspenseWrapper><Home /></SuspenseWrapper>}
      />
      <Route path='public/*' element={
        <GuestRoute element={
          <SuspenseWrapper>
            <HomeRoutes />
          </SuspenseWrapper>
        } />
      } />

      {/* Common routes - feature comparison, etc. */}
      {/* <Route path='/*' element={
        <SuspenseWrapper>
          <CommonRoutes />
        </SuspenseWrapper>
      } /> */}
      
      <Route path='auth/*' element={
        <GuestRoute element={
          <SuspenseWrapper>
            <AuthenticationRoutes />
          </SuspenseWrapper>
        } />
      } />

      {/* <Route path='application-tracker/*' element={
        <AuthRoute element={
          <SuspenseWrapper>
            <ApplicationTrackerRoutes />
          </SuspenseWrapper>
        } />
      } /> */}
      
      {/* Job search - accessible to all but with different features based on auth status */}
      {/* <Route path='jobs/*' element={
        <SuspenseWrapper>
          <JobsRoutes />
        </SuspenseWrapper>
      } /> */}

      {/* Protected routes - require authentication */}
      {/* <Route path='automation/*' element={
        <AuthRoute element={
          <SuspenseWrapper>
            <AutomationRoutes />
          </SuspenseWrapper>
        } />
      } /> */}
      {/* <Route path='companies/*' element={
        <AuthRoute element={
          <SuspenseWrapper>
            <CompaniesRoutes />
          </SuspenseWrapper>
        } />
      } /> */}

      {/* <Route path='dashboard/*' element={
        <AuthRoute element={
          <SuspenseWrapper>
            <DashboardRoutes />
          </SuspenseWrapper>
        } />
      } /> */}
      
      {/* <Route path='job-analysis/*' element={
        <AuthRoute element={
          <SuspenseWrapper>
            <JobAnalysisRoutes />
          </SuspenseWrapper>
        } />
      } /> */}

      {/* <Route path='notification/*' element={
        <AuthRoute element={
          <SuspenseWrapper>
            <NotificationsRoutes />
          </SuspenseWrapper>
        } />
      } /> */}

      {/* <Route path='profile-management/*' element={
        <AuthRoute element={
          <SuspenseWrapper>
            <ProfileManagementRoutes />
          </SuspenseWrapper>
        } />
      } /> */}

      {/* <Route path='scraper/*' element={
        <AuthRoute element={
          <SuspenseWrapper>
            <ScraperRoutes />
          </SuspenseWrapper>
        } />
      } />   */}
      
      {/* <Route path='statistics/*' element={
        <AuthRoute element={
          <SuspenseWrapper>
            <StatisticsRoutes />
          </SuspenseWrapper>
        } />
      } /> */}

      {/* Profile analyzer - accessible to all but with limitations for guests */}
      {/* <Route path='profile-analyzer/*' element={
        <GuestRoute element={
          <SuspenseWrapper>
            <ProfileAnalyzerRoutes />
          </SuspenseWrapper>
        } />
      } /> */}
            
      {/* <Route path='user-management/*' element={
        <AuthRoute element={
          <SuspenseWrapper>
            <UserManagementRoutes />
          </SuspenseWrapper>
        } />
      } /> */}

      {/* Admin routes - require admin role */}
      {/* <Route path='admin/*' element={
        <AdminRoute element={
          <SuspenseWrapper>
            <AdminRoutes />
          </SuspenseWrapper>
        } />
      } /> */}
      
      {/* <Route path='error/*' element={
        <SuspenseWrapper>
          <ERR0RRoutes />
        </SuspenseWrapper>
      } /> */}

      {/* <Route
        path='*'
        element={
          <SuspenseWrapper>
            <NotFound />
          </SuspenseWrapper>
        }
      /> */}
    </Routes>
  )
}

export default App
