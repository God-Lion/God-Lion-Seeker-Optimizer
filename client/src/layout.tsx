import React from 'react'
import type { ChildrenType } from 'src/types'
// import type { Locale } from 'src/configs/i18n'
import LayoutWrapper from 'src/layouts/LayoutWrapper'
import PublicLayout from 'src/components/layout/PublicLayout'
import VerticalLayout from 'src/layouts/VerticalLayout'
import HorizontalLayout from 'src/layouts/HorizontalLayout'
import Navigation from 'src/components/layout/vertical/Navigation'
import Header from 'src/components/layout/horizontal/Header'
import Navbar from 'src/components/layout/vertical/Navbar'
import VerticalFooter from 'src/components/layout/vertical/Footer'
import HorizontalFooter from 'src/components/layout/horizontal/Footer'
import { Navbar as PublicNavbar, Footer as PublicFooter } from 'src/components'
// import Customizer from 'src/core/components/customizer'
import ScrollToTop from 'src/core/components/scroll-to-top'
import Button from '@mui/material/Button'
import { ArrowUpward } from '@mui/icons-material'
// import { updateMenu } from 'src/Modules/AdminManagement/menu'
import { updateMenu } from 'src/Modules/ProviderManagement/menu'
// eslint-disable-next-line no-unused-vars
import {
  // getDictionary,
  useLang,
} from './utils/getDictionary'
import { useTranslation } from 'react-i18next'
import { Locale } from './configs/i18n'

// import { i18n } from 'src/configs/i18n'
// import { getDictionary } from 'src/utils'
// import { getMode, getSystemMode } from 'src/core/utils/serverHelpers'

const Layout: React.FC<ChildrenType> = ({
  children, // params,
  //& { params: { lang: Locale } }
}) => {
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const [t, i18n] = useTranslation('common')
  const dictionary = useLang(i18n.language as Locale)
  // const mode = getMode()
  // const systemMode = getSystemMode()

  // const direction = 'ltr'
  const systemMode = 'dark'
  const mode = 'dark'
  const menu = updateMenu()

  return (
    <React.Fragment>
      <LayoutWrapper
        systemMode={systemMode}
        publicLayout={
          <PublicLayout header={<PublicNavbar />} footer={<PublicFooter />}>
            {children}
          </PublicLayout>
        }
        verticalLayout={
          <VerticalLayout
            navigation={
              <Navigation
                dictionary={dictionary}
                menu={menu}
                mode={mode}
                systemMode={systemMode}
              />
            }
            navbar={<Navbar />}
            footer={<VerticalFooter />}
          >
            {children}
          </VerticalLayout>
        }
        horizontalLayout={
          <HorizontalLayout header={<Header />} footer={<HorizontalFooter />}>
            {children}
          </HorizontalLayout>
        }
        noLayout={<React.Fragment>{children}</React.Fragment>}
      />
      <ScrollToTop className='mui-fixed'>
        <Button
          variant='contained'
          sx={{
            minInlineSize: '2.5rem',
            blockSize: '2.5rem',
            // borderRadius: '100%',
            borderRadius: '9999px',
            padding: '0px',
            // minInlineSize: 'opx',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // inlineSize: '2.5rem', // Equivalent to .is-10
            // Equivalent to .items-center
          }}
        >
          {/* <i className='tabler-arrow-up' /> */}
          <ArrowUpward />
        </Button>
      </ScrollToTop>
      {/* <Customizer dir={direction} /> */}
    </React.Fragment>
  )
}

export default Layout
