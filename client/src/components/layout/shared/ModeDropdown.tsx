import React from 'react'
import {
  ClickAwayListener,
  Fade,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Tooltip,
} from '@mui/material'
import { Brightness4, Brightness7, Laptop } from '@mui/icons-material'
import { useSettings } from 'src/core/contexts/settingsContext'
import type { Mode } from 'src/types'

const ModeDropdown = () => {
  const [open, setOpen] = React.useState<boolean>(false)
  const [tooltipOpen, setTooltipOpen] = React.useState<boolean>(false)
  const anchorRef = React.useRef<HTMLButtonElement>(null)
  const { settings, updateSettings } = useSettings()

  const handleClose = () => {
    setOpen(false)
    setTooltipOpen(false)
  }

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen)
  }

  const handleModeSwitch = (mode: Mode) => {
    // Close dropdown immediately
    handleClose()

    // Update settings if different mode selected
    if (settings.mode !== mode) {
      updateSettings({ mode: mode })
    }
  }

  const getModeIcon = (): React.JSX.Element => {
    if (settings.mode === 'system') return <Laptop />
    else if (settings.mode === 'dark') return <Brightness4 />
    else return <Brightness7 />
  }

  const getModeLabel = (): string => {
    if (settings.mode === 'system') return 'System'
    else if (settings.mode === 'dark') return 'Dark'
    else return 'Light'
  }

  return (
    <React.Fragment>
      <Tooltip
        title={`${getModeLabel()} Mode`}
        onOpen={() => setTooltipOpen(true)}
        onClose={() => setTooltipOpen(false)}
        open={open ? false : tooltipOpen}
        PopperProps={{ className: 'capitalize' }}
      >
        <IconButton
          ref={anchorRef}
          onClick={handleToggle}
          sx={{
            color: 'var(--primary-color)',
          }}
          aria-label={`Switch theme mode - currently ${getModeLabel()}`}
        >
          {getModeIcon()}
        </IconButton>
      </Tooltip>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-start'
        anchorEl={anchorRef.current}
        sx={{
          minInlineSize: '160px',
          marginBlockStart: '0.75rem !important',
          zIndex: 1300,
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
                      boxShadow:
                        'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)',
                    }
                  : {
                      boxShadow:
                        'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)',
                    }),
              }}
              className={
                settings.skin === 'bordered'
                  ? 'border shadow-none'
                  : 'shadow-lg'
              }
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList onKeyDown={handleClose}>
                  <MenuItem
                    onClick={() => handleModeSwitch('light')}
                    selected={settings.mode === 'light'}
                    sx={{
                      gap: '0.75rem',
                    }}
                  >
                    <Brightness7
                      sx={{
                        fontSize: '22px',
                      }}
                    />
                    Light
                  </MenuItem>
                  <MenuItem
                    onClick={() => handleModeSwitch('dark')}
                    selected={settings.mode === 'dark'}
                    sx={{
                      gap: '0.75rem',
                    }}
                  >
                    <Brightness4
                      sx={{
                        fontSize: '22px',
                      }}
                    />
                    Dark
                  </MenuItem>
                  <MenuItem
                    onClick={() => handleModeSwitch('system')}
                    selected={settings.mode === 'system'}
                    sx={{
                      gap: '0.75rem',
                    }}
                  >
                    <Laptop
                      sx={{
                        fontSize: '22px',
                      }}
                    />
                    System
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </React.Fragment>
  )
}

export default ModeDropdown
