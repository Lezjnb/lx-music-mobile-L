import { useState } from 'react'
import { View } from 'react-native'
import Text from '@/components/common/Text'
import CheckBox from '@/components/common/CheckBox'
import DorpDownMenu from '@/components/common/DorpDownMenu'
import Slider, { type SliderProps } from '@/components/common/Slider'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import styles from './style'

const animationList = [
  { action: 'shared', label: '共享封面' },
  { action: 'slide-right', label: '右侧滑入' },
  { action: 'slide-up', label: '底部上滑' },
  { action: 'fade', label: '渐变' },
] as const

export default () => {
  const animation = useSettingValue('playDetail.ui.animation')
  const coverShape = useSettingValue('playDetail.ui.coverShape')
  const rotateCover = useSettingValue('playDetail.ui.rotateCover')
  const backgroundOpacity = useSettingValue('playDetail.ui.backgroundOpacity')
  const [opacity, setOpacity] = useState(backgroundOpacity)
  const onOpacityComplete: NonNullable<SliderProps['onSlidingComplete']> = value => {
    setOpacity(value)
    updateSetting({ 'playDetail.ui.backgroundOpacity': value })
  }
  return (
    <View style={styles.container}>
      <Text>播放详情外观</Text>
      <View style={styles.list}>
        <DorpDownMenu menus={animationList} activeId={animation} onPress={({ action }) => {
          updateSetting({ 'playDetail.ui.animation': action })
        }} btnStyle={styles.menu}>
          <Text size={13}>弹出动画：{animationList.find(item => item.action == animation)?.label}</Text>
        </DorpDownMenu>
        <CheckBox need check={coverShape == 'circle'} label="圆形封面" onChange={value => {
          updateSetting({ 'playDetail.ui.coverShape': value ? 'circle' : 'square' })
        }} />
        <CheckBox check={rotateCover} label="播放时旋转封面" onChange={value => {
          updateSetting({ 'playDetail.ui.rotateCover': value })
        }} />
        <View style={styles.opacity}>
          <Text size={13}>背景遮罩：{opacity}%</Text>
          <Slider value={backgroundOpacity} minimumValue={35} maximumValue={95} step={1} onValueChange={setOpacity} onSlidingComplete={onOpacityComplete} />
        </View>
      </View>
    </View>
  )
}
