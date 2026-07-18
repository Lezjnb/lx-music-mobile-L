import { memo } from 'react'
import { View } from 'react-native'
import CheckBoxItem from '../../components/CheckBoxItem'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'

export default memo(() => {
  const enabled = useSettingValue('common.showBottomNavigation')
  return (
    <View style={styles.content}>
      <CheckBoxItem
        check={enabled}
        label="播放栏下方显示搜索、歌单、排行榜、我的列表导航"
        onChange={value => { updateSetting({ 'common.showBottomNavigation': value }) }}
      />
    </View>
  )
})

const styles = createStyle({ content: { marginTop: 5 } })
