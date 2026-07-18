import { useEffect, useRef, useState } from 'react'
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import CheckBox from '@/components/common/CheckBox'
import ChoosePath, { type ChoosePathType } from '@/components/common/ChoosePath'
import Input from '@/components/common/Input'
import ColorPalette from '@/components/common/ColorPalette'
import Text from '@/components/common/Text'
import Button from '../../components/Button'
import Slider from '../../components/Slider'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { extname, mkdir, privateStorageDirectoryPath, readFile, writeFile } from '@/utils/fs'
import {
  defaultPageBackground,
  getPageBackgrounds,
  PAGE_BACKGROUND_IDS,
  resetPageBackground,
  savePageBackground,
  type GradientDirection,
  type PageBackgroundConfig,
  type PageBackgroundId,
} from '@/plugins/pageBackground'

const labels: Record<PageBackgroundId, string> = {
  search: '搜索',
  songlist: '歌单',
  leaderboard: '排行榜',
  mylist: '我的列表',
  setting: '设置',
  playDetail: '播放详情',
}
const directions: Array<{ id: GradientDirection, label: string }> = [
  { id: 'topBottom', label: '从上到下' },
  { id: 'leftRight', label: '从左到右' },
  { id: 'topLeftBottomRight', label: '左上到右下' },
  { id: 'topRightBottomLeft', label: '右上到左下' },
]
const imageDir = `${privateStorageDirectoryPath}/page_backgrounds`
const gradientPoints: Record<GradientDirection, { start: { x: number, y: number }, end: { x: number, y: number } }> = {
  topBottom: { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
  leftRight: { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
  topLeftBottomRight: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  topRightBottomLeft: { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
}

const BackgroundPreview = ({
  id,
  selected,
  config,
  onPress,
}: {
  id: PageBackgroundId
  selected: boolean
  config: PageBackgroundConfig
  onPress: () => void
}) => {
  const theme = useTheme()
  const imageUri = config.imageUri.startsWith('/') ? `file://${config.imageUri}` : config.imageUri
  const isPlayDetail = id == 'playDetail'
  const points = gradientPoints[config.gradientDirection]
  return (
    <TouchableOpacity
      style={[styles.previewCard, { borderColor: selected ? theme['c-primary'] : theme['c-border-background'] }]}
      activeOpacity={0.75}
      onPress={onPress}>
      <View style={[styles.previewSurface, { backgroundColor: theme['c-content-background'] }]}>
        {imageUri ? <Image source={{ uri: imageUri }} resizeMode="cover" style={[StyleSheet.absoluteFill, { opacity: config.imageOpacity / 100 }]} /> : null}
        {config.gradientOpacity > 0 ? <LinearGradient colors={[config.gradientStart, config.gradientEnd]} start={points.start} end={points.end} style={[StyleSheet.absoluteFill, { opacity: config.gradientOpacity / 100 }]} /> : null}
        <Text size={10} numberOfLines={1} style={styles.previewTitle}>{labels[id]}</Text>
        {isPlayDetail ? (
          <View style={styles.previewDetail}>
            <View style={[styles.previewCover, { backgroundColor: theme['c-primary'] }]} />
            <View style={styles.previewLyrics}>
              <View style={[styles.previewLine, styles.previewLineActive, { backgroundColor: theme['c-primary'] }]} />
              <View style={[styles.previewLine, { backgroundColor: theme['c-font-label'] }]} />
              <View style={[styles.previewLine, { backgroundColor: theme['c-font-label'] }]} />
            </View>
          </View>
        ) : (
          <View style={styles.previewList}>
            <View style={[styles.previewLine, { backgroundColor: theme['c-primary'] }]} />
            <View style={[styles.previewLine, { backgroundColor: theme['c-font-label'] }]} />
            <View style={[styles.previewLine, { backgroundColor: theme['c-font-label'] }]} />
          </View>
        )}
      </View>
      <Text size={11} style={styles.previewLabel} color={selected ? theme['c-primary'] : undefined}>{selected ? `✓ ${labels[id]}` : labels[id]}</Text>
    </TouchableOpacity>
  )
}

export default () => {
  const pickerRef = useRef<ChoosePathType>(null)
  const [config, setConfig] = useState<PageBackgroundConfig>(defaultPageBackground)
  const [selected, setSelected] = useState<PageBackgroundId[]>(['search'])

  useEffect(() => {
    void getPageBackgrounds().then(backgrounds => {
      const first = PAGE_BACKGROUND_IDS.find(id => backgrounds[id])
      if (first) {
        setSelected([first])
        setConfig(backgrounds[first]!)
      }
    })
  }, [])

  const toggle = (id: PageBackgroundId) => {
    setSelected(ids => ids.includes(id) ? ids.filter(item => item != id) : [...ids, id])
  }
  const importImage = async(path: string) => {
    const extension = extname(path).toLowerCase()
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
      toast('请选择 JPG、PNG 或 WebP 图片')
      return
    }
    try {
      await mkdir(imageDir)
    } catch {}
    try {
      const destination = `${imageDir}/bg_${Date.now()}.${extension}`
      await writeFile(destination, await readFile(path, 'base64'), 'base64')
      setConfig(value => ({ ...value, imageUri: destination }))
      toast('背景图片已导入，点击“应用到所选页面”后生效')
    } catch (error) {
      toast(error instanceof Error ? `导入图片失败：${error.message}` : '导入图片失败')
    }
  }
  const apply = () => {
    if (!selected.length) {
      toast('请至少选择一个页面')
      return
    }
    const imageUri = config.imageUri.trim()
    if (imageUri && !imageUri.startsWith('/') && !/^https:\/\//iu.test(imageUri)) {
      toast('网络背景仅支持 HTTPS 链接')
      return
    }
    if (imageUri.startsWith('https://')) {
      void Image.prefetch(imageUri).then(async() => {
        await savePageBackground(selected, { ...config, imageUri })
      }).then(() => {
        toast('页面背景已应用')
      }).catch(() => {
        toast('网络图片无法访问，请检查链接')
      })
      return
    }
    void savePageBackground(selected, { ...config, imageUri }).then(() => {
      toast('页面背景已应用')
    })
  }
  const reset = () => {
    if (!selected.length) {
      toast('请至少选择一个页面')
      return
    }
    void resetPageBackground(selected).then(() => {
      setConfig(defaultPageBackground)
      toast('所选页面已恢复主题背景')
    })
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.previewPanel}>
          <Text size={13}>实时预览（点击小窗选择应用页面）</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewStrip} nestedScrollEnabled keyboardShouldPersistTaps="always">
            {PAGE_BACKGROUND_IDS.map(id => <BackgroundPreview key={id} id={id} selected={selected.includes(id)} config={config} onPress={() => { toggle(id) }} />)}
          </ScrollView>
        </View>
        <ScrollView style={styles.form} contentContainerStyle={styles.formContent} nestedScrollEnabled keyboardShouldPersistTaps="always">
          <Text size={12} style={styles.note}>编辑一份背景方案，再多选应用到搜索、歌单、排行榜、我的列表、设置或播放详情。</Text>
          <Text size={13}>应用目标</Text>
          <View style={styles.targets}>
            {PAGE_BACKGROUND_IDS.map(id => <CheckBox key={id} marginRight={10} marginBottom={4} check={selected.includes(id)} label={labels[id]} onChange={() => { toggle(id) }} />)}
          </View>
          <Input value={config.imageUri} placeholder="网络图片 HTTPS 链接（留空仅使用渐变）" autoCapitalize="none" onChangeText={imageUri => { setConfig(value => ({ ...value, imageUri })) }} style={styles.input} />
          <View style={styles.row}><Button onPress={() => { pickerRef.current?.show({ title: '选择背景图片', filter: ['jpg', 'jpeg', 'png', 'webp'] }) }}>导入本地图片</Button><Button onPress={() => { setConfig(value => ({ ...value, imageUri: '' })) }}>移除图片</Button></View>
          <ColorPalette label="渐变起始色" value={config.gradientStart} onChange={gradientStart => { setConfig(value => ({ ...value, gradientStart })) }} />
          <ColorPalette label="渐变结束色" value={config.gradientEnd} onChange={gradientEnd => { setConfig(value => ({ ...value, gradientEnd })) }} />
          <View style={styles.directions}>{directions.map(item => <CheckBox key={item.id} marginRight={9} marginBottom={4} need check={config.gradientDirection == item.id} label={item.label} onChange={() => { setConfig(value => ({ ...value, gradientDirection: item.id })) }} />)}</View>
          <Text size={13}>图片透明度：{config.imageOpacity}%</Text>
          <Slider value={config.imageOpacity} minimumValue={0} maximumValue={100} step={1} onValueChange={imageOpacity => { setConfig(value => ({ ...value, imageOpacity })) }} />
          <Text size={13}>渐变透明度：{config.gradientOpacity}%</Text>
          <Slider value={config.gradientOpacity} minimumValue={0} maximumValue={100} step={1} onValueChange={gradientOpacity => { setConfig(value => ({ ...value, gradientOpacity })) }} />
          <View style={styles.row}><Button onPress={apply}>应用到所选页面</Button><Button onPress={reset}>恢复主题背景</Button></View>
        </ScrollView>
      </View>
      <ChoosePath ref={pickerRef} onConfirm={path => { void importImage(path) }} />
    </>
  )
}

const styles = createStyle({
  container: { flex: 1, minHeight: 0 },
  previewPanel: { flexGrow: 0, flexShrink: 0, paddingHorizontal: 15, paddingTop: 2, paddingBottom: 7 },
  previewStrip: { gap: 8, paddingTop: 6, paddingRight: 15 },
  form: { flex: 1, minHeight: 0 },
  formContent: { paddingHorizontal: 15, paddingBottom: 25 },
  note: { marginBottom: 8, lineHeight: 17 },
  targets: { paddingLeft: 25, flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  previewCard: { width: 86, borderRadius: 7, borderWidth: 1, padding: 3, overflow: 'hidden' },
  previewSurface: { height: 56, borderRadius: 4, overflow: 'hidden', padding: 5 },
  previewTitle: { fontWeight: '700', marginBottom: 4 },
  previewList: { gap: 6, paddingTop: 3 },
  previewDetail: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  previewCover: { width: 24, height: 24, borderRadius: 12 },
  previewLyrics: { flex: 1, gap: 5 },
  previewLine: { height: 4, borderRadius: 2, opacity: 0.5, width: '88%' },
  previewLineActive: { width: '100%', opacity: 0.95 },
  previewLabel: { textAlign: 'center', marginTop: 3 },
  input: { marginBottom: 8, borderRadius: 4 },
  row: { paddingLeft: 25, flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  directions: { paddingLeft: 25, flexDirection: 'row', flexWrap: 'wrap', marginBottom: 5 },
})
