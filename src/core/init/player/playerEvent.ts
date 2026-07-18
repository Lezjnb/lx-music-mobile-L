import { playNext, setMusicUrl } from '@/core/player/player'
import { setStatusText } from '@/core/player/playStatus'
import { getPosition, isEmpty, setStop } from '@/plugins/player'
import { isActive } from '@/utils/tools'
import BackgroundTimer from 'react-native-background-timer'
import playerState from '@/store/player/state'
import { setNowPlayTime } from '@/core/player/progress'


export default () => {
  let retryNum = 0
  let prevTimeoutId: string | null = null
  let lastHandledErrorOperation = -1
  let scheduledNextOperation = -1

  let loadingTimeout: number | null = null
  let delayNextTimeout: number | null = null
  const isCurrentOperation = (operationId: number, musicId?: string) => {
    return operationId == global.lx.playerOperationId &&
      (!musicId || musicId == playerState.playMusicInfo.musicInfo?.id)
  }
  const startLoadingTimeout = (operationId: number) => {
    clearLoadingTimeout()
    const musicId = playerState.playMusicInfo.musicInfo?.id
    loadingTimeout = BackgroundTimer.setTimeout(() => {
      loadingTimeout = null
      if (!musicId || global.lx.isPlayedStop || !isCurrentOperation(operationId, musicId)) return
      if (prevTimeoutId == playerState.musicInfo.id) {
        prevTimeoutId = null
        schedulePlayNext(operationId, musicId)
      } else {
        prevTimeoutId = playerState.musicInfo.id
        if (playerState.playMusicInfo.musicInfo) setMusicUrl(playerState.playMusicInfo.musicInfo, true)
      }
    }, 25000)
  }
  const clearLoadingTimeout = () => {
    if (!loadingTimeout) return
    // console.log('clear load timeout')
    BackgroundTimer.clearTimeout(loadingTimeout)
    loadingTimeout = null
  }

  const clearDelayNextTimeout = () => {
    // console.log(this.delayNextTimeout)
    if (!delayNextTimeout) return
    BackgroundTimer.clearTimeout(delayNextTimeout)
    delayNextTimeout = null
  }
  const schedulePlayNext = (operationId: number, musicId: string) => {
    if (scheduledNextOperation == operationId) return
    scheduledNextOperation = operationId
    clearDelayNextTimeout()
    delayNextTimeout = BackgroundTimer.setTimeout(() => {
      delayNextTimeout = null
      if (global.lx.isPlayedStop || !isCurrentOperation(operationId, musicId)) {
        setStatusText('')
        return
      }
      void playNext(true)
    }, 5000)
  }

  const handleLoadstart = (operationId = global.lx.playerOperationId) => {
    console.log('handleLoadstart', playerState.isPlay)
    if (global.lx.isPlayedStop || !playerState.isPlay || !isCurrentOperation(operationId)) return
    startLoadingTimeout(operationId)
    setStatusText(global.i18n.t('player__loading'))
  }

  // const handleLoadeddata = () => {
  //   setStatusText(global.i18n.t('player__loading'))
  // }

  // const handleCanplay = () => {
  //   setStatusText('')
  // }

  const handlePlaying = () => {
    setStatusText('')
    clearLoadingTimeout()
  }

  const handleEmpied = () => {
    clearDelayNextTimeout()
    clearLoadingTimeout()
  }

  const handleWating = () => {
    setStatusText(global.i18n.t('player__buffering'))
  }

  const handleError = (info?: { musicId?: string, operationId?: number, error?: unknown }) => {
    const operationId = info?.operationId ?? global.lx.playerOperationId
    const musicId = playerState.playMusicInfo.musicInfo?.id
    if (!musicId || !isCurrentOperation(operationId, musicId) || (info?.musicId && info.musicId != musicId)) return
    if (lastHandledErrorOperation == operationId) return
    lastHandledErrorOperation = operationId
    console.log('handle player error', { musicId, operationId, error: info?.error })
    clearLoadingTimeout()
    if (global.lx.isPlayedStop) return
    if (playerState.playMusicInfo.musicInfo && retryNum < 2) { // 若音频URL无效则尝试刷新2次URL
      let musicInfo = playerState.playMusicInfo.musicInfo
      void getPosition().then((position) => {
        if (position) setNowPlayTime(position)
      }).finally(() => {
        // console.log(this.retryNum)
        if (playerState.playMusicInfo.musicInfo !== musicInfo) return
        retryNum++
        setMusicUrl(playerState.playMusicInfo.musicInfo, true)
        setStatusText(global.i18n.t('player__refresh_url'))
      })
      return
    }
    if (!isEmpty()) void setStop()

    if (isActive()) {
      setStatusText(global.i18n.t('player__error'))
      schedulePlayNext(operationId, musicId)
    } else {
      console.warn('error skip to next')
      if (isCurrentOperation(operationId, musicId)) void playNext(true)
    }
  }

  const handleSetPlayInfo = () => {
    retryNum = 0
    prevTimeoutId = null
    lastHandledErrorOperation = -1
    scheduledNextOperation = -1
    clearDelayNextTimeout()
    clearLoadingTimeout()
  }

  // const handlePlayedStop = () => {
  //   clearDelayNextTimeout()
  //   clearLoadingTimeout()
  // }


  global.app_event.on('playerLoadstart', handleLoadstart)
  // global.app_event.on('playerLoadeddata', handleLoadeddata)
  // global.app_event.on('playerCanplay', handleCanplay)
  global.app_event.on('playerPlaying', handlePlaying)
  global.app_event.on('playerWaiting', handleWating)
  global.app_event.on('playerEmptied', handleEmpied)
  global.app_event.on('playerError', handleError)
  global.app_event.on('musicToggled', handleSetPlayInfo)
}
