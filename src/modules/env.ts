/**
 * 环境检测工具模块
 * 提供各种环境检测功能，包括浏览器、Node.js、Web Worker等
 */

// Web Worker 环境类型声明
declare const importScripts: ((...urls: string[]) => void) | undefined

/**
 * 检查是否在浏览器环境中
 * @returns {boolean} 是否在浏览器环境
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * 检查是否在Node.js环境中
 * @returns {boolean} 是否在Node.js环境
 */
export function isNode(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.versions &&
    !!process.versions.node
  )
}

/**
 * 检查是否在Web Worker环境中
 * @returns {boolean} 是否在Web Worker环境
 */
export function isWebWorker(): boolean {
  return typeof importScripts === 'function' && typeof navigator !== 'undefined'
}

/**
 * 检查document对象是否可用
 * @returns {boolean} document是否可用
 */
export function isDocumentAvailable(): boolean {
  return typeof document !== 'undefined'
}

/**
 * 检查localStorage是否可用
 * @returns {boolean} localStorage是否可用
 */
export function isLocalStorageAvailable(): boolean {
  try {
    if (typeof localStorage === 'undefined') {
      return false
    }
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * 检查sessionStorage是否可用
 * @returns {boolean} sessionStorage是否可用
 */
export function isSessionStorageAvailable(): boolean {
  try {
    if (typeof sessionStorage === 'undefined') {
      return false
    }
    const test = '__sessionStorage_test__'
    sessionStorage.setItem(test, test)
    sessionStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * 获取当前运行环境信息
 * @returns {object} 环境信息对象
 */
export function getEnvironmentInfo() {
  return {
    isBrowser: isBrowser(),
    isNode: isNode(),
    isWebWorker: isWebWorker(),
    isDocumentAvailable: isDocumentAvailable(),
    isLocalStorageAvailable: isLocalStorageAvailable(),
    isSessionStorageAvailable: isSessionStorageAvailable(),
    userAgent: isBrowser() ? navigator.userAgent : undefined,
    platform: isBrowser() ? navigator.platform : process?.platform,
  }
}

/**
 * 安全执行只能在浏览器环境中运行的代码
 * @param {Function} callback 要执行的回调函数
 * @param {Function} fallback 环境不支持时的回退函数
 * @returns {any} 执行结果
 */
export function runInBrowser<T>(
  callback: () => T,
  fallback?: () => T,
): T | undefined {
  if (isBrowser()) {
    return callback()
  }
  return fallback ? fallback() : undefined
}

/**
 * 安全执行需要document的代码
 * @param {Function} callback 要执行的回调函数
 * @param {Function} fallback 环境不支持时的回退函数
 * @returns {any} 执行结果
 */
export function runWithDocument<T>(
  callback: () => T,
  fallback?: () => T,
): T | undefined {
  if (isDocumentAvailable()) {
    return callback()
  }
  return fallback ? fallback() : undefined
}
