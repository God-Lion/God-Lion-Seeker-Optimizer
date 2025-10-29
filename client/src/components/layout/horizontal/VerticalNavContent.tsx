import PerfectScrollbar from 'react-perfect-scrollbar'
import type { ChildrenType } from 'src/lib/types'
import NavHeader from 'src/menu/components/vertical-menu/NavHeader'
import Logo from 'src/components/layout/shared/Logo'
import NavCollapseIcons from 'src/menu/components/vertical-menu/NavCollapseIcons'
import { useHorizontalNav } from 'src/menu/contexts/horizontalNavContext'
import { mapHorizontalToVerticalMenu } from 'src/menu/utils/menuUtils'

const VerticalNavContent = ({ children }: ChildrenType) => {
  const { isBreakpointReached } = useHorizontalNav()
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    <>
      <NavHeader>
        <Logo />
        <NavCollapseIcons
          lockedIcon={<i className='tabler-circle-dot text-xl' />}
          unlockedIcon={<i className='tabler-circle text-xl' />}
          closeIcon={<i className='tabler-x text-xl' />}
        />
      </NavHeader>
      <ScrollWrapper
        {...(isBreakpointReached
          ? { className: 'bs-full overflow-y-auto overflow-x-hidden' }
          : { options: { wheelPropagation: false, suppressScrollX: true } })}
      >
        {mapHorizontalToVerticalMenu(children)}
      </ScrollWrapper>
    </>
  )
}

export default VerticalNavContent
