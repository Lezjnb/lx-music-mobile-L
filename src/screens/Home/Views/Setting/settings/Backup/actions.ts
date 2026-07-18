import { LIST_IDS, storageDataPrefix } from '@/config/constant'
import { createList, getListMusics, overwriteList, overwriteListFull, overwriteListMusics } from '@/core/list'
import { replaceSetting } from '@/core/common'
import { applyTheme } from '@/core/theme'
import { setApiSource } from '@/core/apiSource'
import { hideDesktopLyric, showDesktopLyric, showRemoteLyric } from '@/core/desktopLyric'
import { toggleRoma, toggleTranslation } from '@/core/lyric'
import { setUserApiList } from '@/core/userApi'
import { filterMusicList, fixNewMusicInfoQuality, toNewMusicInfo } from '@/utils'
import { log } from '@/utils/log'
import { confirmDialog, handleReadFile, handleSaveFile, showImportTip, toast } from '@/utils/tools'
import listState from '@/store/list/state'
import { getUserApiList, getUserApiScript, getUserTheme } from '@/utils/data'
import { removeDataMultiple, saveDataMultiple } from '@/plugins/storage'
import { aiLyricStore } from '@/plugins/aiLyric'
import { exportPageBackgrounds, replacePageBackgrounds } from '@/plugins/pageBackground'
import { getTheme, replaceUserThemes } from '@/theme/themes'
import settingState from '@/store/setting/state'
import { setLanguage as applyLanguage } from '@/lang/i18n'
import { setPlaybackRate, setVolume } from '@/plugins/player'


const getAllLists = async() => {
  const lists = []
  lists.push(await getListMusics(listState.defaultList.id).then(musics => ({ ...listState.defaultList, list: musics })))
  lists.push(await getListMusics(listState.loveList.id).then(musics => ({ ...listState.loveList, list: musics })))

  for await (const list of listState.userList) {
    lists.push(await getListMusics(list.id).then(musics => ({ ...list, list: musics })))
  }

  return lists
}
const importOldListData = async(lists: any[]) => {
  const allLists = await getAllLists()
  for (const list of lists) {
    try {
      const targetList = allLists.find(l => l.id == list.id)
      if (targetList) {
        targetList.list = filterMusicList((list.list as any[]).map(m => toNewMusicInfo(m)))
      } else {
        const listInfo = {
          name: list.name,
          id: list.id,
          list: filterMusicList((list.list as any[]).map(m => toNewMusicInfo(m))),
          source: list.source,
          sourceListId: list.sourceListId,
          locationUpdateTime: list.locationUpdateTime ?? null,
        }
        allLists.push(listInfo as LX.List.UserListInfoFull)
      }
    } catch (err) {
      console.log(err)
    }
  }
  const defaultList = allLists.shift()!.list
  const loveList = allLists.shift()!.list
  await overwriteListFull({ defaultList, loveList, userList: allLists as LX.List.UserListInfoFull[] })
}
const importNewListData = async(lists: Array<LX.List.MyDefaultListInfoFull | LX.List.MyLoveListInfoFull | LX.List.UserListInfoFull>) => {
  const allLists = await getAllLists()
  for (const list of lists) {
    try {
      const targetList = allLists.find(l => l.id == list.id)
      if (targetList) {
        targetList.list = filterMusicList(list.list).map(m => fixNewMusicInfoQuality(m))
      } else {
        const data = {
          name: list.name,
          id: list.id,
          list: filterMusicList(list.list).map(m => fixNewMusicInfoQuality(m)),
          source: (list as LX.List.UserListInfoFull).source,
          sourceListId: (list as LX.List.UserListInfoFull).sourceListId,
          locationUpdateTime: (list as LX.List.UserListInfoFull).locationUpdateTime ?? null,
        }
        allLists.push(data as LX.List.UserListInfoFull)
      }
    } catch (err) {
      console.log(err)
    }
  }
  const defaultList = allLists.shift()!.list
  const loveList = allLists.shift()!.list
  await overwriteListFull({ defaultList, loveList, userList: allLists as LX.List.UserListInfoFull[] })
}

/**
 * 导入单个列表
 * @param listData
 * @param position
 * @returns
 */
export const handleImportListPart = async(listData: LX.ConfigFile.MyListInfoPart['data'], position: number = listState.userList.length) => {
  const targetList = listState.allList.find(l => l.id === listData.id)
  if (targetList) {
    const confirm = await confirmDialog({
      message: global.i18n.t('list_import_part_confirm', { importName: listData.name, localName: targetList.name }),
      cancelButtonText: global.i18n.t('list_import_part_button_cancel'),
      confirmButtonText: global.i18n.t('list_import_part_button_confirm'),
      bgClose: false,
    })
    if (confirm) {
      listData.name = targetList.name
      void overwriteList(listData).then(() => {
        toast(global.i18n.t('setting_backup_part_import_list_tip_success'))
      }).catch((err) => {
        log.error(err)
        toast(global.i18n.t('setting_backup_part_import_list_tip_error'))
      })
      return
    }
    listData.id += `__${Date.now()}`
  }
  const userList = listData as LX.List.UserListInfoFull
  void createList({
    name: userList.name,
    id: userList.id,
    list: userList.list,
    source: userList.source,
    sourceListId: userList.sourceListId,
    position: Math.max(position, -1),
  }).then(() => {
    toast(global.i18n.t('setting_backup_part_import_list_tip_success'))
  }).catch((err) => {
    log.error(err)
    toast(global.i18n.t('setting_backup_part_import_list_tip_error'))
  })
}

const showConfirm = async() => {
  return confirmDialog({
    message: global.i18n.t('list_import_part_confirm_tip'),
    cancelButtonText: global.i18n.t('dialog_cancel'),
    confirmButtonText: global.i18n.t('confirm_button_text'),
    bgClose: false,
  })
}
const importPlayList = async(path: string) => {
  let configData: any
  try {
    configData = await handleReadFile(path)
  } catch (error: any) {
    log.error(error.stack)
    throw error
  }

  switch (configData.type) {
    case 'defautlList': // 兼容0.6.2及以前版本的列表数据
      if (!await showConfirm()) return true
      await overwriteListMusics(LIST_IDS.DEFAULT, filterMusicList((configData.data as LX.List.MyDefaultListInfoFull).list.map(m => toNewMusicInfo(m))))
      break
    case 'playList':
      if (!await showConfirm()) return true
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await importOldListData(configData.data)
      break
    case 'playList_v2':
      if (!await showConfirm()) return true
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await importNewListData(configData.data)
      break
    case 'allData':
      if (!await showConfirm()) return true
      // 兼容0.6.2及以前版本的列表数据
      if (configData.defaultList) await overwriteListMusics(LIST_IDS.DEFAULT, filterMusicList((configData.defaultList as LX.List.MyDefaultListInfoFull).list.map(m => toNewMusicInfo(m))))
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      else await importOldListData(configData.playList)
      break
    case 'allData_v2':
      if (!await showConfirm()) return true
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await importNewListData(configData.playList)
      break
    case 'playListPart':
      configData.data.list = filterMusicList((configData.data as LX.ConfigFile.MyListInfoPart['data']).list.map(m => toNewMusicInfo(m)))
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      void handleImportListPart(configData.data)
      return true
    case 'playListPart_v2':
      configData.data.list = filterMusicList((configData.data as LX.ConfigFile.MyListInfoPart['data']).list).map(m => fixNewMusicInfoQuality(m))
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      void handleImportListPart(configData.data)
      return true
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    default: showImportTip(configData.type)
  }
}

export const handleImportList = (path: string) => {
  console.log(path)
  toast(global.i18n.t('setting_backup_part_import_list_tip_unzip'))
  void importPlayList(path).then((skipTip) => {
    if (skipTip) return
    toast(global.i18n.t('setting_backup_part_import_list_tip_success'))
  }).catch((err) => {
    log.error(err)
    toast(global.i18n.t('setting_backup_part_import_list_tip_error'))
  })
}


const exportAllList = async(path: string) => {
  const data = JSON.parse(JSON.stringify({
    type: 'playList_v2',
    data: await getAllLists(),
  }))

  try {
    await handleSaveFile(path + '/lx_list.lxmc', data)
  } catch (error: any) {
    log.error(error.stack)
  }
}
export const handleExportList = (path: string) => {
  toast(global.i18n.t('setting_backup_part_export_list_tip_zip'))
  void exportAllList(path).then(() => {
    toast(global.i18n.t('setting_backup_part_export_list_tip_success'))
  }).catch((err: any) => {
    log.error(err.message)
    toast(global.i18n.t('setting_backup_part_export_list_tip_failed') + ': ' + (err.message as string))
  })
}

interface SettingsBackup {
  type: 'setting_v3'
  version: 3
  setting: Partial<LX.AppSetting>
  themes: LX.Theme[]
  userApis: Array<{ info: LX.UserApi.UserApiInfo, script: string }>
  ai: unknown
  pageBackgrounds: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value == 'object' && !Array.isArray(value)
const isSettingsBackup = (value: unknown): value is SettingsBackup => {
  if (!isRecord(value) || value.type != 'setting_v3' || value.version != 3) return false
  return isRecord(value.setting) && Array.isArray(value.themes) && Array.isArray(value.userApis)
}
const cloneThemeForBackup = (theme: LX.Theme): LX.Theme => {
  const copy = JSON.parse(JSON.stringify(theme)) as LX.Theme
  const image = copy.config.extInfo['bg-image']
  if (image && !/^https:\/\//iu.test(image)) copy.config.extInfo['bg-image'] = ''
  return copy
}
const getSettingsBackup = async(): Promise<SettingsBackup> => {
  const userApis = await getUserApiList()
  const [themes, scripts, ai, pageBackgrounds] = await Promise.all([
    getUserTheme(),
    Promise.all(userApis.map(async info => ({ info, script: await getUserApiScript(info.id) }))),
    aiLyricStore.exportData(false),
    exportPageBackgrounds(),
  ])
  return {
    type: 'setting_v3',
    version: 3,
    setting: { ...settingState.setting },
    themes: themes.map(cloneThemeForBackup),
    userApis: scripts,
    ai: JSON.parse(ai),
    pageBackgrounds,
  }
}
const replaceUserApis = async(userApis: SettingsBackup['userApis']) => {
  const current = await getUserApiList()
  await removeDataMultiple(current.map(info => `${storageDataPrefix.userApi}${info.id}`))
  const next = userApis
    .filter((item): item is SettingsBackup['userApis'][number] => isRecord(item) && isRecord(item.info) && typeof item.info.id == 'string' && typeof item.script == 'string')
    .map(item => ({ info: item.info, script: item.script }))
  await saveDataMultiple([
    [storageDataPrefix.userApi, next.map(item => item.info)],
    ...next.map(item => [`${storageDataPrefix.userApi}${item.info.id}`, item.script] as [string, string]),
  ])
  setUserApiList(await getUserApiList())
}
const importSettingsData = async(path: string) => {
  const data = await handleReadFile<unknown>(path)
  if (!isSettingsBackup(data)) throw new Error(global.i18n.t('setting_backup_setting_invalid'))
  const confirm = await confirmDialog({
    message: global.i18n.t('setting_backup_setting_import_warning'),
    cancelButtonText: global.i18n.t('dialog_cancel'),
    confirmButtonText: global.i18n.t('confirm_button_text'),
    bgClose: false,
  })
  if (!confirm) return true

  const setting = await replaceSetting(data.setting)
  await Promise.all([
    replaceUserThemes(data.themes.map(cloneThemeForBackup)),
    replaceUserApis(data.userApis),
    aiLyricStore.replaceData(JSON.stringify(data.ai)),
    replacePageBackgrounds(data.pageBackgrounds),
  ])
  applyTheme(await getTheme())
  if (setting['common.langId'] && global.i18n.availableLocales.includes(setting['common.langId'])) applyLanguage(setting['common.langId'])
  await Promise.all([
    setPlaybackRate(setting['player.playbackRate']),
    setVolume(setting['player.volume']),
    toggleTranslation(setting['player.isShowLyricTranslation']),
    toggleRoma(setting['player.isShowLyricRoma']),
  ])
  void (setting['desktopLyric.enable'] ? showDesktopLyric() : hideDesktopLyric()).catch(() => {})
  void showRemoteLyric(setting['player.isShowBluetoothLyric']).catch(() => {})
  setApiSource(setting['common.apiSource'])
  toast(global.i18n.t('setting_backup_setting_import_success'))
  return false
}
const exportSettingsData = async(path: string) => {
  await handleSaveFile(path + '/lx_settings_v3.lxmc', await getSettingsBackup())
}
export const handleImportSettings = (path: string) => {
  toast(global.i18n.t('setting_backup_part_import_list_tip_unzip'))
  void importSettingsData(path).catch(err => {
    log.error(err)
    toast(global.i18n.t('setting_backup_setting_import_error') + ': ' + (err.message as string))
  })
}
export const handleExportSettings = (path: string) => {
  void exportSettingsData(path).then(() => {
    toast(global.i18n.t('setting_backup_setting_export_success'))
  }).catch(err => {
    log.error(err)
    toast(global.i18n.t('setting_backup_setting_export_error') + ': ' + (err.message as string))
  })
}
