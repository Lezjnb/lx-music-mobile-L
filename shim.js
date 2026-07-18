/**
 * `react-native-quick-base64` 的 Android 原生模块因 RN 0.73 的 CMake 兼容性
 * 被排除自动链接，但 `@craftzdog/react-native-buffer` 仍会调用这两个 JSI
 * 全局函数。必须在加载 Buffer 前提供纯 JS 回退。
 */
const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

const getBytes = (value) => {
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
  throw new TypeError('Expected ArrayBuffer or TypedArray')
}

if (typeof global.base64FromArrayBuffer != 'function') {
  global.base64FromArrayBuffer = (value, urlSafe = false) => {
    const bytes = getBytes(value)
    let output = ''
    for (let index = 0; index < bytes.length; index += 3) {
      const first = bytes[index]
      const second = bytes[index + 1]
      const third = bytes[index + 2]
      output += base64Chars[first >> 2]
      output += base64Chars[((first & 3) << 4) | ((second ?? 0) >> 4)]
      output += second == null ? '=' : base64Chars[((second & 15) << 2) | ((third ?? 0) >> 6)]
      output += third == null ? '=' : base64Chars[third & 63]
    }
    return urlSafe ? output.replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/u, '') : output
  }
}

if (typeof global.base64ToArrayBuffer != 'function') {
  global.base64ToArrayBuffer = (value, removeLinebreaks = false) => {
    let source = String(value).replace(/-/gu, '+').replace(/_/gu, '/')
    if (removeLinebreaks) source = source.replace(/\s/gu, '')
    if (!/^[A-Za-z0-9+/]*={0,2}$/u.test(source) || source.length % 4 == 1) throw new Error('Invalid base64 string')
    source += '='.repeat((4 - source.length % 4) % 4)
    const outputLength = source.length / 4 * 3 - (source.endsWith('==') ? 2 : source.endsWith('=') ? 1 : 0)
    const bytes = new Uint8Array(outputLength)
    let offset = 0
    for (let index = 0; index < source.length; index += 4) {
      const first = base64Chars.indexOf(source[index])
      const second = base64Chars.indexOf(source[index + 1])
      const third = source[index + 2] == '=' ? 0 : base64Chars.indexOf(source[index + 2])
      const fourth = source[index + 3] == '=' ? 0 : base64Chars.indexOf(source[index + 3])
      bytes[offset++] = (first << 2) | (second >> 4)
      if (source[index + 2] != '=') bytes[offset++] = ((second & 15) << 4) | (third >> 2)
      if (source[index + 3] != '=') bytes[offset++] = ((third & 3) << 6) | fourth
    }
    return bytes.buffer
  }
}

global.Buffer = require('buffer').Buffer
