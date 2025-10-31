import type { ChildrenType, SystemMode } from 'src/types'
import { useSettings } from 'src/core/contexts/settingsContext'
import { blankLayoutClasses } from './utils/layoutClasses'
import classnames from 'classnames'

type Props = ChildrenType & {
  systemMode: SystemMode
}

const BlankLayout = (props: Props) => {
  const { children, systemMode } = props
  const { settings } = useSettings()

  // Theme initialization is now handled by ModeChanger component

  return (
    <div
      className={classnames(blankLayoutClasses.root, 'is-full bs-full')}
      data-skin={settings.skin}
    >
      {children}
    </div>
  )
}

export default BlankLayout
