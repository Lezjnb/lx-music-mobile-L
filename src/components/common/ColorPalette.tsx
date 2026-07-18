import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Slider from '@react-native-community/slider'
import Text from './Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'

const presets = ['#E53935', '#FB8C00', '#FDD835', '#43A047', '#00ACC1', '#1E88E5', '#3949AB', '#8E24AA', '#D81B60', '#795548', '#607D8B', '#20242D']
const hueColors = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000']
const clamp = (value: number) => Math.max(0, Math.min(1, value))
const hexToHsl = (hex: string) => {
  const normalized = /^#[\da-f]{6}$/iu.test(hex) ? hex.slice(1) : '000000'
  const r = parseInt(normalized.slice(0, 2), 16) / 255
  const g = parseInt(normalized.slice(2, 4), 16) / 255
  const b = parseInt(normalized.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b); const min = Math.min(r, g, b); const lightness = (max + min) / 2
  const delta = max - min
  if (!delta) return { h: 0, s: 0, l: lightness }
  const saturation = delta / (1 - Math.abs(2 * lightness - 1))
  const hue = max == r ? ((g - b) / delta) % 6 : max == g ? (b - r) / delta + 2 : (r - g) / delta + 4
  return { h: (hue * 60 + 360) % 360, s: saturation, l: lightness }
}
const hslToHex = (h: number, s: number, l: number) => {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return '#' + [r, g, b].map(item => Math.round((item + m) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
}

export default ({ label, value, onChange }: { label: string, value: string, onChange: (value: string) => void }) => {
  const theme = useTheme()
  const [hsl, setHsl] = useState(() => hexToHsl(value))
  useEffect(() => { setHsl(hexToHsl(value)) }, [value])
  const color = useMemo(() => hslToHex(hsl.h, hsl.s, hsl.l), [hsl])
  const update = (next: Partial<typeof hsl>) => {
    const result = { ...hsl, ...next }
    setHsl(result)
    onChange(hslToHex(result.h, result.s, result.l))
  }
  return (
    <View style={styles.container}>
      <View style={styles.heading}><Text size={13}>{label}</Text><View style={[styles.preview, { backgroundColor: color, borderColor: theme['c-border-background'] }]} /></View>
      <View style={styles.presets}>{presets.map(item => <View key={item} style={styles.presetWrap}><View onTouchEnd={() => { onChange(item) }} style={[styles.preset, { backgroundColor: item, borderColor: item == color ? theme['c-font'] : 'transparent' }]} /></View>)}</View>
      <LinearGradient colors={hueColors} style={styles.gradient} />
      <Slider value={hsl.h} minimumValue={0} maximumValue={360} step={1} minimumTrackTintColor="transparent" maximumTrackTintColor="transparent" thumbTintColor={color} onValueChange={h => { update({ h }) }} />
      <LinearGradient colors={['#FFFFFF', hslToHex(hsl.h, 1, 0.5)]} style={styles.gradient} />
      <Slider value={hsl.s} minimumValue={0} maximumValue={1} step={0.01} minimumTrackTintColor="transparent" maximumTrackTintColor="transparent" thumbTintColor={color} onValueChange={s => { update({ s: clamp(s) }) }} />
      <LinearGradient colors={['#000000', hslToHex(hsl.h, hsl.s, 0.5), '#FFFFFF']} style={styles.gradient} />
      <Slider value={hsl.l} minimumValue={0} maximumValue={1} step={0.01} minimumTrackTintColor="transparent" maximumTrackTintColor="transparent" thumbTintColor={color} onValueChange={l => { update({ l: clamp(l) }) }} />
    </View>
  )
}

const styles = createStyle({
  container: { paddingLeft: 25, marginBottom: 8 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  preview: { width: 22, height: 22, borderRadius: 11, borderWidth: 1 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 5 },
  presetWrap: { padding: 3 },
  preset: { width: 23, height: 23, borderRadius: 12, borderWidth: 2 },
  gradient: { height: 9, borderRadius: 5, marginTop: 4, marginRight: 18 },
})
