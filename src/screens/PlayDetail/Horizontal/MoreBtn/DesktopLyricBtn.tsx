import Btn from './Btn'
import { useSettingValue } from '@/store/setting/hook'
import DesktopLyricEnable, { type DesktopLyricEnableType } from '@/components/DesktopLyricEnable'
import { memo, useRef } from 'react'

export default memo(() => {
  const enabledLyric = useSettingValue('desktopLyric.enable')
  const ref = useRef<DesktopLyricEnableType>(null)
  return (
    <>
      <Btn icon={enabledLyric ? 'lyric-on' : 'lyric-off'} onPress={() => { ref.current?.setEnabled(!enabledLyric) }} />
      <DesktopLyricEnable ref={ref} />
    </>
  )
})
