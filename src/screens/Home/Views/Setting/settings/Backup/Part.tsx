import { memo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'

// import { gzip, ungzip } from 'pako'

import SubTitle from '../../components/SubTitle'
import Button from '../../components/Button'
import { useI18n } from '@/lang'
import ListImportExport, { type ListImportExportType } from './ListImportExport'
import SettingsImportExport, { type SettingsImportExportType } from './SettingsImportExport'


export default memo(() => {
  const t = useI18n()
  const listImportExportRef = useRef<ListImportExportType>(null)
  const settingsImportExportRef = useRef<SettingsImportExportType>(null)

  return (
    <>
      <SubTitle title={t('setting_backup_part')}>
        <View style={styles.list}>
          <Button onPress={() => listImportExportRef.current?.import()}>{t('setting_backup_part_import_list')}</Button>
          <Button onPress={() => listImportExportRef.current?.export()}>{t('setting_backup_part_export_list')}</Button>
        </View>
      </SubTitle>
      <SubTitle title={t('setting_backup_all')}>
        <View style={styles.list}>
          <Button onPress={() => settingsImportExportRef.current?.import()}>{t('setting_backup_part_import_setting')}</Button>
          <Button onPress={() => settingsImportExportRef.current?.export()}>{t('setting_backup_part_export_setting')}</Button>
        </View>
      </SubTitle>
      <ListImportExport ref={listImportExportRef} />
      <SettingsImportExport ref={settingsImportExportRef} />
    </>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
  },
})
