/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnyObject, ObjectIterator, PropertyName } from '../types/index'

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

function isObject(obj: any): obj is AnyObject {
  return typeof obj === 'object' && obj !== null
}

/**
 * 对两个对象，进行递归合并
 * @param target
 * @param sources
 * @returns
 */
function merge(target: AnyObject, ...sources: AnyObject[]): AnyObject {
  for (const source of sources) {
    for (const key in source) {
      if (isObject(target[key]) && isObject(source[key])) {
        merge(target[key], source[key])
      } else {
        target[key] = source[key]
      }
    }
  }
  return target
}
/**
 * 移除对象中不能被json序列化的属性
 * @param obj
 * @returns
 */
function removeNonSerializableProps(obj: Record<any, any> | null | undefined) {
  if (obj === null || obj === undefined) {
    return obj
  }
  // 这里用weakset，因为是弱引用，可以被垃圾回收机制回收
  // 另外weakset不能存原始类型的值，专门用于存储对象
  function remove(obj: any, seen: WeakSet<any> = new WeakSet()): any {
    // 如果已经处理过这个对象，返回一个指示循环引用的标记
    if (seen.has(obj)) {
      return '[Circular]'
    }

    // 如果是数组，则遍历每个元素
    if (Array.isArray(obj)) {
      return obj
        .filter(
          (item) => typeof item !== 'function' && typeof item !== 'symbol',
        )
        .map((item) => remove(item, seen))
    }

    // 如果是对象，遍历每个属性
    if (typeof obj === 'object') {
      seen.add(obj)
      const newObj: any = {}
      for (const key in obj) {
        if (Object.hasOwn(obj, key)) {
          // 只保留可以 JSON 序列化的属性
          const value = obj[key]
          if (typeof value !== 'function' && typeof value !== 'symbol') {
            newObj[key] = remove(value, seen)
          }
        }
      }
      return newObj
    }

    // 如果是基础类型，直接返回
    return obj
  }
  return remove(obj)
}

/**
 * 移除对象中不能序列化的属性后，再执行JSON.stringify
 * @param obj
 * @returns
 */
function safeJsonStringify(obj: AnyObject | null | undefined): string {
  const serializableObj = removeNonSerializableProps(obj)
  return JSON.stringify(serializableObj)
}

const invert = <TKey extends PropertyName, TValue extends PropertyName>(
  obj: Record<TKey, TValue>,
): Record<TValue, TKey> => {
  if (!obj) return {} as Record<TValue, TKey>
  const keys = Object.keys(obj) as TKey[]
  return keys.reduce(
    (acc, key) => {
      acc[obj[key]] = key
      return acc
    },
    {} as Record<TValue, TKey>,
  )
}

export {
  invert,
  mapKeys,
  mapValues,
  merge,
  omit,
  omitBy,
  pick,
  pickBy,
  removeNonSerializableProps,
  safeJsonStringify,
}
