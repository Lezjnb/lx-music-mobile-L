import { StyleSheet, View, type ViewProps } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'

const withOpacity = (color: string, opacity: number) => {
  if (color.startsWith('rgba(')) return color.replace(/,\s*[^,]+\)$/, `, ${opacity})`)
  if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`)
  return color
}

interface GlassSurfaceProps extends ViewProps {
  /**
   * Android 的 elevation 会按照 View 边界投射矩形阴影。
   * 胶囊等需要严格裁剪轮廓的场景应关闭它。
   */
  disableShadow?: boolean
}

export default ({ style, children, disableShadow = false, ...props }: GlassSurfaceProps) => {
  const theme = useTheme()
  const enabled = useSettingValue('ui.glass.enabled')
  const opacity = useSettingValue('ui.glass.opacity') / 100
  const borderOpacity = useSettingValue('ui.glass.borderOpacity') / 100
  const shadow = useSettingValue('ui.glass.shadow')
  const surfaceStyle = enabled
    ? {
        backgroundColor: withOpacity(theme['c-main-background'], opacity),
        borderColor: withOpacity(theme['c-font'], borderOpacity),
        borderWidth: StyleSheet.hairlineWidth,
        elevation: disableShadow ? 0 : Math.round(shadow / 3),
        shadowColor: '#000',
        shadowOpacity: disableShadow || !shadow ? 0 : 0.16,
        shadowRadius: disableShadow ? 0 : shadow,
        shadowOffset: { width: 0, height: disableShadow ? 0 : Math.max(1, Math.round(shadow / 3)) },
      }
    : { backgroundColor: theme['c-content-background'], elevation: 0, shadowOpacity: 0 }

  return <View {...props} style={[surfaceStyle, style]}>{children}</View>
}
