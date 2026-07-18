import { createStyle } from '@/utils/tools'
import { View } from 'react-native'
import PlayModeBtn from './PlayModeBtn'
import MusicAddBtn from './MusicAddBtn'
import TimeoutExitBtn from './TimeoutExitBtn'
import DesktopLyricBtn from './DesktopLyricBtn'
import AiTranslateBtn from './AiTranslateBtn'
import { scaleSizeH } from '@/utils/pixelRatio'

export default () => {
  return (
    <View style={styles.container}>
      <TimeoutExitBtn />
      <DesktopLyricBtn />
      <MusicAddBtn />
      <PlayModeBtn />
      <AiTranslateBtn />
    </View>
  )
}


const styles = createStyle({
  container: {
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: 'column',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    top: scaleSizeH(14),
    bottom: scaleSizeH(8),
    gap: 16,
    zIndex: 1,
  },
})
