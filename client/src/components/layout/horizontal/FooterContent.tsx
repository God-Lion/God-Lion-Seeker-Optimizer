import classnames from 'classnames'
// import { useVerticalNav } from 'src/menu/contexts/verticalNavContext'
// import { useHorizontalNav } from 'src/menu/contexts/horizontalNavContext'
// import { useSettings } from 'src/core/contexts/settingsContext'
import { horizontalLayoutClasses } from 'src/layouts/utils/layoutClasses'

const FooterContent = () => {
  // const { settings } = useSettings()
  // const { isBreakpointReached: isVerticalBreakpointReached } = useVerticalNav()
  // const { isBreakpointReached: isHorizontalBreakpointReached } =
    // useHorizontalNav()
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  // const isBreakpointReached =
  //   settings.layout === 'vertical'
  //     ? isVerticalBreakpointReached
  //     : isHorizontalBreakpointReached

  return (
    <div
      className={classnames(
        horizontalLayoutClasses.footerContent,
        'flex items-center justify-between flex-wrap gap-4',
      )}
    >
      <p>
        <span className='text-textSecondary'>{`© ${new Date().getFullYear()}, Made with `}</span>
        {/* <span>{`❤️`}</span> */}
        {/* <span className='text-textSecondary'>{` by `}</span> */}
        {/* <Link
          href='https://pixinvent.com/'
          target='_blank'
          className='text-primary uppercase'
        >
          Pixinvent
        </Link> */}
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
    </div>
  )
}

export default FooterContent
