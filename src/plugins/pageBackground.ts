import { getData, saveData } from './storage'
import { updateSetting } from '@/core/common'

const STORAGE_KEY = '@page_background_v1'

export const PAGE_BACKGROUND_IDS = ['search', 'songlist', 'leaderboard', 'mylist', 'setting', 'playDetail'] as const
export type PageBackgroundId = typeof PAGE_BACKGROUND_IDS[number]
export type GradientDirection = 'topBottom' | 'leftRight' | 'topLeftBottomRight' | 'topRightBottomLeft'

export interface PageBackgroundConfig {
  imageUri: string
  imageOpacity: number
  gradientStart: string
  gradientEnd: string
  gradientOpacity: number
  gradientDirection: GradientDirection
}

export const defaultPageBackground: PageBackgroundConfig = {
  imageUri: '',
  imageOpacity: 100,
  gradientStart: '#000000',
  gradientEnd: '#000000',
  gradientOpacity: 0,
  gradientDirection: 'topBottom',
}

type PageBackgroundMap = Partial<Record<PageBackgroundId, PageBackgroundConfig>>

export const getPageBackgrounds = async() => await getData<PageBackgroundMap>(STORAGE_KEY) ?? {}

export const savePageBackground = async(ids: PageBackgroundId[], config: PageBackgroundConfig) => {
  const backgrounds = await getPageBackgrounds()
  for (const id of ids) backgrounds[id] = { ...config }
  await saveData(STORAGE_KEY, backgrounds)
  updateSetting({ 'ui.pageBackgroundVersion': Date.now() })
}

export const resetPageBackground = async(ids: PageBackgroundId[]) => {
  const backgrounds = await getPageBackgrounds()
  for (const id of ids) delete backgrounds[id]
  await saveData(STORAGE_KEY, backgrounds)
  updateSetting({ 'ui.pageBackgroundVersion': Date.now() })
}
