/**
 * 创建一个异步延迟函数
 * @param ms - 延迟时间，单位毫秒
 * @returns - Promise\\\<void\\\> 在指定时间后resolve的Promise
 *
 * @example
 * // 延迟1秒
 * await sleepAsync(1000);
 *
 * // 链式调用
 * sleepAsync(500).then(() =\> \\\{
 *   console.log('500ms后执行')
 * \\\})
 */
export function sleepAsync(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
