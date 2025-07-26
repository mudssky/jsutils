/**
 * 环境检测工具模块
 * 提供各种环境检测功能，包括浏览器、Node.js、Web Worker等
 */

// Web Worker 环境类型声明
declare const importScripts: ((...urls: string[]) => void) | undefined

/**
 * 检查是否在浏览器环境中
 * @returns - 是否在浏览器环境
 * @public
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * 检查是否在Node.js环境中
 * @returns - 是否在Node.js环境
 * @public
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
 * @returns - 是否在Web Worker环境
 * @public
 */
export function isWebWorker(): boolean {
  return typeof importScripts === 'function' && typeof navigator !== 'undefined'
}

/**
 * 检查document对象是否可用
 * @returns - document是否可用
 * @public
 */
export function isDocumentAvailable(): boolean {
  return typeof document !== 'undefined'
}

/**
 * 检查localStorage是否可用
 * @returns - localStorage是否可用
 * @public
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
 * @returns - sessionStorage是否可用
 * @public
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
 * @returns - 环境信息对象
 * @public
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
 * @param callback - 要执行的回调函数
 * @param fallback - 环境不支持时的回退函数
 * @returns - 执行结果
 * @public
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
 * @param callback - 要执行的回调函数
 * @param fallback - 环境不支持时的回退函数
 * @returns - 执行结果
 * @public
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
