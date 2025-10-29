import React from 'react'
import { Link } from 'react-router-dom'
import styled from '@emotion/styled'
import {
  useVerticalNav,
  type VerticalNavContextProps,
} from 'src/menu/contexts/verticalNavContext'
import themeConfig from 'src/configs/themeConfig'
import { useSettings } from 'src/core/contexts/settingsContext'
import VuexyLogo from 'src/assets/svg/Logo'
import { Box } from '@mui/material'

type LogoTextProps = {
  isHovered?: VerticalNavContextProps['isHovered']
  isCollapsed?: VerticalNavContextProps['isCollapsed']
  transitionDuration?: VerticalNavContextProps['transitionDuration']
}

const LogoText = styled.span<LogoTextProps>`
  font-size: 1.375rem;
  line-height: 1.09091;
  font-weight: 700;
  letter-spacing: 0.25px;
  color: var(--mui-palette-text-primary);
  transition: ${({ transitionDuration }) =>
    `margin-inline-start ${transitionDuration}ms ease-in-out, opacity ${transitionDuration}ms ease-in-out`};

  ${({ isHovered, isCollapsed }) =>
    isCollapsed && !isHovered
      ? 'opacity: 0; margin-inline-start: 0;'
      : 'opacity: 1; margin-inline-start: 12px;'}
`

const Logo = () => {
  const logoTextRef = React.useRef<HTMLSpanElement>(null)
  const { isHovered, transitionDuration } = useVerticalNav()
  const { settings } = useSettings()
  const { layout } = settings

  React.useEffect(() => {
    if (layout !== 'collapsed') return

    if (logoTextRef && logoTextRef.current) {
      if (layout === 'collapsed' && !isHovered)
        logoTextRef.current?.classList.add('hidden')
      else logoTextRef.current.classList.remove('hidden')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered, layout])

  // You may return any JSX here to display a logo in the sidebar header
  // return <Img src='/next.svg' width={100} height={25} alt='logo' /> // for example
  return (
    <Box
      data-tut='reactour__logo'
      component={Link}
      to='/'
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <VuexyLogo
        style={{
          fontSize: '1.5rem',
          lineHeight: '2rem',
          color: 'var(--primary-color)',
        }}
      />
      <LogoText
        ref={logoTextRef}
        isHovered={isHovered}
        isCollapsed={layout === 'collapsed'}
        transitionDuration={transitionDuration}
      >
        {themeConfig.templateName}
      </LogoText>
    </Box>
  )
}

export default Logo
