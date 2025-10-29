import React from 'react'
import LayoutNavbar from 'src/layouts/components/vertical/Navbar'
import NavbarContent from './NavbarContent'

const Navbar: React.FC = () => {
  return (
    <LayoutNavbar>
      <NavbarContent />
    </LayoutNavbar>
  )
}

export default Navbar
