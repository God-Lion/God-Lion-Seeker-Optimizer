// App React ApexCharts Styles
import { styled } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

const AppReactApexCharts = styled('div')(({ theme }: { theme: Theme }) => ({
  '& .apexcharts-canvas': {
    // Add any custom ApexCharts styling here
  }
}))

export default AppReactApexCharts
