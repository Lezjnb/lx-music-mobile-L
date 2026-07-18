import ChoosePath, { type ChoosePathType } from '@/components/common/ChoosePath'
import { LXM_FILE_EXT_RXP } from '@/config/constant'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { handleExportSettings, handleImportSettings } from './actions'

export interface SettingsImportExportType {
  import: () => void
  export: () => void
}

export default forwardRef<SettingsImportExportType>((props, ref) => {
  const [visible, setVisible] = useState(false)
  const choosePathRef = useRef<ChoosePathType>(null)
  const actionRef = useRef<'import' | 'export'>('import')
  const show = (action: 'import' | 'export') => {
    actionRef.current = action
    const options = action == 'import'
      ? { title: global.i18n.t('setting_backup_part_import_setting_desc'), dirOnly: false, filter: LXM_FILE_EXT_RXP }
      : { title: global.i18n.t('setting_backup_part_export_setting_desc'), dirOnly: true, filter: LXM_FILE_EXT_RXP }
    if (visible) choosePathRef.current?.show(options)
    else {
      setVisible(true)
      requestAnimationFrame(() => { choosePathRef.current?.show(options) })
    }
  }
  useImperativeHandle(ref, () => ({
    import: () => { show('import') },
    export: () => { show('export') },
  }))
  return visible ? <ChoosePath ref={choosePathRef} onConfirm={path => {
    if (actionRef.current == 'import') handleImportSettings(path)
    else handleExportSettings(path)
  }} /> : null
})
