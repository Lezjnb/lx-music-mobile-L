import { useEffect, useMemo, useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { defaultPageBackground, getPageBackgrounds, type PageBackgroundConfig, type GradientDirection, type PageBackgroundId } from '@/plugins/pageBackground'

const points: Record<GradientDirection, { start: { x: number, y: number }, end: { x: number, y: number } }> = {
  topBottom: { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
  leftRight: { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
  topLeftBottomRight: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  topRightBottomLeft: { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
}

export default ({ page, children }: { page: PageBackgroundId, children: React.ReactNode }) => {
  const theme = useTheme()
  const version = useSettingValue('ui.pageBackgroundVersion')
  const [config, setConfig] = useState<PageBackgroundConfig | null>(null)

  useEffect(() => {
    void getPageBackgrounds().then(backgrounds => { setConfig(backgrounds[page] ?? null) })
  }, [page, version])

  const imageUri = config?.imageUri.startsWith('/') ? `file://${config.imageUri}` : config?.imageUri
  const gradient = useMemo(() => config ? points[config.gradientDirection] : points.topBottom, [config])
  const background = config ?? defaultPageBackground

  return (
    <View style={[styles.container, config ? { backgroundColor: theme['c-main-background'] } : styles.transparent]}>
      {imageUri ? <Image source={{ uri: imageUri }} resizeMode="cover" style={[StyleSheet.absoluteFill, { opacity: background.imageOpacity / 100 }]} /> : null}
      {background.gradientOpacity > 0 ? (
        <LinearGradient
          colors={[background.gradientStart, background.gradientEnd]}
          start={gradient.start}
          end={gradient.end}
          style={[StyleSheet.absoluteFill, { opacity: background.gradientOpacity / 100 }]}
        />
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  transparent: { backgroundColor: 'transparent' },
  content: { flex: 1 },
})
