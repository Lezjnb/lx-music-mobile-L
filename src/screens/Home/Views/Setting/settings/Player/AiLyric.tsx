import { useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import DorpDownMenu from '@/components/common/DorpDownMenu'
import Input from '@/components/common/Input'
import Text from '@/components/common/Text'
import SubTitle from '../../components/SubTitle'
import Button from '../../components/Button'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import {
  aiLyricStore,
  AI_LYRIC_LANGUAGES,
  type AiLyricLanguage,
  type AiLyricMode,
  type AiProvider,
  type AiProtocol,
} from '@/plugins/aiLyric'
import { toast, createStyle } from '@/utils/tools'

interface SelectOption {
  action: string
  label: string
}
interface Form {
  name: string
  baseUrl: string
  apiKey: string
  model: string
  protocol: AiProtocol
}

const empty: Form = {
  name: 'sensenova',
  baseUrl: 'https://token.sensenova.cn/v1',
  apiKey: '',
  model: '',
  protocol: 'openai-chat-completions',
}
const protocolOptions: SelectOption[] = [
  { action: 'openai-chat-completions', label: 'OpenAI Chat Completions' },
]

const SelectMenu = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}) => {
  const text = options.find(option => option.action == value)?.label ?? value
  return (
    <View style={styles.selectRow}>
      <Text size={13} style={styles.selectLabel}>{label}</Text>
      <DorpDownMenu menus={options} activeId={value} onPress={({ action }) => { onChange(action) }} btnStyle={styles.selectButton}>
        <Text numberOfLines={1} size={13}>{text}</Text>
      </DorpDownMenu>
    </View>
  )
}

export default () => {
  const clearCacheAlertRef = useRef<ConfirmAlertType>(null)
  const [providers, setProviders] = useState<AiProvider[]>([])
  const [form, setForm] = useState<Form>(empty)
  const [models, setModels] = useState<string[]>([])
  const [cacheCount, setCacheCount] = useState(0)
  const [providerId, setProviderId] = useState('')
  const [sourceLanguage, setSourceLanguage] = useState<AiLyricLanguage>('auto')
  const [targetLanguage, setTargetLanguage] = useState<AiLyricLanguage>('zh-CN')
  const [mode, setMode] = useState<AiLyricMode>('append')
  const [loadingModels, setLoadingModels] = useState(false)

  const providerOptions = useMemo(() => providers.map(provider => ({
    action: provider.id,
    label: `${provider.name} · ${provider.activeModel}`,
  })), [providers])
  const modelOptions = useMemo(() => models.map(model => ({ action: model, label: model })), [models])
  const languageOptions = useMemo(() => AI_LYRIC_LANGUAGES.map(([action, label]) => ({ action, label })), [])
  const modeOptions = useMemo(() => [
    { action: 'append', label: '新增 AI 译文并保留原译文' },
    { action: 'overwrite', label: '覆盖原译文' },
  ], [])

  const refresh = () => {
    void Promise.all([
      aiLyricStore.getProviders(),
      aiLyricStore.listCache(),
      aiLyricStore.getPreferences(),
    ]).then(([nextProviders, cache, preferences]) => {
      setProviders(nextProviders)
      setCacheCount(cache.length)
      setProviderId(preferences.providerId || nextProviders[0]?.id || '')
      setSourceLanguage(preferences.sourceLanguage)
      setTargetLanguage(preferences.targetLanguage)
      setMode(preferences.mode)
    })
  }

  useEffect(refresh, [])

  const save = () => {
    if (!form.name || !form.baseUrl || !form.apiKey || !form.model) {
      toast('请填写服务商名称、Base URL、API Key 与模型')
      return
    }
    void aiLyricStore.upsertProvider({
      name: form.name,
      baseUrl: form.baseUrl,
      apiKey: form.apiKey,
      models: models.length ? models : [form.model],
      activeModel: form.model,
      enabled: true,
      protocol: form.protocol,
      timeoutMs: 45_000,
    }).then(provider => {
      setForm(empty)
      setModels([])
      setProviderId(provider.id)
      void aiLyricStore.savePreferences({ providerId: provider.id })
      refresh()
      toast('AI 服务商已保存')
    }).catch(error => { toast(error instanceof Error ? error.message : '保存服务商失败') })
  }

  const fetchModels = () => {
    if (!form.baseUrl || !form.apiKey) {
      toast('请先填写 Base URL 与 API Key')
      return
    }
    setLoadingModels(true)
    void aiLyricStore.fetchModels(form).then(nextModels => {
      setModels(nextModels)
      setForm(value => ({ ...value, model: value.model || nextModels[0] }))
      toast(`已获取 ${nextModels.length} 个模型`)
    }).catch(error => { toast(error instanceof Error ? error.message : '获取模型失败') }).finally(() => { setLoadingModels(false) })
  }

  const test = () => {
    const provider = providers.find(item => item.id == providerId) ?? providers[0]
    if (!provider) {
      toast('请先保存 AI 服务商')
      return
    }
    void aiLyricStore.translate({
      songId: '__ai_lyric_test__',
      lyric: 'Hello, music.',
      providerId: provider.id,
      sourceLanguage: 'en',
      targetLanguage: 'zh-CN',
    }).then(() => { toast('连接测试成功') }).catch(error => { toast(error instanceof Error ? error.message : '连接测试失败') })
  }

  const updatePreferences = (value: Partial<{
    providerId: string
    sourceLanguage: AiLyricLanguage
    targetLanguage: AiLyricLanguage
    mode: AiLyricMode
  }>) => {
    void aiLyricStore.savePreferences(value).catch(error => { toast(error instanceof Error ? error.message : '保存翻译偏好失败') })
  }

  return (
    <SubTitle title="AI 歌词翻译">
      <Text size={12} style={styles.note}>密钥只由 AI 数据层读取并保存在本机；应用界面不会读取或显示已保存的密钥。</Text>
      <SelectMenu label="协议" value={form.protocol} options={protocolOptions} onChange={protocol => { setForm(value => ({ ...value, protocol: protocol as AiProtocol })) }} />
      <Input value={form.name} placeholder="AI 厂商名称" onChangeText={name => { setForm(value => ({ ...value, name })) }} style={styles.input} />
      <Input value={form.baseUrl} placeholder="HTTPS Base URL" autoCapitalize="none" onChangeText={baseUrl => { setForm(value => ({ ...value, baseUrl })) }} style={styles.input} />
      <Input value={form.apiKey} placeholder="API Key（新建时必填）" secureTextEntry autoCapitalize="none" onChangeText={apiKey => { setForm(value => ({ ...value, apiKey })) }} style={styles.input} />
      <Input value={form.model} placeholder="模型 ID，也可先获取模型" autoCapitalize="none" onChangeText={model => { setForm(value => ({ ...value, model })) }} style={styles.input} />
      {modelOptions.length ? <SelectMenu label="选择模型" value={form.model} options={modelOptions} onChange={model => { setForm(value => ({ ...value, model })) }} /> : null}
      <View style={styles.row}>
        <Button disabled={loadingModels} onPress={fetchModels}>{loadingModels ? '获取中…' : '获取模型'}</Button>
        <Button onPress={save}>保存服务商</Button>
        <Button onPress={test}>测试连接</Button>
      </View>

      <Text size={12} style={styles.note}>播放页按钮会使用下面保存的默认服务商、语言和写入模式。轻点保留旧译文，长按覆盖旧译文。</Text>
      {providerOptions.length ? <SelectMenu label="默认服务商" value={providerId} options={providerOptions} onChange={id => {
        setProviderId(id)
        updatePreferences({ providerId: id })
      }} /> : null}
      <SelectMenu label="原歌词语言" value={sourceLanguage} options={languageOptions} onChange={language => {
        const value = language as AiLyricLanguage
        setSourceLanguage(value)
        updatePreferences({ sourceLanguage: value })
      }} />
      <SelectMenu label="目标语言" value={targetLanguage} options={languageOptions.filter(item => item.action != 'auto')} onChange={language => {
        const value = language as AiLyricLanguage
        setTargetLanguage(value)
        updatePreferences({ targetLanguage: value })
      }} />
      <SelectMenu label="默认写入方式" value={mode} options={modeOptions} onChange={nextMode => {
        const value = nextMode as AiLyricMode
        setMode(value)
        updatePreferences({ mode: value })
      }} />

      {providers.map(provider => (
        <View key={provider.id} style={styles.provider}>
          <Text>{provider.name} · {provider.activeModel}</Text>
          <Button onPress={() => { void aiLyricStore.removeProvider(provider.id).then(refresh) }}>删除</Button>
        </View>
      ))}
      <View style={styles.row}>
        <Button onPress={() => { clearCacheAlertRef.current?.setVisible(true) }}>删除所有 AI 歌词缓存（{cacheCount}）</Button>
        <Button onPress={() => { void aiLyricStore.exportData().then(data => { toast(`已导出 ${data.length} 字符配置数据`) }) }}>导出配置</Button>
      </View>
      <ConfirmAlert
        ref={clearCacheAlertRef}
        title="删除 AI 歌词缓存"
        text={`将删除全部 ${cacheCount} 条 AI 译文缓存。原始歌词、官方译文、下载歌词和已编辑歌词不会受影响。`}
        confirmText="确认删除"
        onConfirm={() => {
          void aiLyricStore.deleteCache().then(() => {
            refresh()
            toast('已删除所有 AI 歌词缓存')
          }).catch(error => { toast(error instanceof Error ? error.message : '删除 AI 歌词缓存失败') })
        }}
      />
    </SubTitle>
  )
}

const styles = createStyle({
  note: { marginBottom: 10, lineHeight: 17 },
  input: { marginBottom: 8, borderRadius: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  provider: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  selectRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  selectLabel: { width: 86 },
  selectButton: { flex: 1, padding: 9, borderRadius: 4, backgroundColor: 'rgba(127,127,127,0.15)' },
})
