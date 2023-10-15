/**
 *  从obj中选取属性，返回一个新的对象
 * @param obj
 * @param keys
 * @returns
 */
function pick<T extends object, K extends keyof T>(obj: T, keys: K[]) {
  const result: Partial<Pick<T, K>> = {}
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result as Pick<T, K>
}

/**
 * 类似于数组的filter方法，但是作用于对象。
 * 默认情况下predicate，是判断value值是否为真值进行筛选
 * @param obj
 * @param predicate
 * @returns
 */
function pickBy<T extends object, K extends keyof T>(
  obj: T,
  predicate: (value: T[K], key?: K) => boolean = (value: T[K]) => !!value,
) {
  const result: Partial<Pick<T, K>> = {}
  for (const key of Object.keys(obj) as K[]) {
    if (predicate?.(obj[key], key)) {
      result[key] = obj[key]
    }
  }
  return result as Pick<T, K>
}

export { pick, pickBy }
