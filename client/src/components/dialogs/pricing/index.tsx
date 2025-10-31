import { Dialog, DialogContent } from '@mui/material'
import DialogCloseButton from '../DialogCloseButton'
import { PricingPlanType } from 'src/Views/DashBoard/Admin/provider/view/type'
import Pricing from 'src/components/pricing'

type PricingProps = {
  open: boolean
  setOpen: (open: boolean) => void
  data: PricingPlanType[]
}

const PricingDialog = ({ open, setOpen, data }: PricingProps) => {
  return (
    <Dialog
      fullWidth
      maxWidth='lg'
      open={open}
      onClose={() => setOpen(false)}
      scroll='body'
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogContent className='sm:p-16'>
        <Pricing data={data} />
      </DialogContent>
    </Dialog>
  )
}

export default PricingDialog
