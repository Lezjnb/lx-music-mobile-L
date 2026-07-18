import { memo, useMemo, useRef, useState } from 'react'
import { View, TouchableOpacity, FlatList, type FlatListProps } from 'react-native'

import { Icon } from '@/components/common/Icon'

import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { SETTING_SCREENS, type SettingScreenIds } from '../Main'
import { useI18n } from '@/lang'
import { matchSettingGroups } from '../searchIndex'

type FlatListType = FlatListProps<SettingScreenIds>

const ITEM_HEIGHT = scaleSizeH(40)
const ListItem = memo(({ id, activeId, onPress }: {
  onPress: (item: SettingScreenIds) => void
  activeId: string
  id: SettingScreenIds
}) => {
  const theme = useTheme()
  const t = useI18n()

  const active = activeId == id

  const handlePress = () => {
    onPress(id)
  }

  return (
    <View style={{ ...styles.listItem, height: ITEM_HEIGHT }}>
      {
        active
          ? <Icon style={styles.listActiveIcon} name="chevron-right" size={12} color={theme['c-primary-font']} />
          : null
      }
      <TouchableOpacity style={styles.listName} onPress={handlePress}>
        <Text numberOfLines={1} size={16} color={active ? theme['c-primary-font'] : theme['c-font']}>{t(`setting_${id}`)}</Text>
      </TouchableOpacity>
    </View>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.id === nextProps.id &&
    prevProps.activeId != nextProps.id &&
    nextProps.activeId != nextProps.id
  )
})


export default ({ onChangeId, query = '' }: {
  onChangeId: (id: SettingScreenIds) => void
  query?: string
}) => {
  const flatListRef = useRef<FlatList>(null)
  const [activeId, setActiveId] = useState(global.lx.settingActiveId)
  const t = useI18n()
  const filtered = useMemo(() => {
    const text = query.trim().toLocaleLowerCase()
    return text ? matchSettingGroups(text, id => t(`setting_${id}`)) : SETTING_SCREENS
  }, [query, t])

  const handleChangeId = (id: SettingScreenIds) => {
    onChangeId(id)
    setActiveId(id)
    global.lx.settingActiveId = id
  }

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => (
    <ListItem
      key={item}
      id={item}
      activeId={activeId}
      onPress={handleChangeId}
    />
  )
  const getkey: FlatListType['keyExtractor'] = item => item
  const getItemLayout: FlatListType['getItemLayout'] = (data, index) => {
    return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  }

  return (
    <FlatList
      ref={flatListRef}
      style={styles.container}
      data={filtered}
      maxToRenderPerBatch={9}
      // updateCellsBatchingPeriod={80}
      windowSize={9}
      removeClippedSubviews={true}
      initialNumToRender={18}
      renderItem={renderItem}
      keyExtractor={getkey}
      // extraData={activeIndex}
      getItemLayout={getItemLayout}
    />
  )
}


const styles = createStyle({
  container: {
    flexShrink: 1,
    flexGrow: 0,
  },
  // listContainer: {
  //   // borderBottomWidth: BorderWidths.normal2,
  // },

  listItem: {
    height: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    paddingLeft: 10,
    // borderBottomWidth: BorderWidths.normal,
  },
  listActiveIcon: {
    // width: 18,
    marginLeft: 3,
    // paddingRight: 5,
    textAlign: 'center',
  },
  listName: {
    height: '100%',
    // height: 46,
    // paddingTop: 12,
    // paddingBottom: 12,
    justifyContent: 'center',
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 5,
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
})
