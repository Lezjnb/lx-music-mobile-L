import { useMemo, useState } from 'react'
import { View } from 'react-native'
import DorpDownMenu from '@/components/common/DorpDownMenu'
import Text from '@/components/common/Text'
import Slider, { type SliderProps } from '../../components/Slider'
import SubTitle from '../../components/SubTitle'
import CheckBoxItem from '../../components/CheckBoxItem'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'

const Select = ({
  label,
  value,
  list,
  onChange,
}: {
  label: string
  value: string
  list: Array<{ action: string, label: string }>
  onChange: (value: string) => void
}) => (
  <View style={styles.row}>
    <Text style={styles.label} size={13}>{label}</Text>
    <DorpDownMenu menus={list} activeId={value} onPress={({ action }) => { onChange(action) }} btnStyle={styles.select}>
      <Text numberOfLines={1} size={13}>{list.find(item => item.action == value)?.label}</Text>
    </DorpDownMenu>
  </View>
)

const NumberSetting = ({
  label,
  value,
  min,
  max,
  settingKey,
}: {
  label: string
  value: number
  min: number
  max: number
  settingKey: keyof LX.AppSetting
}) => {
  const [current, setCurrent] = useState(value)
  const onComplete: NonNullable<SliderProps['onSlidingComplete']> = next => {
    setCurrent(next)
    updateSetting({ [settingKey]: next })
  }
  return (
    <View style={styles.slider}>
      <Text size={13}>{label}：{current}</Text>
      <Slider value={value} minimumValue={min} maximumValue={max} step={1} onValueChange={setCurrent} onSlidingComplete={onComplete} />
    </View>
  )
}

export default () => {
  const playBarStyle = useSettingValue('common.playBarStyle')
  const coverShape = useSettingValue('playBar.ui.coverShape')
  const rotateCover = useSettingValue('playBar.ui.rotateCover')
  const showProgress = useSettingValue('playBar.ui.showProgress')
  const capsuleRadius = useSettingValue('playBar.ui.capsuleRadius')
  const glassEnabled = useSettingValue('ui.glass.enabled')
  const glassOpacity = useSettingValue('ui.glass.opacity')
  const glassBorderOpacity = useSettingValue('ui.glass.borderOpacity')
  const glassShadow = useSettingValue('ui.glass.shadow')
  const settingSearchResultOpacity = useSettingValue('ui.settingSearchResultOpacity')
  const playBarList = useMemo(() => [
    { action: 'mini', label: '标准播放栏' },
    { action: 'full', label: '全宽播放栏' },
    { action: 'capsule', label: '悬浮胶囊' },
  ], [])

  return (
    <SubTitle title="播放栏与玻璃效果">
      <Select label="播放栏样式" value={playBarStyle} list={playBarList} onChange={value => { updateSetting({ 'common.playBarStyle': value as LX.AppSetting['common.playBarStyle'] }) }} />
      <Select label="封面形状" value={coverShape} list={[
        { action: 'square', label: '圆角方形' },
        { action: 'circle', label: '圆形' },
      ]} onChange={value => { updateSetting({ 'playBar.ui.coverShape': value as LX.AppSetting['playBar.ui.coverShape'] }) }} />
      <CheckBoxItem check={rotateCover} label="播放时旋转封面" onChange={value => { updateSetting({ 'playBar.ui.rotateCover': value }) }} />
      <CheckBoxItem check={showProgress} label="显示播放进度条" onChange={value => { updateSetting({ 'playBar.ui.showProgress': value }) }} />
      {playBarStyle == 'capsule' ? <NumberSetting label="胶囊圆角" value={capsuleRadius} min={18} max={48} settingKey="playBar.ui.capsuleRadius" /> : null}
      <CheckBoxItem check={glassEnabled} label="启用拟态玻璃效果" onChange={value => { updateSetting({ 'ui.glass.enabled': value }) }} />
      {glassEnabled ? (
        <>
          <NumberSetting label="玻璃不透明度" value={glassOpacity} min={40} max={100} settingKey="ui.glass.opacity" />
          <NumberSetting label="边框强度" value={glassBorderOpacity} min={0} max={70} settingKey="ui.glass.borderOpacity" />
          <NumberSetting label="阴影强度" value={glassShadow} min={0} max={24} settingKey="ui.glass.shadow" />
        </>
      ) : null}
      <NumberSetting label="设置搜索结果不透明度" value={settingSearchResultOpacity} min={65} max={100} settingKey="ui.settingSearchResultOpacity" />
    </SubTitle>
  )
}

const styles = createStyle({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  label: { width: 86 },
  select: { flex: 1, padding: 9, borderRadius: 5, backgroundColor: 'rgba(127,127,127,0.15)' },
  slider: { marginTop: 6, marginBottom: 5 },
})
