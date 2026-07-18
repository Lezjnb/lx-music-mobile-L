import { TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { setNavActiveId } from '@/core/common'
import { useI18n } from '@/lang'
import { useNavActiveId } from '@/store/common/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

const items = [
  { id: 'nav_search', icon: 'search-2' },
  { id: 'nav_songlist', icon: 'album' },
  { id: 'nav_top', icon: 'leaderboard' },
  { id: 'nav_love', icon: 'love' },
] as const

export default () => {
  const enabled = useSettingValue('common.showBottomNavigation')
  const activeId = useNavActiveId()
  const theme = useTheme()
  const t = useI18n()
  if (!enabled) return null
  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-content-background'], borderTopColor: theme['c-border-background'] }}>
      {items.map(item => {
        const active = item.id == activeId
        return (
          <TouchableOpacity key={item.id} style={styles.item} onPress={() => { setNavActiveId(item.id) }}>
            <Icon name={item.icon} size={18} color={active ? theme['c-primary-font-active'] : theme['c-font-label']} />
            <Text size={10} numberOfLines={1} color={active ? theme['c-primary-font-active'] : theme['c-font-label']}>{t(item.id)}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = createStyle({
  container: { height: 54, flexDirection: 'row', borderTopWidth: 1 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
})
