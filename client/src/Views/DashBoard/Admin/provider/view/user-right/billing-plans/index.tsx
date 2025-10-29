import Box from '@mui/material/Box'
import CurrentPlan from './CurrentPlan'
import PaymentMethod from './PaymentMethod'
import BillingAddress from './BillingAddress'
import { PricingPlanType } from 'src/fake-db/types/pages/pricingTypes'

const BillingPlans = ({ data }: { data: PricingPlanType[] }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <CurrentPlan data={data} />
      </Box>
      <Box>
        <PaymentMethod />
      </Box>
      <Box>
        <BillingAddress />
      </Box>
    </Box>
  )
}

export default BillingPlans
