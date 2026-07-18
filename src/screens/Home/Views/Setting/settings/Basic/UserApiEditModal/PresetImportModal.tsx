import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import Dialog, { type DialogType } from '@/components/common/Dialog'
import CheckBox from '@/components/common/CheckBox'
import Text from '@/components/common/Text'
import Button from '@/components/common/Button'
import { httpFetch } from '@/utils/request'
import { importPresetUserApi } from '@/core/userApi'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'

const PRESETS = [
  { id: 'sixyin', name: 'SixYin' },
  { id: 'huibq', name: 'Huibq' },
  { id: 'flower', name: 'Flower' },
  { id: 'lx', name: 'LX' },
  { id: 'ikun', name: 'ikun' },
  { id: 'grass', name: 'Grass' },
  { id: 'juhe', name: 'JuheApi' },
] as const
const origin = (id: string) => `https://raw.githubusercontent.com/pdone/lx-music-source/main/${id}/latest.js`
const accelerator = (id: string) => `https://ghproxy.net/raw.githubusercontent.com/pdone/lx-music-source/main/${id}/latest.js`

export interface PresetImportModalType {
  show: () => void
}

export default forwardRef<PresetImportModalType>((props, ref) => {
  const dialogRef = useRef<DialogType>(null)
  const theme = useTheme()
  const [visible, setVisible] = useState(false)
  const [selected, setSelected] = useState<string[]>(PRESETS.map(item => item.id))
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')

  useImperativeHandle(ref, () => ({
    show() {
      setVisible(true)
      setResult('')
      requestAnimationFrame(() => { dialogRef.current?.setVisible(true) })
    },
  }))

  const toggle = (id: string, checked: boolean) => {
    setSelected(list => checked ? [...new Set([...list, id])] : list.filter(item => item != id))
  }

  const importAll = () => {
    if (!selected.length) {
      setResult('请至少选择一个在线源')
      return
    }
    setBusy(true)
    setResult('正在下载并校验脚本…')
    void (async() => {
      const messages: string[] = []
      for (const preset of PRESETS.filter(item => selected.includes(item.id))) {
        let script = ''
        let importedFrom: 'origin' | 'accelerator' = 'accelerator'
        try {
          script = await httpFetch(accelerator(preset.id)).promise.then(resp => resp.body) as string
          if (!script || script.length > 9_000_000) throw new Error('加速链接脚本无效')
        } catch {
          importedFrom = 'origin'
          try {
            script = await httpFetch(origin(preset.id)).promise.then(resp => resp.body) as string
            if (!script || script.length > 9_000_000) throw new Error('原始链接脚本无效')
          } catch {
            messages.push(`${preset.name}：下载失败`)
            continue
          }
        }
        if (!script || script.length > 9_000_000) {
          messages.push(`${preset.name}：脚本无效或过大`)
          continue
        }
        try {
          await importPresetUserApi(script, {
            catalogId: preset.id,
            originUrl: origin(preset.id),
            acceleratorUrl: accelerator(preset.id),
            importedFrom,
            importedAt: Date.now(),
          })
          messages.push(`${preset.name}：已${importedFrom == 'accelerator' ? '经加速链接' : '回退原始链接'}导入`)
        } catch (error) {
          messages.push(`${preset.name}：${error instanceof Error ? error.message : '导入失败'}`)
        }
      }
      setResult(messages.join('\n'))
      toast('在线源导入完成')
      setBusy(false)
    })()
  }

  return visible ? (
    <Dialog ref={dialogRef} title="在线自定义源预设" onHide={() => { setVisible(false) }} bgHide={!busy} keyHide={!busy}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="always">
        <View style={styles.content}>
          <Text size={12} style={styles.tip}>远程脚本属于可执行代码。导入后不会自动启用，请在音源列表手动选择。</Text>
          {PRESETS.map(item => (
            <View key={item.id} style={styles.item}>
              <CheckBox check={selected.includes(item.id)} label={item.name} onChange={checked => { toggle(item.id, checked) }} />
              <Text size={11} color={theme['c-font-label']} numberOfLines={1}>原始：{origin(item.id)}</Text>
              <Text size={11} color={theme['c-font-label']} numberOfLines={1}>加速：{accelerator(item.id)}</Text>
            </View>
          ))}
          {result ? <Text size={12} style={styles.result}>{result}</Text> : null}
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <Button style={{ ...styles.button, backgroundColor: theme['c-button-background'] }} onPress={() => { dialogRef.current?.setVisible(false) }}>
          <Text color={theme['c-button-font']}>关闭</Text>
        </Button>
        <Button disabled={busy} style={{ ...styles.button, backgroundColor: theme['c-button-background'] }} onPress={importAll}>
          <Text color={theme['c-button-font']}>{busy ? '导入中…' : '确认导入'}</Text>
        </Button>
      </View>
    </Dialog>
  ) : null
})

const styles = createStyle({
  scroll: { maxHeight: 520 },
  content: { paddingHorizontal: 15, paddingTop: 10 },
  tip: { lineHeight: 17, marginBottom: 8 },
  item: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(127,127,127,0.2)' },
  result: { lineHeight: 18, marginTop: 10, marginBottom: 8 },
  actions: { flexDirection: 'row', padding: 15, justifyContent: 'flex-end' },
  button: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 4, marginLeft: 10 },
})
