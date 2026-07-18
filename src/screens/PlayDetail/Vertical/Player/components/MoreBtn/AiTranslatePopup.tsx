import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import Popup, { type PopupType } from '@/components/common/Popup'
import DorpDownMenu from '@/components/common/DorpDownMenu'
import Input from '@/components/common/Input'
import Text from '@/components/common/Text'
import Button from '@/screens/Home/Views/Setting/components/Button'
import { aiLyricStore, AI_LYRIC_LANGUAGES, type AiLyricLanguage, type AiLyricMode, type AiProvider } from '@/plugins/aiLyric'
import { translateCurrentLyric } from '@/core/aiLyric'
import { createStyle, toast } from '@/utils/tools'

export interface AiTranslatePopupType {
  show: () => void
}

const isLanguageCode = (value: string) => /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/u.test(value)

const Select = ({
  label,
  value,
  list,
  onChange,
}: {
  label: string
  value: string
  list: Array<{ action: string, label: string }>
  onChange: (value: string) => void
}) => (
  <View style={styles.row}>
    <Text size={13} style={styles.label}>{label}</Text>
    <DorpDownMenu menus={list} activeId={value} onPress={({ action }) => { onChange(action) }} btnStyle={styles.select}>
      <Text size={13} numberOfLines={1}>{list.find(item => item.action == value)?.label ?? value}</Text>
    </DorpDownMenu>
  </View>
)

export default forwardRef<AiTranslatePopupType>((props, ref) => {
  const popupRef = useRef<PopupType>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const [visible, setVisible] = useState(false)
  const [providers, setProviders] = useState<AiProvider[]>([])
  const [providerId, setProviderId] = useState('')
  const [model, setModel] = useState('')
  const [sourceLanguage, setSourceLanguage] = useState<AiLyricLanguage>('auto')
  const [targetLanguage, setTargetLanguage] = useState<AiLyricLanguage>('zh-CN')
  const [customLanguage, setCustomLanguage] = useState('')
  const [customLanguages, setCustomLanguages] = useState<string[]>([])
  const [mode, setMode] = useState<AiLyricMode>('append')
  const [stream, setStream] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const selectedProvider = providers.find(item => item.id == providerId)
  const providerOptions = useMemo(() => providers.map(item => ({ action: item.id, label: item.name })), [providers])
  const modelOptions = useMemo(() => (selectedProvider?.models ?? []).map(item => ({ action: item, label: item })), [selectedProvider])
  const languageOptions = useMemo(() => [
    ...AI_LYRIC_LANGUAGES.map(([action, label]) => ({ action, label })),
  ], [])
  const targetOptions = useMemo(() => [
    ...languageOptions.filter(item => item.action != 'auto'),
    ...customLanguages.filter(item => !languageOptions.some(language => language.action == item)).map(item => ({ action: item, label: `自定义：${item}` })),
  ], [customLanguages, languageOptions])

  const refresh = () => {
    void Promise.all([aiLyricStore.getProviders(), aiLyricStore.getPreferences()]).then(([nextProviders, preferences]) => {
      const enabled = nextProviders.filter(item => item.enabled)
      const nextProviderId = preferences.providerId || enabled[0]?.id || ''
      const provider = enabled.find(item => item.id == nextProviderId) ?? enabled[0]
      setProviders(enabled)
      setProviderId(provider?.id ?? '')
      setModel(provider?.models.includes(provider.activeModel) ? provider.activeModel : provider?.models[0] ?? '')
      setSourceLanguage(preferences.sourceLanguage)
      setTargetLanguage(preferences.targetLanguage)
      setCustomLanguages(preferences.customLanguages)
      setMode(preferences.mode)
      setStream(preferences.stream)
      setMessage(enabled.length ? '' : '请先在设置中保存并启用 AI 服务商')
    })
  }

  useEffect(() => {
    if (visible) refresh()
  }, [visible])

  useImperativeHandle(ref, () => ({
    show() {
      setVisible(true)
      requestAnimationFrame(() => { popupRef.current?.setVisible(true) })
    },
  }))

  const persist = () => {
    void aiLyricStore.savePreferences({ providerId, sourceLanguage, targetLanguage, mode, stream })
  }

  const start = () => {
    const finalTarget = customLanguage.trim() || targetLanguage
    if (!isLanguageCode(finalTarget)) {
      setMessage('自定义语言代码无效，例如 fr、es-ES、zh-Hant')
      return
    }
    if (!providerId || !model) {
      setMessage('请选择 AI 服务商和模型')
      return
    }
    setBusy(true)
    setMessage('正在翻译…')
    const controller = new AbortController()
    controllerRef.current = controller
    const saveCustomLanguage = async() => {
      if (!customLanguage.trim()) return
      const preferences = await aiLyricStore.getPreferences()
      const list = [finalTarget, ...preferences.customLanguages.filter(item => item != finalTarget)].slice(0, 8)
      await aiLyricStore.savePreferences({ customLanguages: list })
      setCustomLanguages(list)
    }
    void (async() => {
      try {
        await saveCustomLanguage()
        const result = await translateCurrentLyric({
          providerId,
          model,
          sourceLanguage,
          targetLanguage: finalTarget,
          mode,
          stream,
          signal: controller.signal,
        })
        toast(result.cached ? '已使用 AI 翻译缓存' : 'AI 歌词翻译完成')
        popupRef.current?.setVisible(false)
      } catch (error) {
        setMessage(controller.signal.aborted ? '已取消翻译，歌词保持原状' : error instanceof Error ? error.message : 'AI 翻译失败')
      } finally {
        controllerRef.current = null
        setBusy(false)
      }
    })()
  }

  const handleProvider = (id: string) => {
    const provider = providers.find(item => item.id == id)
    setProviderId(id)
    setModel(provider?.activeModel ?? provider?.models[0] ?? '')
    persist()
  }

  return (
    visible ? <Popup ref={popupRef} title="AI 翻译歌词" onHide={() => { setVisible(false) }} position="bottom">
      <ScrollView keyboardShouldPersistTaps="always" style={styles.scroll}>
        <View style={styles.content}>
          <Select label="AI 厂商" value={providerId} list={providerOptions} onChange={handleProvider} />
          <Select label="使用模型" value={model} list={modelOptions} onChange={value => { setModel(value) }} />
          <Select label="原歌词语言" value={sourceLanguage} list={languageOptions} onChange={value => { setSourceLanguage(value); persist() }} />
          <Select label="目标语言" value={targetLanguage} list={targetOptions} onChange={value => { setTargetLanguage(value); persist() }} />
          <Input value={customLanguage} placeholder="自定义 BCP-47（例如 fr、es-ES、zh-Hant）" onChangeText={setCustomLanguage} style={styles.input} />
          <Select label="写入方式" value={mode} list={[
            { action: 'append', label: '新增 AI 译文并保留原译文' },
            { action: 'overwrite', label: '覆盖原译文' },
          ]} onChange={value => { setMode(value as AiLyricMode); persist() }} />
          {message ? <Text size={12} style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            <Button onPress={() => {
              if (busy) controllerRef.current?.abort()
              else popupRef.current?.setVisible(false)
            }}>{busy ? '取消翻译' : '取消'}</Button>
            <Button disabled={busy} onPress={start}>{busy ? '翻译中…' : '开始翻译'}</Button>
          </View>
        </View>
      </ScrollView>
    </Popup> : null
  )
})

const styles = createStyle({
  scroll: { maxHeight: 520 },
  content: { paddingHorizontal: 15, paddingBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { width: 84 },
  select: { flex: 1, padding: 9, borderRadius: 4, backgroundColor: 'rgba(127,127,127,0.15)' },
  input: { marginBottom: 8, borderRadius: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 },
  message: { marginTop: 3, marginBottom: 8, lineHeight: 17 },
})
