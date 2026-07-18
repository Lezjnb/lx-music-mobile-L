import { Animated, Easing, StyleSheet, TouchableOpacity } from 'react-native'
import { navigations } from '@/navigation'
import { useIsPlay, usePlayerMusicInfo } from '@/store/player/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import { LIST_IDS, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import Image from '@/components/common/Image'
import { useCallback, useEffect, useRef } from 'react'
import { setLoadErrorPicUrl, setMusicInfo } from '@/core/player/playInfo'
import { useSettingValue } from '@/store/setting/hook'

const PIC_HEIGHT = scaleSizeH(46)

const styles = StyleSheet.create({
  image: {
    width: PIC_HEIGHT,
    height: PIC_HEIGHT,
    borderRadius: 2,
  },
})

export default ({ isHome }: { isHome: boolean }) => {
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const coverShape = useSettingValue('playBar.ui.coverShape')
  const rotateCover = useSettingValue('playBar.ui.rotateCover')
  const rotation = useRef(new Animated.Value(0)).current
  const animationRef = useRef<Animated.CompositeAnimation | null>(null)
  useEffect(() => {
    animationRef.current?.stop()
    if (!rotateCover || !isPlay) {
      rotation.stopAnimation()
      return
    }
    animationRef.current = Animated.loop(Animated.timing(rotation, {
      toValue: 1,
      duration: 12_000,
      easing: Easing.linear,
      useNativeDriver: true,
    }))
    animationRef.current.start()
    return () => { animationRef.current?.stop() }
  }, [isPlay, rotateCover, rotation])
  const handlePress = () => {
    // console.log('')
    // console.log(playMusicInfo)
    if (!musicInfo.id) return
    navigations.pushPlayDetailScreen(commonState.componentIds.home!)

    // toast(global.i18n.t('play_detail_todo_tip'), 'long')
  }

  const handleLongPress = () => {
    if (!isHome) return
    const listId = playerState.playMusicInfo.listId
    if (!listId || listId == LIST_IDS.DOWNLOAD) return
    global.app_event.jumpListPosition()
  }

  const handleError = useCallback((url: string | number) => {
    setLoadErrorPicUrl(url as string)
    setMusicInfo({
      pic: null,
    })
  }, [])

  return (
    <TouchableOpacity onLongPress={handleLongPress} onPress={handlePress} activeOpacity={0.7} >
      <Animated.View style={{ transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
        <Image
          url={musicInfo.pic}
          nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic}
          style={{ ...styles.image, borderRadius: coverShape == 'circle' ? PIC_HEIGHT / 2 : 4 }}
          onError={handleError}
        />
      </Animated.View>
    </TouchableOpacity>
  )
}


// const styles = StyleSheet.create({
//   playInfoImg: {

//   },
// })
