import { memo } from 'react'
import Section from '../../components/Section'
import Theme from '../Theme'
import PlayerAppearance from '../Player/Appearance'
import PlayDetailAppearance from '@/screens/PlayDetail/components/SettingPopup/settings/SettingAppearance'
import BottomNavigation from '../Basic/BottomNavigation'
import { useI18n } from '@/lang'
import LyricColors from './LyricColors'

export default memo(() => {
  const t = useI18n()
  return (
    <Section title={t('setting_appearance')}>
      <Theme />
      <PlayerAppearance />
      <PlayDetailAppearance />
      <LyricColors />
      <BottomNavigation />
    </Section>
  )
})
