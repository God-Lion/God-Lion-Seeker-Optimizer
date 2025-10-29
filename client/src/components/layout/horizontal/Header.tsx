import LayoutHeader from 'src/layouts/components/horizontal/Header'
import Navbar from 'src/layouts/components/horizontal/Navbar'
import NavbarContent from './NavbarContent'
import Navigation from './Navigation'

// import type { getDictionary } from '@/utils/getDictionary'
import { useHorizontalNav } from 'src/menu/contexts/horizontalNavContext'

const Header = () =>
  //   {
  //   dictionary,
  // }: {
  //   dictionary: Awaited<ReturnType<typeof getDictionary>>
  // }
  {
    // Hooks
    const { isBreakpointReached } = useHorizontalNav()

    return (
      <>
        <LayoutHeader>
          <Navbar>
            <NavbarContent />
          </Navbar>
          {!isBreakpointReached && (
            <Navigation
            // dictionary={dictionary}
            />
          )}
        </LayoutHeader>
        {isBreakpointReached && (
          <Navigation
          // dictionary={dictionary}
          />
        )}
      </>
    )
  }

export default Header
