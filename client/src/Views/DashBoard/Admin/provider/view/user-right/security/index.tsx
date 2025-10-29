// MUI Imports
import Box from '@mui/material/Box'

// Component Imports
import ChangePassword from './ChangePassword'
import TwoStepVerification from './TwoStepVerification'
import RecentDevice from './RecentDevice'

const SecurityTab = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <ChangePassword />
      </Box>
      <Box>
        <TwoStepVerification />
      </Box>
      <Box>
        <RecentDevice />
      </Box>
    </Box>
  )
}

export default SecurityTab
