import { httpGet } from '@/utils/request'
import { downloadFile, stopDownload, temporaryDirectoryPath } from '@/utils/fs'
import { getSupportedAbis, installApk } from '@/utils/nativeModules/utils'
import { APP_PROVIDER_NAME } from '@/config/constant'

const releaseApiUrl = 'https://api.github.com/repos/Lezjnb/lx-music-mobile-L/releases?per_page=30'

const abis = [
  'arm64-v8a',
  'armeabi-v7a',
  'x86_64',
  'x86',
  'universal',
]

const request = async(url, retryNum = 0) => {
  return new Promise((resolve, reject) => {
    httpGet(url, {
      timeout: 10000,
    }, (err, resp, body) => {
      if (err || resp.statusCode != 200) {
        ++retryNum >= 3
          ? reject(err || new Error(resp.statusMessage || resp.statusCode))
          : request(url, retryNum).then(resolve).catch(reject)
      } else resolve(body)
    })
  })
}

const getStableReleases = async() => {
  const releases = await request(releaseApiUrl)
  if (!Array.isArray(releases)) throw new Error('invalid GitHub release response')
  return releases.filter(release => !release.draft && !release.prerelease && typeof release.tag_name == 'string')
}

const getReleaseVersion = (release) => release.tag_name.replace(/^v/i, '')

let releasesPromise = null
const loadReleases = (force = false) => {
  if (force || !releasesPromise) releasesPromise = getStableReleases()
  return releasesPromise
}

export const getVersionInfo = async() => {
  const releases = await loadReleases(true)
  const latest = releases[0]
  if (!latest) throw new Error('release not found')
  return {
    version: getReleaseVersion(latest),
    desc: latest.body || latest.name || '',
    history: releases.slice(1).map(release => ({
      version: getReleaseVersion(release),
      desc: release.body || release.name || '',
    })),
  }
}

const getTargetAbi = async() => {
  const supportedAbis = await getSupportedAbis()
  for (const abi of abis) {
    if (supportedAbis.includes(abi)) return abi
  }
  return abis[abis.length - 1]
}
let downloadJobId = null
const noop = (total, download) => {}
let apkSavePath

export const downloadNewVersion = async(version, onDownload = noop) => {
  const abi = await getTargetAbi()
  const releases = await loadReleases()
  const release = releases.find(item => getReleaseVersion(item) == version)
  if (!release) throw new Error(`release v${version} not found`)
  const assets = Array.isArray(release.assets) ? release.assets : []
  const asset = assets.find(item => item.name?.endsWith(`-${abi}.apk`)) ??
    assets.find(item => item.name?.endsWith('-universal.apk')) ??
    assets.find(item => item.name?.endsWith('.apk'))
  if (!asset?.browser_download_url) throw new Error(`APK asset for ${abi} not found`)
  const url = asset.browser_download_url
  let savePath = temporaryDirectoryPath + '/lx-music-mobile.apk'

  if (downloadJobId) stopDownload(downloadJobId)

  const { jobId, promise } = downloadFile(url, savePath, {
    progressInterval: 500,
    connectionTimeout: 20000,
    readTimeout: 30000,
    begin({ statusCode, contentLength }) {
      onDownload(contentLength, 0)
      // switch (statusCode) {
      //   case 200:
      //   case 206:
      //     break
      //   default:
      //     onDownload(null, contentLength, 0)
      //     break
      // }
    },
    progress({ contentLength, bytesWritten }) {
      onDownload(contentLength, bytesWritten)
    },
  })
  downloadJobId = jobId
  return promise.then(() => {
    apkSavePath = savePath
    return updateApp()
  })
}

export const updateApp = async() => {
  if (!apkSavePath) throw new Error('apk Save Path is null')
  await installApk(apkSavePath, APP_PROVIDER_NAME)
}
