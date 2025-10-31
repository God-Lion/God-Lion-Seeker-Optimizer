import React from 'react'
import {
  ClickAwayListener,
  Fade,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Popper,
} from '@mui/material'
import { Translate } from '@mui/icons-material'
import type { Locale } from 'src/configs/i18n'
import { useTranslation } from 'react-i18next'
import { useSettings } from 'src/core/contexts/settingsContext'

type LanguageDataType = {
  langCode: Locale
  langName: string
}
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
// const getLocalePath = (pathName: string, locale: string): string => {
//   if (!pathName) return '/'
//   const segments = pathName.split('/')

//   segments[1] = locale

//   return segments.join('/')
// }

const languageData: Array<LanguageDataType> = [
  {
    langCode: 'en',
    langName: 'English',
  },
  {
    langCode: 'fr',
    langName: 'French',
  },
  {
    langCode: 'ar',
    langName: 'Arabic',
  },
]

const LanguageDropdown = () => {
  const [open, setOpen] = React.useState<boolean>(false)
  const anchorRef = React.useRef<HTMLButtonElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  const [, i18n] = useTranslation('common')

  // Hooks
  const { settings } = useSettings()
  const handleClose = () => setOpen(false)

  const handleToggle = () => setOpen((prevOpen) => !prevOpen)
  const handleLangCode = (langCode: Locale) => {
    i18n.changeLanguage(langCode)

    handleClose()
  }

  return (
    <React.Fragment>
      <IconButton
        ref={anchorRef}
        onClick={handleToggle}
        sx={{
          color: 'var(--mui-palette-text-primary)',
        }}
      >
        <Translate />
      </IconButton>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-start'
        anchorEl={anchorRef.current}
        sx={{
          minInlineSize: '160px',
          marginBlockStart: '0.75rem !important',
          zIndex: 1,
        }}
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom-start' ? 'left top' : 'right top',
            }}
          >
            <Paper
              sx={{
                ...(settings.skin === 'bordered'
                  ? {
                      borderWidth: '1px',
                      // --tw-shadow: 0 0 #0000;
                      // --tw-shadow-colored: 0 0 #0000;
                      boxShadow:
                        'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)',
                    }
                  : {
                      //--tw-shadow: var(--mui-customShadows-lg);
                      // --tw-shadow-colored: var(--mui-customShadows-lg);
                      boxShadow:
                        'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)',
                    }),
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList onKeyDown={handleClose}>
                  {languageData.map((locale) => (
                    <MenuItem
                      key={locale.langCode}
                      // component={Link}
                      // href={getLocalePath(pathName, locale.langCode)}
                      onClick={() => handleLangCode(locale.langCode)}
                      selected={i18n.language === locale.langCode}
                    >
                      {locale.langName}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </React.Fragment>
  )
}

export default LanguageDropdown
