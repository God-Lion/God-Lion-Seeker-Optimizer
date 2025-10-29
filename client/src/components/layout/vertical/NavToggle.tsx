import React from 'react'
import MenuIcon from '@mui/icons-material/Menu'
import { useVerticalNav } from 'src/menu/contexts/verticalNavContext'
const NavToggle = () => {
  const { toggleVerticalNav, isBreakpointReached } = useVerticalNav()

  const handleClick = () => {
    toggleVerticalNav()
  }

  return (
    <React.Fragment>
      {isBreakpointReached && (
        <MenuIcon
          sx={{
            cursor: 'pointer',
          }}
          onClick={handleClick}
        />
      )}
    </React.Fragment>
  )
}

export default NavToggle
