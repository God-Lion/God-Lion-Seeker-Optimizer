import Box from '@mui/material/Box'
import { Link } from 'react-router-dom'
import classnames from 'classnames'
import { useVerticalNav } from 'src/menu/contexts/verticalNavContext'
import { useHorizontalNav } from 'src/menu/contexts/horizontalNavContext'
import { useSettings } from 'src/core/contexts/settingsContext'
import { verticalLayoutClasses } from 'src/layouts/utils/layoutClasses'
import themeConfig from 'src/configs/themeConfig'

const FooterContent = () => {
  const { settings } = useSettings()
  const { isBreakpointReached: isVerticalBreakpointReached } = useVerticalNav()
  const { isBreakpointReached: isHorizontalBreakpointReached } =
    useHorizontalNav()
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const isBreakpointReached =
    settings.layout === 'vertical'
      ? isVerticalBreakpointReached
      : isHorizontalBreakpointReached

  return (
    <Box
      className={classnames(
        verticalLayoutClasses.footerContent,
        // 'flex items-center justify-between flex-wrap gap-4',
      )}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}
    >
      <p>
        <Box
          component='span'
          // className='text-textSecondary'
          sx={{
            color: 'var(--mui-palette-text-secondary)',
          }}
        >{`© ${new Date().getFullYear()}, Made `}</Box>
        {/* <span>{`❤️`}</span> */}
        <Box
          component='span'
          // className='text-textSecondary'
          sx={{
            color: 'var(--mui-palette-text-secondary)',
          }}
          className='text-textSecondary'
        >{` by `}</Box>
        <Link
          // href='https://pixinvent.com'
          target='_blank'
          // className='text-primary uppercase'
          to=''
          style={{
            color: 'white',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          {themeConfig.templateName}
        </Link>
      </p>
      {/* {!isBreakpointReached && (
        <div className='flex items-center gap-4'>
          <Link
            href='https://themeforest.net/licenses/standard'
            target='_blank'
            className='text-primary'
          >
            License
          </Link>
          <Link
            href='https://themeforest.net/user/pixinvent/portfolio'
            target='_blank'
            className='text-primary'
          >
            More Themes
          </Link>
          <Link
            href='https://demos.pixinvent.com/vuexy-nextjs-admin-template/documentation'
            target='_blank'
            className='text-primary'
          >
            Documentation
          </Link>
          <Link
            href='https://pixinvent.ticksy.com'
            target='_blank'
            className='text-primary'
          >
            Support
          </Link>
        </div>
      )} */}
    </Box>
  )
}

export default FooterContent
