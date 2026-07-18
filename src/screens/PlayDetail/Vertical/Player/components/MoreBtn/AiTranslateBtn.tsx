import { useRef, useState } from 'react'
import Btn from './Btn'
import { translateCurrentLyric } from '@/core/aiLyric'
import { aiLyricStore, type AiLyricMode } from '@/plugins/aiLyric'
import { toast } from '@/utils/tools'
import AiTranslatePopup, { type AiTranslatePopupType } from './AiTranslatePopup'
import { TranslateIcon } from '@/components/common/CustomIcons'
import { useTheme } from '@/store/theme/hook'

export default () => {
  const [translating, setTranslating] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)
  const popupRef = useRef<AiTranslatePopupType>(null)
  const theme = useTheme()

  const translate = (mode?: AiLyricMode) => {
    if (translating) {
      controllerRef.current?.abort()
      toast('正在取消 AI 翻译')
      return
    }

    setTranslating(true)
    const controller = new AbortController()
    controllerRef.current = controller
    void Promise.all([
      aiLyricStore.getProviders(),
      aiLyricStore.getPreferences(),
    ]).then(async([providers, preferences]) => {
      const providerId = preferences.providerId || providers[0]?.id
      if (!providerId) throw new Error('请先在播放器设置中保存 AI 服务商')
      toast('AI 翻译中，再次点击可取消')
      return translateCurrentLyric({
        providerId,
        sourceLanguage: preferences.sourceLanguage,
        targetLanguage: preferences.targetLanguage,
        mode: mode ?? preferences.mode,
        stream: preferences.stream,
        signal: controller.signal,
      })
    }).then(result => {
      toast(result.cached ? '已使用歌词翻译缓存' : 'AI 歌词翻译完成')
    }).catch(error => {
      if (controller.signal.aborted) toast('AI 翻译已取消')
      else toast(error instanceof Error ? error.message : 'AI 翻译失败，请重试')
    }).finally(() => {
      controllerRef.current = null
      setTranslating(false)
    })
  }

  return (
    <>
      <Btn
        onPress={() => { popupRef.current?.show() }}
        onLongPress={() => { translate('overwrite') }}
      ><TranslateIcon size={24} color={theme['c-font-label']} /></Btn>
      <AiTranslatePopup ref={popupRef} />
    </>
  )
}
