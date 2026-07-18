import { getData, saveData } from './storage'

const CONFIG_KEY = '@ai_lyric_config_v1'
const SECRET_KEY = '@ai_lyric_secret_v1'

export const AI_LYRIC_LANGUAGES = [
  ['auto', '自动识别'], ['zh-CN', '中文（简体）'], ['en', '英文'], ['zh-HK', '粤语繁体'],
  ['nan-Hant', '闽南语汉字'], ['ja', '日文'], ['ko', '韩文'], ['fr', '法文'], ['de', '德文'],
] as const
export type AiLyricLanguage = typeof AI_LYRIC_LANGUAGES[number][0] | (string & {})
export type AiLyricMode = 'append' | 'overwrite'
export type AiProtocol = 'openai-chat-completions'
export interface AiProvider {
  id: string
  name: string
  protocol: AiProtocol
  baseUrl: string
  models: string[]
  activeModel: string
  enabled: boolean
  timeoutMs: number
}
export interface AiLyricPreferences {
  providerId: string
  sourceLanguage: AiLyricLanguage
  targetLanguage: AiLyricLanguage
  mode: AiLyricMode
  stream: boolean
  customLanguages: string[]
}
export interface AiLyricCache {
  key: string
  songId: string
  lyricHash: string
  sourceLanguage: AiLyricLanguage
  targetLanguage: AiLyricLanguage
  providerId: string
  model: string
  lyric: string
  createdAt: number
  /**
   * 该缓存最后一次写入播放器译文的方式；旧缓存缺失时按覆盖处理。
   */
  writeMode?: AiLyricMode
}
interface AiStore {
  providers: AiProvider[]
  cache: Record<string, AiLyricCache>
  preferences: AiLyricPreferences
}
type AiSecrets = Record<string, string>

const defaultPreferences = (): AiLyricPreferences => ({
  providerId: '',
  sourceLanguage: 'auto',
  targetLanguage: 'zh-CN',
  mode: 'append',
  stream: false,
  customLanguages: [],
})
const defaultStore = (): AiStore => ({ providers: [], cache: {}, preferences: defaultPreferences() })
const hash = (value: string) => {
  let n = 2166136261
  for (let i = 0; i < value.length; i++) n = Math.imul(n ^ value.charCodeAt(i), 16777619)
  return (n >>> 0).toString(36)
}
const load = async() => {
  const saved = await getData<Partial<AiStore>>(CONFIG_KEY)
  return {
    ...defaultStore(),
    ...saved,
    preferences: { ...defaultPreferences(), ...saved?.preferences },
  }
}
const save = async(store: AiStore) => { await saveData(CONFIG_KEY, store) }
const loadSecrets = async() => await getData<AiSecrets>(SECRET_KEY) ?? {}
const saveSecrets = async(secrets: AiSecrets) => { await saveData(SECRET_KEY, secrets) }
const languageLabel = (id: AiLyricLanguage) => AI_LYRIC_LANGUAGES.find(item => item[0] == id)?.[1] ?? id
const getSseContent = (body: string) => {
  let lyric = ''
  for (const line of body.split(/\r?\n/u)) {
    if (!line.startsWith('data:')) continue
    const data = line.slice(5).trim()
    if (!data || data == '[DONE]') continue
    try {
      const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string }, message?: { content?: string } }> }
      lyric += parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.message?.content ?? ''
    } catch {}
  }
  return lyric.trim()
}
const getResponseLyric = (body: string, contentType: string) => {
  const trimmed = body.trim()
  if (!trimmed) return ''
  if (contentType.includes('text/event-stream') || trimmed.startsWith('data:')) return getSseContent(trimmed)
  try {
    const data = JSON.parse(trimmed) as { choices?: Array<{ message?: { content?: string } }> }
    return data.choices?.[0]?.message?.content?.trim() ?? ''
  } catch {
    throw new Error(`AI 服务返回了无法识别的数据：${trimmed.slice(0, 120)}`)
  }
}

export const aiLyricStore = {
  async getProviders() { return (await load()).providers },
  async getPreferences() { return (await load()).preferences },
  async savePreferences(preferences: Partial<AiLyricPreferences>) {
    const store = await load()
    store.preferences = { ...store.preferences, ...preferences }
    await save(store)
    return store.preferences
  },
  async upsertProvider(provider: Omit<AiProvider, 'id'> & { id?: string, apiKey?: string }) {
    const store = await load()
    const id = provider.id ?? `ai_${Date.now().toString(36)}`
    const next: AiProvider = { ...provider, id, timeoutMs: provider.timeoutMs || 45_000 }
    const index = store.providers.findIndex(item => item.id == id)
    if (index < 0) store.providers.push(next)
    else store.providers[index] = next
    await save(store)
    if (provider.apiKey != null) {
      const secrets = await loadSecrets()
      secrets[id] = provider.apiKey
      await saveSecrets(secrets)
    }
    return next
  },
  async removeProvider(id: string) {
    const store = await load()
    store.providers = store.providers.filter(item => item.id != id)
    if (store.preferences.providerId == id) store.preferences.providerId = store.providers[0]?.id ?? ''
    await save(store)
    const secrets = await loadSecrets()
    delete secrets[id]
    await saveSecrets(secrets)
  },
  async fetchModels(provider: Pick<AiProvider, 'baseUrl'> & { apiKey: string }) {
    const baseUrl = provider.baseUrl.replace(/\/+$/, '').replace(/\/(chat\/completions|models)$/, '')
    const response = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${provider.apiKey}` },
    })
    if (!response.ok) throw new Error(`获取模型失败 (${response.status})`)
    const data = await response.json() as { data?: Array<{ id?: string }> }
    const models = (data.data ?? []).map(item => item.id).filter((id): id is string => !!id)
    if (!models.length) throw new Error('服务商未返回可用模型')
    return models
  },
  async exportData(includeCache = true) {
    const store = await load()
    const secrets = await loadSecrets()
    return JSON.stringify({ version: 1, providers: store.providers, secrets, preferences: store.preferences, cache: includeCache ? store.cache : {} })
  },
  async importData(value: string) {
    const data = JSON.parse(value) as Partial<{ providers: AiProvider[], secrets: AiSecrets, preferences: AiLyricPreferences, cache: Record<string, AiLyricCache> }>
    const store = await load()
    store.providers = data.providers ?? store.providers
    store.cache = { ...store.cache, ...(data.cache ?? {}) }
    store.preferences = { ...store.preferences, ...(data.preferences ?? {}) }
    await save(store)
    if (data.secrets) await saveSecrets(data.secrets)
  },
  async replaceData(value: string) {
    const data = JSON.parse(value) as Partial<{ providers: AiProvider[], secrets: AiSecrets, preferences: AiLyricPreferences }>
    if (data.providers != null && !Array.isArray(data.providers)) throw new Error('AI 翻译配置格式无效')
    const store = await load()
    store.providers = data.providers ?? []
    store.preferences = { ...defaultPreferences(), ...(data.preferences ?? {}) }
    await save(store)
    await saveSecrets(data.secrets ?? {})
  },
  cacheKey(input: Omit<AiLyricCache, 'key' | 'createdAt' | 'lyric'>) {
    return hash([input.songId, input.lyricHash, input.sourceLanguage, input.targetLanguage, input.providerId, input.model].join('|'))
  },
  async getCache(key: string) { return (await load()).cache[key] },
  async getLatestCache(songId: string, lyric: string) {
    const lyricHash = hash(lyric)
    return Object.values((await load()).cache)
      .filter(item => item.songId == songId && item.lyricHash == lyricHash)
      .sort((a, b) => b.createdAt - a.createdAt)[0]
  },
  async listCache() { return Object.values((await load()).cache).sort((a, b) => b.createdAt - a.createdAt) },
  async deleteCache(filter?: Partial<Pick<AiLyricCache, 'songId' | 'sourceLanguage' | 'targetLanguage'>>) {
    const store = await load()
    for (const [key, item] of Object.entries(store.cache)) {
      if (!filter || Object.entries(filter).every(([name, value]) => item[name as keyof AiLyricCache] == value)) delete store.cache[key]
    }
    await save(store)
  },
  async translate(input: {
    songId: string
    lyric: string
    sourceLanguage: AiLyricLanguage
    targetLanguage: AiLyricLanguage
    providerId: string
    model?: string
    mode?: AiLyricMode
    signal?: AbortSignal
    stream?: boolean
    onDelta?: (text: string) => void
  }) {
    const store = await load()
    const provider = store.providers.find(item => item.id == input.providerId && item.enabled)
    if (!provider) throw new Error('未找到已启用的 AI 服务商')
    const secrets = await loadSecrets()
    const apiKey = secrets[provider.id]
    if (!apiKey) throw new Error('该服务商未配置 API Key')
    const model = input.model ?? provider.activeModel
    const lyricHash = hash(input.lyric)
    const base = { songId: input.songId, lyricHash, sourceLanguage: input.sourceLanguage, targetLanguage: input.targetLanguage, providerId: provider.id, model }
    const key = this.cacheKey(base)
    const cached = store.cache[key]
    if (cached) {
      if (input.mode && cached.writeMode != input.mode) {
        cached.writeMode = input.mode
        await save(store)
      }
      return { lyric: cached.lyric, cached: true, key }
    }

    const controller = new AbortController()
    const timer = setTimeout(() => { controller.abort() }, provider.timeoutMs)
    input.signal?.addEventListener('abort', () => { controller.abort() }, { once: true })
    const url = `${provider.baseUrl.replace(/\/+$/, '').replace(/\/chat\/completions$/, '')}/chat/completions`
    try {
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          // React Native Android 的内置 fetch 不稳定地暴露 SSE 流；统一请求普通 JSON。
          stream: false,
          temperature: 0.2,
          messages: [
            { role: 'system', content: '你是歌词翻译器。保留每一行的顺序、空行、时间标签和标记；只输出翻译后的歌词，不要解释。' },
            { role: 'user', content: `将以下歌词从${languageLabel(input.sourceLanguage)}翻译为${languageLabel(input.targetLanguage)}：\n${input.lyric}` },
          ],
        }),
      })
      if (!response.ok) throw new Error(`AI 服务错误 (${response.status}): ${await response.text()}`)
      const responseText = await response.text()
      const lyric = getResponseLyric(responseText, response.headers.get('content-type') ?? '')
      if (!lyric) throw new Error('AI 服务未返回译文')
      store.cache[key] = { ...base, key, lyric, createdAt: Date.now(), writeMode: input.mode }
      await save(store)
      return { lyric, cached: false, key }
    } finally { clearTimeout(timer) }
  },
}
