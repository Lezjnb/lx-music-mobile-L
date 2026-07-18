import { memo, useMemo, useRef, useState } from 'react'
import { FlatList, ScrollView, TouchableOpacity, View, type FlatListProps } from 'react-native'
import Input from '@/components/common/Input'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'
import Basic from '../settings/Basic'
import Appearance from '../settings/Appearance'
import Player from '../settings/Player'
import LyricDesktop from '../settings/LyricDesktop'
import Search from '../settings/Search'
import List from '../settings/List'
import SyncBackup from '../settings/SyncBackup'
import Other from '../settings/Other'
import Version from '../settings/Version'
import About from '../settings/About'
import { SETTING_SCREENS, type SettingScreenIds } from '../Main'
import { matchSettingGroups } from '../searchIndex'

type FlatListType = FlatListProps<SettingScreenIds>

const withOpacity = (color: string, opacity: number) => {
  if (color.startsWith('rgba(')) return color.replace(/,\s*[^,]+\)$/, `, ${opacity})`)
  if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`)
  return color
}

const components: Record<SettingScreenIds, JSX.Element> = {
  basic: <Basic />,
  appearance: <Appearance />,
  player: <Player />,
  lyric_desktop: <LyricDesktop />,
  search: <Search />,
  list: <List />,
  sync_backup: <SyncBackup />,
  other: <Other />,
  version: <Version />,
  about: <About />,
}

const ListItem = memo(({
  id,
  expanded,
  onToggle,
}: {
  id: SettingScreenIds
  expanded: boolean
  onToggle: (id: SettingScreenIds) => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  return (
    <View style={styles.item}>
      <TouchableOpacity style={{ ...styles.header, borderColor: theme['c-border-background'] }} onPress={() => { onToggle(id) }}>
        <Text size={16} style={styles.title}>{t(`setting_${id}`)}</Text>
        <Icon name="chevron-right" style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }} color={theme['c-font-label']} size={11} />
      </TouchableOpacity>
      {expanded ? <View style={styles.body}>{components[id]}</View> : null}
    </View>
  )
})

export default () => {
  const t = useI18n()
  const theme = useTheme()
  const searchResultOpacity = useSettingValue('ui.settingSearchResultOpacity') / 100
  const listRef = useRef<FlatList<SettingScreenIds>>(null)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<SettingScreenIds[]>([])
  const normalized = query.trim().toLocaleLowerCase()
  const matchedGroups = useMemo(() => matchSettingGroups(query, id => t(`setting_${id}`)), [query, t])

  const toggle = (id: SettingScreenIds) => {
    setExpanded(list => list.includes(id) ? list.filter(item => item != id) : [...list, id])
  }
  const selectResult = (id: SettingScreenIds) => {
    setExpanded([id])
    setQuery('')
    const index = SETTING_SCREENS.indexOf(id)
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.08 })
    })
  }
  const renderItem: FlatListType['renderItem'] = ({ item }) => (
    <ListItem id={item} expanded={expanded.includes(item)} onToggle={toggle} />
  )

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={SETTING_SCREENS}
        keyboardShouldPersistTaps="always"
        renderItem={renderItem}
        keyExtractor={item => item}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<View style={styles.listTopSpace} />}
        onScrollToIndexFailed={({ index }) => {
          requestAnimationFrame(() => { listRef.current?.scrollToOffset({ offset: index * 64, animated: true }) })
        }}
      />
      <View style={styles.searchOverlay} pointerEvents="box-none">
        <View style={styles.search}>
          <Icon name="search-2" size={16} style={styles.searchIcon} />
          <Input
            value={query}
            placeholder="搜索设置：AI、播放栏、在线源、备份…"
            onChangeText={setQuery}
            clearBtn
            style={styles.searchInput}
            containerStyle={styles.searchInputContainer}
          />
        </View>
        {normalized ? (
          matchedGroups.length ? (
            <ScrollView style={[styles.results, { backgroundColor: withOpacity(theme['c-content-background'], searchResultOpacity) }]} contentContainerStyle={styles.resultContent} nestedScrollEnabled keyboardShouldPersistTaps="always">
              {matchedGroups.map(id => <TouchableOpacity key={id} style={[styles.result, { borderColor: theme['c-border-background'] }]} onPress={() => { selectResult(id) }}><Text>{t(`setting_${id}`)}</Text><Icon name="chevron-right" size={11} color={theme['c-font-label']} /></TouchableOpacity>)}
            </ScrollView>
          ) : <Text style={[styles.empty, { backgroundColor: withOpacity(theme['c-content-background'], searchResultOpacity) }]} color="gray">没有匹配的设置项</Text>
        ) : null}
      </View>
    </View>
  )
}

const styles = createStyle({
  container: { flex: 1 },
  content: { padding: 15, paddingBottom: 30 },
  listTopSpace: { height: 54 },
  searchOverlay: { position: 'absolute', top: 15, left: 15, right: 15, zIndex: 10 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRadius: 18,
    marginBottom: 12,
    backgroundColor: 'rgba(127,127,127,0.15)',
  },
  searchIcon: { marginRight: 3 },
  searchInput: { height: 34, backgroundColor: 'transparent', borderRadius: 16 },
  searchInputContainer: { flexGrow: 1, flexShrink: 1 },
  item: { marginBottom: 8, borderRadius: 7, overflow: 'hidden', backgroundColor: 'rgba(127,127,127,0.08)' },
  header: { minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  title: { flex: 1 },
  body: { paddingTop: 8, paddingBottom: 6 },
  empty: { textAlign: 'center', paddingVertical: 18, borderRadius: 7, backgroundColor: 'rgba(127,127,127,0.10)' },
  results: { maxHeight: 260, borderRadius: 7, marginBottom: 8 },
  resultContent: {},
  result: { minHeight: 46, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: 'rgba(127,127,127,0.15)' },
})
