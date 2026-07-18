import { useImperativeHandle, useRef, useState, forwardRef } from 'react'
import { FlatList, TouchableOpacity, View } from 'react-native'
import Popup, { type PopupType } from '@/components/common/Popup'
import Text from '@/components/common/Text'
import { PlaylistIcon } from '@/components/common/CustomIcons'
import { useTheme } from '@/store/theme/hook'
import { getList } from '@/core/player/playInfo'
import { playList } from '@/core/player/player'
import playerState from '@/store/player/state'
import { createStyle } from '@/utils/tools'
import { useHorizontalMode } from '@/utils/hooks'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { HEADER_HEIGHT } from '@/config/constant'

export interface CurrentListBtnType {
  show: () => void
}

export default forwardRef<CurrentListBtnType>((props, ref) => {
  const theme = useTheme()
  const horizontal = useHorizontalMode()
  const popupRef = useRef<PopupType>(null)
  const [visible, setVisible] = useState(false)
  const [list, setList] = useState<Array<LX.Music.MusicInfo | LX.Download.ListItem>>([])
  const show = () => {
    const listId = playerState.playInfo.playerListId
    setList([...getList(listId)])
    setVisible(true)
    requestAnimationFrame(() => { popupRef.current?.setVisible(true) })
  }
  useImperativeHandle(ref, () => ({ show }))
  const listId = playerState.playInfo.playerListId
  const buttonSize = horizontal ? scaleSizeW(HEADER_HEIGHT) : scaleSizeH(HEADER_HEIGHT)
  const iconSize = horizontal ? 20 : 18
  return (
    <>
      <TouchableOpacity style={{ ...styles.button, width: buttonSize, height: buttonSize }} activeOpacity={0.5} onPress={show}>
        <PlaylistIcon size={iconSize} color={theme['c-font-label']} />
      </TouchableOpacity>
      {visible ? <Popup ref={popupRef} title={`当前列表（${list.length}）`} position="bottom" onHide={() => { setVisible(false) }}>
        <FlatList
          data={list}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          style={styles.list}
          ListEmptyComponent={<Text style={styles.empty} color={theme['c-font-label']}>当前没有可播放的列表</Text>}
          renderItem={({ item, index }) => {
            const active = item.id == playerState.musicInfo.id
            const music = 'progress' in item ? item.metadata.musicInfo : item
            return <TouchableOpacity style={[styles.item, active ? { backgroundColor: theme['c-primary-background-active'] } : undefined]} onPress={() => {
              if (listId) void playList(listId, index)
              popupRef.current?.setVisible(false)
            }}>
              <Text size={12} color={theme['c-font-label']} style={styles.index}>{index + 1}</Text>
              <View style={styles.info}>
                <Text numberOfLines={1} color={active ? theme['c-primary-font-active'] : undefined}>{music.name}</Text>
                <Text size={12} numberOfLines={1} color={theme['c-font-label']}>{music.singer}</Text>
              </View>
            </TouchableOpacity>
          }}
        />
      </Popup> : null}
    </>
  )
})

const styles = createStyle({
  list: { maxHeight: 450 },
  item: { minHeight: 54, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' },
  index: { width: 28, textAlign: 'center' },
  info: { flex: 1, paddingLeft: 8 },
  empty: { textAlign: 'center', paddingVertical: 35 },
  button: { alignItems: 'center', justifyContent: 'center' },
})
