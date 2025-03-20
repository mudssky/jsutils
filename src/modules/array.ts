/* eslint-disable @typescript-eslint/no-explicit-any */
import { PropertyName } from '@/types'
import { ArgumentError } from './error'
import { isArray, isFunction } from './typed'

/**
 * 函数“range”返回一个数字数组，该数组从给定的起始值开始，按给定的步长值递增，并以给定的结束值结束（可选）。
 * @param  start - start 参数是范围的起始值
 * @param  end - “end”参数是一个可选参数，用于指定范围的结束值。如果未提供，则范围将是[0,start）。
 * @param step - “step”参数是一个可选参数，用于指定范围内每个值之间的增量。如果未提供，则默认为 1。
 * @returns [start,end)范围的，按照step步长的整数组成的数组
 * @example
 * ```ts
 * console.log(range(1,3))
 * // print [1,2]
 * ```
 * @public
 */
function range(start: number, end?: number, step = 1) {
  return Array.from(rangeIter(start, end, step))
}

/**
 * 函数“range”返回一个数字数组，该数组从给定的起始值开始，按给定的步长值递增，并以给定的结束值结束（可选）。
 * @param  start - start 参数是范围的起始值
 * @param  end - “end”参数是一个可选参数，用于指定范围的结束值。如果未提供，则范围将是[0,start）。
 * @param step - “step”参数是一个可选参数，用于指定范围内每个值之间的增量。如果未提供，则默认为 1。
 * @returns [start,end)范围的，按照step步长的整数生成器。
 * @example
 * ```ts
 * for (const num of rangeIter(1,8)){
 * console.log(num)
 * }
 * ```
 * @public
 */
function* rangeIter(start: number, end?: number, step = 1) {
  let actualStart = start
  let actualEnd = end
  // 判断只有一个参数的情况，区间从0到start
  if (typeof actualEnd === 'undefined') {
    actualEnd = start
    actualStart = 0
  }

  // 进行参数检查
  if (step === 0) {
    throw new ArgumentError('step can not be zero')
  }

  // 参数需要都是整数
  if (
    !(
      Number.isInteger(actualStart) &&
      Number.isInteger(actualEnd) &&
      Number.isInteger(step)
    )
  ) {
    throw new ArgumentError('unsupport decimal number')
  }
  if (step > 0) {
    for (let i = actualStart; i < actualEnd; i += step) {
      yield i
    }
  } else {
    for (let i = actualStart; i > actualEnd; i += step) {
      yield i
    }
  }
}

type Filter<T> = (item: T) => boolean
class Query<T extends object> extends Array<T> {
  private filters: Filter<T>[] = []
  private sortKeys: (keyof T)[] = []
  private groupByKey: keyof T | null = null
  constructor(list: T[]) {
    super(list.length)
    for (let i = 0; i < list.length; i++) {
      const item = list[i]
      this[i] = item
    }
  }

  where(filter: Filter<T>) {
    this.filters.push(filter)
    return this
  }

  sortBy(key: keyof T) {
    this.sortKeys.push(key)
    return this
  }
  groupBy(key: keyof T) {
    this.groupByKey = key
    return this
  }
  execute() {
    let res = [...this.values()]
    if (this.filters.length > 0) {
      res = res.filter((item) =>
        this.filters.every((predicate) => predicate(item)),
      )
    }

    if (this.sortKeys.length > 0) {
      this.sortKeys.forEach((key) => {
        res.sort((a, b) => (a[key] > b[key] ? 1 : -1))
      })
    }
    if (this.groupByKey) {
      const groups: Record<string, T[]> = {}
      for (const item of res) {
        const key: any = item[this.groupByKey]
        if (!(key in groups)) {
          groups[key] = []
        }
        groups[key].push(item)
      }
      // @ts-expect-error allow different type
      res = groups
    }

    return res as any
  }
}

function createQuery<T extends object>(list: T[]) {
  return new Query<T>(list)
}

type SortDirection = 'asc' | 'desc' | 'none'

type CompareFunction<T> = (a: T, b: T) => number
const defaultAsc = <T = any>(a: T, b: T) => {
  const astr = String(a)
  const bstr = String(b)
  if (astr === bstr) {
    return 0
  }
  if (astr < bstr) {
    return -1
  } else {
    return 1
  }
}
/**
 * sort策略是 a-b的逻辑，如果返回负数比如-1，说明递增，或者a>b
 */
const sortStrategies = {
  defaultAsc,
  defaultDesc: <T = any>(a: T, b: T) => -defaultAsc(a, b),
}

/**
 * 判断已排序数组的排序方向，必须传入排序好的数组
 * @param sortedArr
 * @param compareFn  类似sort方法的参数，返回负数说明升序，即b>a,返回0 b=a，返回正数说明降序，即a>b
 * @returns
 */
function getSortDirection<T = any>(
  sortedArr: T[],
  compareFn: CompareFunction<T> = sortStrategies.defaultAsc,
): SortDirection {
  if (sortedArr.length <= 1) {
    return 'none'
  }
  for (let i = 1; i < sortedArr.length; i++) {
    if (compareFn(sortedArr[i - 1], sortedArr[i]) < 0) {
      return 'asc'
    }
    if (compareFn(sortedArr[i - 1], sortedArr[i]) > 0) {
      return 'desc'
    }
  }
  return 'none'
}

/**
 * Sort an array without modifying it and return
 * the newly sorted value. Allows for a string
 * sorting value.
 */
const alphabetical = <T>(
  array: readonly T[],
  getter: (item: T) => string,
  dir: 'asc' | 'desc' = 'asc',
) => {
  if (!array) return []
  const asc = (a: T, b: T) => `${getter(a)}`.localeCompare(getter(b))
  const dsc = (a: T, b: T) => `${getter(b)}`.localeCompare(getter(a))
  return array.slice().sort(dir === 'desc' ? dsc : asc)
}

/**
 * Go through a list of items, starting with the first item,
 * and comparing with the second. Keep the one you want then
 * compare that to the next item in the list with the same
 *
 * Ex. const greatest = () => boil(numbers, (a, b) => a > b)
 */
const boil = <T>(array: readonly T[], compareFunc: (a: T, b: T) => T) => {
  if (!array || (array.length ?? 0) === 0) return null
  return array.reduce(compareFunc)
}

/**
 * Splits a single list into many lists of the desired size. If
 * given a list of 10 items and a size of 2, it will return 5
 * lists with 2 items each
 */
const chunk = <T>(list: readonly T[], size: number = 2): T[][] => {
  const clusterCount = Math.ceil(list.length / size)
  return new Array(clusterCount).fill(null).map((_c: null, i: number) => {
    return list.slice(i * size, i * size + size)
  })
}

/**
 * 计数，根据生成的key值来统计
 * @param list
 * @param identity
 * @returns
 */
const countBy = <T, TId extends PropertyName>(
  list: readonly T[],
  identity: (item: T) => TId,
): Record<TId, number> => {
  if (!list) return {} as Record<TId, number>
  return list.reduce(
    (acc, item) => {
      const id = identity(item)
      acc[id] = (acc[id] ?? 0) + 1
      return acc
    },
    {} as Record<TId, number>,
  )
}

/**
 * Returns all items from the first list that
 * do not exist in the second list.
 */
const diff = <T>(
  root: readonly T[],
  other: readonly T[],
  identity: (item: T) => string | number | symbol = (t: T) =>
    t as unknown as string | number | symbol,
): T[] => {
  if (!root?.length && !other?.length) return []
  if (root?.length === undefined) return [...other]
  if (!other?.length) return [...root]
  const bKeys = other.reduce(
    (acc, item) => {
      acc[identity(item)] = true
      return acc
    },
    {} as Record<string | number | symbol, boolean>,
  )
  return root.filter((a) => !bKeys[identity(a)])
}

/**
 * Get the first item in an array or a default value
 */
const first = <T>(
  array: readonly T[],
  defaultValue: T | null | undefined = undefined,
) => {
  return array?.length > 0 ? array[0] : defaultValue
}

/**
 * Get the last item in an array or a default value
 */
const last = <T>(
  array: readonly T[],
  defaultValue: T | null | undefined = undefined,
) => {
  return array?.length > 0 ? array[array.length - 1] : defaultValue
}

/**
 * Split an array into two array based on
 * a true/false condition function
 */
const fork = <T>(
  list: readonly T[],
  condition: (item: T) => boolean,
): [T[], T[]] => {
  if (!list) return [[], []]
  return list.reduce(
    (acc, item) => {
      const [a, b] = acc
      if (condition(item)) {
        return [[...a, item], b]
      } else {
        return [a, [...b, item]]
      }
    },
    [[], []] as [T[], T[]],
  )
}

/**
 * Given two arrays, returns true if any
 * elements intersect
 */
const hasIntersects = <T, K extends string | number | symbol>(
  listA: readonly T[],
  listB: readonly T[],
  identity?: (t: T) => K,
): boolean => {
  if (!listA || !listB) return false
  const ident = identity ?? ((x: T) => x as unknown as K)
  const dictB = listB.reduce(
    (acc, item) => {
      acc[ident(item)] = true
      return acc
    },
    {} as Record<string | number | symbol, boolean>,
  )
  return listA.some((value) => dictB[ident(value)])
}

/**
 * Max gets the greatest value from a list
 *
 * @example
 * max([ 2, 3, 5]) == 5
 * max([{ num: 1 }, { num: 2 }], x => x.num) == { num: 2 }
 */
function max(array: readonly [number, ...number[]]): number
function max(array: readonly number[]): number | null
function max<T>(array: readonly T[], getter: (item: T) => number): T | null
function max<T>(array: readonly T[], getter?: (item: T) => number): T | null {
  const get = getter ?? ((v: any) => v)
  return boil(array, (a, b) => (get(a) > get(b) ? a : b))
}

/**
 * Min gets the smallest value from a list
 *
 * @example
 * min([1, 2, 3, 4]) == 1
 * min([{ num: 1 }, { num: 2 }], x => x.num) == { num: 1 }
 */
function min(array: readonly [number, ...number[]]): number
function min(array: readonly number[]): number | null
function min<T>(array: readonly T[], getter: (item: T) => number): T | null
function min<T>(array: readonly T[], getter?: (item: T) => number): T | null {
  const get = getter ?? ((v: any) => v)
  return boil(array, (a, b) => (get(a) < get(b) ? a : b))
}

/**
 * If the item matching the condition already exists
 * in the list it will be removed. If it does not it
 * will be added.
 */
const toggle = <T>(
  list: readonly T[],
  item: T,
  /**
   * Converts an item of type T item into a value that
   * can be checked for equality
   */
  toKey?: null | ((item: T, idx: number) => number | string | symbol),
  options?: {
    strategy?: 'prepend' | 'append'
  },
) => {
  if (!list && !item) return []
  if (!list) return [item]
  if (!item) return [...list]
  const matcher = toKey
    ? (x: T, idx: number) => toKey(x, idx) === toKey(item, idx)
    : (x: T) => x === item
  const existing = list.find(matcher)
  if (existing) return list.filter((x, idx) => !matcher(x, idx))
  const strategy = options?.strategy ?? 'append'
  if (strategy === 'append') return [...list, item]
  return [item, ...list]
}

/**
 * Sum all numbers in an array. Optionally provide a function
 * to convert objects in the array to number values.
 */
function sum<T extends number>(array: readonly T[]): number
function sum<T extends object>(
  array: readonly T[],
  fn: (item: T) => number,
): number
function sum<T extends object | number>(
  array: readonly any[],
  fn?: (item: T) => number,
): number {
  return (array || []).reduce((acc, item) => acc + (fn ? fn(item) : item), 0)
}

/**
 * Creates an object mapping the specified keys to their corresponding values
 *
 * Ex. const zipped = zipToObject(['a', 'b'], [1, 2]) // { a: 1, b: 2 }
 * Ex. const zipped = zipToObject(['a', 'b'], (k, i) => k + i) // { a: 'a0', b: 'b1' }
 * Ex. const zipped = zipToObject(['a', 'b'], 1) // { a: 1, b: 1 }
 */
function zipObject<K extends PropertyName, V>(
  keys: K[],
  values: V | ((key: K, idx: number) => V) | V[],
): Record<K, V> {
  if (!keys || !keys.length) {
    return {} as Record<K, V>
  }

  const getValue = isFunction(values)
    ? values
    : isArray(values)
      ? (_k: K, i: number) => values[i]
      : // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (_k: K, _i: number) => values

  return keys.reduce(
    (acc, key, idx) => {
      acc[key] = getValue(key, idx)
      return acc
    },
    {} as Record<K, V>,
  )
}

/**
 * Creates an array of grouped elements, the first of which contains the
 * first elements of the given arrays, the second of which contains the
 * second elements of the given arrays, and so on.
 *
 * Ex. const zipped = zip(['a', 'b'], [1, 2], [true, false]) // [['a', 1, true], ['b', 2, false]]
 */
function zip<T1, T2, T3, T4, T5>(
  array1: T1[],
  array2: T2[],
  array3: T3[],
  array4: T4[],
  array5: T5[],
): [T1, T2, T3, T4, T5][]
function zip<T1, T2, T3, T4>(
  array1: T1[],
  array2: T2[],
  array3: T3[],
  array4: T4[],
): [T1, T2, T3, T4][]
function zip<T1, T2, T3>(
  array1: T1[],
  array2: T2[],
  array3: T3[],
): [T1, T2, T3][]
function zip<T1, T2>(array1: T1[], array2: T2[]): [T1, T2][]
function zip<T>(...arrays: T[][]): T[][] {
  if (!arrays || !arrays.length) return []
  return new Array(Math.max(...arrays.map(({ length }) => length)))
    .fill([])
    .map((_, idx) => arrays.map((array) => array[idx]))
}

/**
 * Given a list of items returns a new list with only
 * unique items. Accepts an optional identity function
 * to convert each item in the list to a comparable identity
 * value
 */
const unique = <T, K extends PropertyName>(
  array: readonly T[],
  toKey?: (item: T) => K,
): T[] => {
  const valueMap = array.reduce(
    (acc, item) => {
      const key = toKey ? toKey(item) : (item as any as PropertyName)
      if (acc[key]) return acc
      acc[key] = item
      return acc
    },
    {} as Record<PropertyName, T>,
  )
  return Object.values(valueMap)
}

const shuffle = <T>(array: readonly T[]): T[] => {
  return array
    .map((a) => ({ rand: Math.random(), value: a }))
    .sort((a, b) => a.rand - b.rand)
    .map((a) => a.value)
}

export {
  alphabetical,
  boil,
  chunk,
  countBy,
  createQuery,
  diff,
  first,
  fork,
  getSortDirection,
  hasIntersects,
  last,
  max,
  min,
  Query,
  range,
  rangeIter,
  shuffle,
  sortStrategies,
  sum,
  toggle,
  unique,
  zip,
  zipObject,
}
export type { CompareFunction, SortDirection }
