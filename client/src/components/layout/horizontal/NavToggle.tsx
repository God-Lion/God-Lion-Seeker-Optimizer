import { useVerticalNav } from 'src/menu/contexts/verticalNavContext'
import { useHorizontalNav } from 'src/menu/contexts/horizontalNavContext'

const NavToggle = () => {
  const { toggleVerticalNav } = useVerticalNav()
  const { isBreakpointReached } = useHorizontalNav()
  const handleClick = () => {
    toggleVerticalNav()
  }

  return (
    <>
      {/* <i className='tabler-menu-2 cursor-pointer' onClick={handleClick} /> */}
      {/* Comment following code and uncomment this code in order to toggle menu on desktop screens as well */}
      {isBreakpointReached && (
        <i className='tabler-menu-2 cursor-pointer' onClick={handleClick} />
      )}
    </>
  )
}

export default NavToggle
