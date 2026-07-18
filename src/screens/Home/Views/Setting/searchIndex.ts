import type { SettingScreenIds } from './Main'

export const settingKeywords: Record<SettingScreenIds, string[]> = {
  basic: ['基础', '语言', '字体', '分享', '启动', '状态栏', '文件选择器', '返回桌面', '退出'],
  appearance: ['界面', '外观', '主题', '主题颜色', '页面背景', '背景图', '图片链接', '渐变', '调色盘', '透明度', '玻璃', '播放栏', '胶囊', '封面', '动画', '底部导航', '导航栏', '歌词颜色', '播放页歌词', '当前歌词', '当前歌词颜色', '普通歌词', '译文颜色', '背景预览', '横屏'],
  player: ['播放', '歌词显示', '翻译', 'ai', '模型', '非流式', '音质', '缓存', '蓝牙', '音频焦点', '通知栏', '当前列表', '定时退出'],
  lyric_desktop: ['桌面歌词', '悬浮歌词', '字体', '透明度', '锁定'],
  search: ['搜索', '热搜', '历史'],
  list: ['列表', '歌单', '专辑', '歌曲时长'],
  sync_backup: ['同步', '备份', '恢复', '导入', '导出', '历史记录'],
  other: ['其他', '缓存', '日志', '屏蔽'],
  version: ['版本', '更新'],
  about: ['关于', '反馈'],
}

export const matchSettingGroups = (query: string, getTitle: (id: SettingScreenIds) => string) => {
  const tokens = query.trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean)
  if (!tokens.length) return []
  return (Object.keys(settingKeywords) as SettingScreenIds[]).filter(id => {
    const text = [getTitle(id), ...settingKeywords[id]].join(' ').toLocaleLowerCase()
    return tokens.every(token => text.includes(token))
  })
}
