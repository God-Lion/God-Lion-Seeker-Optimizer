import React from 'react'
import { useTheme } from '@mui/material/styles'
import classnames from 'classnames'
import PlanDetails from './PlanDetails'
import DirectionalIcon from 'src/components/DirectionalIcon'
import { Typography, InputLabel, Switch, Chip, Grid } from '@mui/material'
import { PricingPlanType } from 'src/fake-db/types/pages/pricingTypes'

const Pricing = ({ data }: { data: PricingPlanType[] }) => {
  const [pricingPlan, setPricingPlan] = React.useState<'monthly' | 'annually'>(
    'annually',
  )

  const theme = useTheme()

  const handleChange = (e: React.ChangeEvent<{ checked: boolean }>) => {
    if (e.target.checked) {
      setPricingPlan('annually')
    } else {
      setPricingPlan('monthly')
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col justify-center items-center gap-2'>
        <Typography variant='h3'>Pricing Plans</Typography>
        <div className='flex items-center text-center flex-col  sm:mbe-[3.8rem]'>
          <Typography>
            All plans include 40+ advanced tools and features to boost your
            product. Choose the best plan to fit your needs.
          </Typography>
        </div>
        <div className='flex justify-center items-center relative mbs-0.5'>
          <InputLabel htmlFor='pricing-switch' className='cursor-pointer'>
            Monthly
          </InputLabel>
          <Switch
            id='pricing-switch'
            onChange={handleChange}
            checked={pricingPlan === 'annually'}
          />
          <InputLabel htmlFor='pricing-switch' className='cursor-pointer'>
            Annually
          </InputLabel>

          <div
            className={classnames(
              'flex absolute max-sm:hidden block-start-[-39px] translate-x-[35%]',
              {
                'right-full': theme.direction === 'rtl',
                'left-1/2': theme.direction !== 'rtl',
              },
            )}
          >
            <DirectionalIcon
              ltrIconClass='tabler-corner-left-down'
              rtlIconClass='tabler-corner-right-down'
              className='mbs-2 mie-1 text-textDisabled'
            />
            <Chip
              label='Save up to 10%'
              size='small'
              variant='outlined'
              color='primary'
            />
          </div>
        </div>
      </div>
      <Grid container spacing={6}>
        {data?.map((plan, index) => (
          <Grid item xs={12} md={4} key={index}>
            <PlanDetails data={plan} pricingPlan={pricingPlan} />
          </Grid>
        ))}
      </Grid>
    </div>
  )
}

export default Pricing
