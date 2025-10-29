import React from 'react'
import themeConfig from 'src/configs/themeConfig'
import { TextField, Typography, Radio, Button } from '@mui/material'
import DirectionalIcon from 'src/components/DirectionalIcon'
import CustomAvatar from 'src/core/components/mui/Avatar'

type Props = {
  activeStep: number
  isLastStep: boolean
  handleNext: () => void
  handlePrev: () => void
}

const DataBase = ({
  activeStep,
  isLastStep,
  handleNext,
  handlePrev,
}: Props) => {
  const [value, setValue] = React.useState<string>('firebase')

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value)
  }

  return (
    <div className='flex flex-col gap-6'>
      <TextField
        fullWidth
        label='Database Name'
        placeholder={`${themeConfig.templateName
          .toLowerCase()
          .replace(/\s+/g, '_')}_database`}
      />
      <div className='flex flex-col gap-4'>
        <Typography variant='h5'>Select Database Engine</Typography>
        <div
          onClick={() => setValue('firebase')}
          className='flex items-center justify-between cursor-pointer gap-4'
        >
          <div className='flex items-center gap-3'>
            <CustomAvatar
              skin='light'
              color='warning'
              variant='rounded'
              size={46}
            >
              <img
                src='/images/logos/firebase.png'
                alt='firebase'
                height={30}
                width={30}
              />
            </CustomAvatar>
            <div className='flex flex-col gap-1'>
              <Typography color='text.primary' className='font-medium'>
                Firebase
              </Typography>
              <Typography variant='body2'>Cloud Firestore</Typography>
            </div>
          </div>
          <Radio
            value='firebase'
            onChange={handleChange}
            checked={value === 'firebase'}
          />
        </div>
        <div
          onClick={() => setValue('aws')}
          className='flex items-center justify-between cursor-pointer gap-4'
        >
          <div className='flex items-center gap-3'>
            <CustomAvatar
              skin='light'
              color='secondary'
              variant='rounded'
              size={46}
            >
              <img
                src='/images/logos/aws.png'
                alt='aws'
                height={30}
                width={30}
              />
            </CustomAvatar>
            <div className='flex flex-col gap-1'>
              <Typography color='text.primary' className='font-medium'>
                AWS
              </Typography>
              <Typography variant='body2'>
                Amazon Fast NoSQL Database
              </Typography>
            </div>
          </div>
          <Radio
            value='aws'
            onChange={handleChange}
            checked={value === 'aws'}
          />
        </div>
        <div
          onClick={() => setValue('sql')}
          className='flex items-center justify-between cursor-pointer gap-4'
        >
          <div className='flex items-center gap-3'>
            <CustomAvatar skin='light' color='info' variant='rounded' size={46}>
              <i className='tabler-database text-3xl' />
            </CustomAvatar>
            <div className='flex flex-col gap-1'>
              <Typography color='text.primary' className='font-medium'>
                MySQL
              </Typography>
              <Typography variant='body2'>Basic MySQL database</Typography>
            </div>
          </div>
          <Radio
            value='sql'
            onChange={handleChange}
            checked={value === 'sql'}
          />
        </div>
      </div>
      <div className='flex items-center justify-between'>
        <Button
          variant='contained'
          color='secondary'
          disabled={activeStep === 0}
          onClick={handlePrev}
          startIcon={
            <DirectionalIcon
              ltrIconClass='tabler-arrow-left'
              rtlIconClass='tabler-arrow-right'
            />
          }
        >
          Previous
        </Button>
        <Button
          variant='contained'
          color={isLastStep ? 'success' : 'primary'}
          onClick={handleNext}
          endIcon={
            isLastStep ? (
              <i className='tabler-check' />
            ) : (
              <DirectionalIcon
                ltrIconClass='tabler-arrow-right'
                rtlIconClass='tabler-arrow-left'
              />
            )
          }
        >
          {isLastStep ? 'Submit' : 'Next'}
        </Button>
      </div>
    </div>
  )
}

export default DataBase
