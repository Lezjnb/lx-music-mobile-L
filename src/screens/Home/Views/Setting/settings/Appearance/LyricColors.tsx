import { View } from 'react-native'
import ColorPalette from '@/components/common/ColorPalette'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import Button from '../../components/Button'
import SubTitle from '../../components/SubTitle'
import { createStyle } from '@/utils/tools'

const colorSettings = [
  ['playDetail.lyric.inactiveColor', '普通歌词主文本'] as const,
  ['playDetail.lyric.inactiveTranslationColor', '普通歌词译文'] as const,
  ['playDetail.lyric.activeColor', '当前歌词主文本'] as const,
  ['playDetail.lyric.activeTranslationColor', '当前歌词译文'] as const,
]

export default () => {
  const inactiveColor = useSettingValue('playDetail.lyric.inactiveColor')
  const inactiveTranslationColor = useSettingValue('playDetail.lyric.inactiveTranslationColor')
  const activeColor = useSettingValue('playDetail.lyric.activeColor')
  const activeTranslationColor = useSettingValue('playDetail.lyric.activeTranslationColor')
  const values = [inactiveColor, inactiveTranslationColor, activeColor, activeTranslationColor]

  return (
    <SubTitle title="播放详情歌词颜色">
      <Text size={12} style={styles.note}>留空时自动跟随主题；横屏与竖屏播放详情共用。</Text>
      {colorSettings.map(([key, label], index) => (
        <ColorPalette
          key={key}
          label={label}
          value={values[index] || '#808080'}
          onChange={value => { updateSetting({ [key]: value }) }}
        />
      ))}
      <View style={styles.actions}>
        <Button onPress={() => {
          updateSetting({
            'playDetail.lyric.inactiveColor': '',
            'playDetail.lyric.inactiveTranslationColor': '',
            'playDetail.lyric.activeColor': '',
            'playDetail.lyric.activeTranslationColor': '',
          })
        }}>恢复主题默认色</Button>
      </View>
    </SubTitle>
  )
}

const styles = createStyle({
  note: { marginBottom: 7, lineHeight: 17 },
  actions: { paddingLeft: 25, marginTop: 3 },
})
