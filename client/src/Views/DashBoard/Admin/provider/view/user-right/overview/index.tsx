import Box from '@mui/material/Box'
import ProjectListTable from './ProjectListTable'
import UserActivityTimeLine from './UserActivityTimeline'

const OverViewTab = () => {
  // Vars
  // const invoiceData = await getData()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <ProjectListTable />
      </Box>
      <Box>
        <UserActivityTimeLine />
      </Box>
      <Box>
        {/* <InvoiceListTable invoiceData={invoiceData} /> */}
      </Box>
    </Box>
  )
}

export default OverViewTab
