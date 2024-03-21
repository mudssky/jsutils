/* eslint-disable @typescript-eslint/no-explicit-any */

import { ObjectIterator } from '../types/index'

/**
 *  从obj中选取属性，返回一个新的对象
 * @param obj
 * @param keys
 * @returns
 */
function pick<T extends object, K extends keyof T>(
  obj: T | undefined | null,
  keys: K[],
) {
  const result: Partial<Pick<T, K>> = {}
  if (obj === null || obj === undefined) {
    return result as Pick<T, K>
  }
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
  obj: T | undefined | null,
  predicate: (value: T[K], key?: K) => boolean = (value: T[K]) => !!value,
) {
  const result: Partial<Pick<T, K>> = {}
  if (obj === null || obj === undefined) {
    return result
  }
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (predicate?.(obj[key], key)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        result[key] = obj[key]
      }
    }
  }

  return result
}
/**
 * 从obj中剔除属性，返回一个新的对象
 * @param obj
 * @param keys
 * @returns
 */
function omit<T extends object, K extends keyof T>(
  obj: T | null | undefined,
  keys: K[] = [],
) {
  const result: Partial<Omit<T, K>> = {}

  if (obj === null || obj === undefined) {
    return result as Omit<T, K>
  }
  for (const key in obj) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (!keys.includes(key)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      result[key] = obj[key]
    }
  }

  return result as Omit<T, K>
}

/**
 * pickBy的反向，判断剔除的属性
 * @param obj
 * @param predicate
 * @returns
 */
function omitBy<T extends object, K extends keyof T>(
  obj: T | undefined | null,
  predicate: (value: T[K], key?: K) => boolean = (value: T[K]) => !!value,
) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return pickBy(obj, (value, key) => !predicate(value, key))
}

function mapKeys<T extends object>(
  obj: T,
  iteratee: ObjectIterator<T, string>,
) {
  const result: Record<string, T[keyof T]> = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const transformedKey = iteratee(obj[key], key, obj)
      result[transformedKey] = obj[key]
    }
  }
  return result
}

function mapValues<T extends object, U = any>(
  obj: T,
  iteratee: ObjectIterator<T, U>,
) {
  const result: { [key in keyof T]?: U } = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const transformedValue = iteratee(obj[key], key, obj)
      result[key] = transformedValue
    }
  }
  return result as Record<keyof T, U>
}

export { mapKeys, mapValues, omit, omitBy, pick, pickBy }
