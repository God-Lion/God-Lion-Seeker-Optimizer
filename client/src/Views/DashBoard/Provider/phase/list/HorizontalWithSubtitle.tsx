import { Box, Card, CardContent, Typography } from '@mui/material'
import type { UserDataType } from './type'
import CustomAvatar from 'src/core/components/mui/Avatar'

const HorizontalWithSubtitle = ({
  title,
  value,
  avatarIcon,
  avatarColor,
  change,
  changeNumber,
  subTitle,
}: UserDataType) => {
  return (
    <Card>
      <CardContent
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 1,
        }}
        //   className='flex justify-between gap-1'
      >
        <Box
          display='flex'
          flexDirection='column'
          gap={1}
          flexGrow='initial'
          //  className='flex flex-col gap-1 flex-grow'
        >
          <Typography color='text.primary'>{title}</Typography>
          <Box
            display='flex'
            alignItems='center'
            gap={2}
            flexWrap='wrap'
            //    className='flex items-center gap-2 flex-wrap'
          >
            <Typography variant='h4'>{value}</Typography>
            <Typography
              color={change === 'negative' ? 'error.main' : 'success.main'}
            >
              {`(${change === 'negative' ? '-' : '+'}${changeNumber})`}
            </Typography>
          </Box>
          <Typography variant='body2'>{subTitle}</Typography>
        </Box>
        <CustomAvatar
          color={avatarColor}
          skin='light'
          variant='rounded'
          size={42}
        >
          {avatarIcon}
          {/* <i className={classnames(avatarIcon, 'text-[26px]')} /> */}
        </CustomAvatar>
      </CardContent>
    </Card>
  )
}

export default HorizontalWithSubtitle
