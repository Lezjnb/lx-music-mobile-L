import { memo, useState } from 'react'
import Section from '../components/Section'
import IsEnable from './Sync/IsEnable'
import History from './Sync/History'
import Backup from './Backup'
import { useI18n } from '@/lang'

export default memo(() => {
  const t = useI18n()
  const [host, setHost] = useState('')
  return (
    <Section title={t('setting_sync_backup')}>
      <IsEnable host={host} setHost={setHost} />
      <History setHost={setHost} />
      <Backup />
    </Section>
  )
})
