import { aiLyricStore, type AiLyricLanguage, type AiLyricMode } from '@/plugins/aiLyric'
import playerState from '@/store/player/state'
import { setLyric } from '@/core/lyric'

export const translateCurrentLyric = async(options: {
  providerId: string
  sourceLanguage: AiLyricLanguage
  targetLanguage: AiLyricLanguage
  mode: AiLyricMode
  model?: string
  stream?: boolean
  signal?: AbortSignal
  onDelta?: (text: string) => void
}) => {
  const music = playerState.musicInfo
  if (!music.id || !music.lrc) throw new Error('当前没有可翻译的歌词')
  const result = await aiLyricStore.translate({
    songId: music.id,
    lyric: music.lrc,
    providerId: options.providerId,
    model: options.model,
    sourceLanguage: options.sourceLanguage,
    targetLanguage: options.targetLanguage,
    mode: options.mode,
    stream: options.stream,
    signal: options.signal,
    onDelta: options.onDelta,
  })
  const previous = music.tlrc ?? ''
  music.tlrc = options.mode == 'append' && previous ? `${previous}\n${result.lyric}` : result.lyric
  await setLyric()
  return result
}

/**
 * 在线/本地歌词重新加载后恢复相同原歌词对应的最近一次 AI 译文。
 * AI 译文始终保存在独立缓存中，不会改写原始歌词缓存。
 */
export const restoreAiLyricTranslation = async(songId: string, lyric: string, officialTranslation = '') => {
  if (!songId || !lyric) return officialTranslation
  const cached = await aiLyricStore.getLatestCache(songId, lyric)
  if (!cached) return officialTranslation
  if (cached.writeMode == 'append' && officialTranslation) return `${officialTranslation}\n${cached.lyric}`
  return cached.lyric
}
