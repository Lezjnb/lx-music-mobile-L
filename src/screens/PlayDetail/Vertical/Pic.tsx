import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, View } from 'react-native'
// import { useLayout } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { useIsPlay, usePlayerMusicInfo } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useNavigationComponentDidAppear } from '@/navigation'
import { HEADER_HEIGHT } from './components/Header'
import Image from '@/components/common/Image'
import { useStatusbarHeight } from '@/store/common/hook'
import commonState from '@/store/common/state'
import { useSettingValue } from '@/store/setting/hook'


export default ({ componentId }: { componentId: string }) => {
  const musicInfo = usePlayerMusicInfo()
  const { width: winWidth, height: winHeight } = useWindowSize()
  const statusBarHeight = useStatusbarHeight()
  const isPlay = useIsPlay()
  const coverShape = useSettingValue('playDetail.ui.coverShape')
  const coverRadius = useSettingValue('playDetail.ui.coverRadius')
  const rotateCover = useSettingValue('playDetail.ui.rotateCover')
  const rotation = useRef(new Animated.Value(0)).current

  const [animated, setAnimated] = useState(!!commonState.componentIds.playDetail)
  const [pic, setPic] = useState(musicInfo.pic)
  useEffect(() => {
    if (animated) setPic(musicInfo.pic)
  }, [musicInfo.pic, animated])

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })
  useEffect(() => {
    if (!rotateCover || !isPlay) {
      rotation.stopAnimation()
      return
    }
    const animation = Animated.loop(Animated.timing(rotation, {
      toValue: 1,
      duration: 18_000,
      easing: Easing.linear,
      useNativeDriver: true,
    }))
    animation.start()
    return () => { animation.stop() }
  }, [isPlay, rotateCover, rotation])
  // console.log('render pic')

  const style = useMemo(() => {
    const imgWidth = Math.min(winWidth * 0.8, (winHeight - statusBarHeight - HEADER_HEIGHT) * 0.5)
    return {
      width: imgWidth,
      height: imgWidth,
      borderRadius: coverShape == 'circle' ? imgWidth / 2 : coverRadius,
    }
  }, [coverRadius, coverShape, statusBarHeight, winHeight, winWidth])

  return (
    <View style={styles.container}>
      <Animated.View
        nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic}
        style={{
          ...styles.content,
          ...style,
          elevation: animated ? 3 : 0,
          transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
        }}>
        <Image url={pic} style={styles.image} />
      </Animated.View>
    </View>
  )
}

const styles = createStyle({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
})
