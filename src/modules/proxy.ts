/**
 * 传入一个对象，利用Proxy包装返回一个单例对象
 * 因为使用了Proxy，所以this绑定还是原来的对象不会受影响
 * @param obj
 * @returns
 * @public
 * @example
 * ```ts
 *	const singleDate = singletonProxy(Date)
    const date1 = new singleDate()
    const date2 = new singleDate()
		date1 === date2
 * ```
 */
export function singletonProxy<T extends object>(
  obj: new (...args: unknown[]) => T,
) {
  let instance: T
  return new Proxy(obj, {
    construct(target, argArray) {
      if (!instance) {
        instance = new target(...argArray)
      }
      return instance
    },
  })
}
