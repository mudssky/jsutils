import { Tuple } from './global'
import { Equal } from './utils'

/**
 * 获取数组第一个类型
 */
export type First<T extends unknown[]> = T extends [infer F, ...unknown[]]
  ? F
  : never

/**
 * 获取数组最后一个类型
 */
export type Last<T extends unknown[]> = T extends [...unknown[], infer L]
  ? L
  : never

/**
 * 元组转为键值相等的对象
 */
export type TupleToObject<T extends readonly PropertyKey[]> = {
  [K in T[number]]: K
}

/**
 * 获取元组长度
 */
export type Length<T extends readonly unknown[]> = T['length']

/**
 * 获取数组除最后一个元素外的其他元素,如果是空数组则返回空数组
 */
export type PopArray<ARR extends unknown[]> = ARR extends []
  ? []
  : ARR extends [...infer Rest, unknown]
    ? Rest
    : never

/**
 * 获取数组除第一个元素外的其他元素,如果是空数组则返回空数组
 */
export type ShiftArray<ARR extends unknown[]> = ARR extends []
  ? []
  : ARR extends [unknown, ...infer Rest]
    ? Rest
    : never

/**
 * 合并两个元组类型
 */
export type Concat<Arr1 extends Tuple<unknown>, Arr2 extends Tuple<unknown>> = [
  ...Arr1,
  ...Arr2,
]

/**
 * 判断元组是否包含某个元素
 */
export type Includes<Arr extends Tuple<unknown>, Item> = Arr extends [
  infer First,
  ...infer Rest,
]
  ? Equal<First, Item> extends true
    ? true
    : Includes<Rest, Item>
  : false

/**
 * 在元组类型尾部添加值
 */
export type Push<T extends Tuple<unknown>, U> = [...T, U]

/**
 * 在元组类型头部添加值
 */
export type Unshift<T extends Tuple<unknown>, U> = [U, ...T]

/**
 * zip组合两个元素的元组
 * 如果元组不满足含有两个元素，那么返回{】}
 */
export type Zip2<
  One extends [unknown, unknown],
  Two extends [unknown, unknown],
> = One extends [infer OneFirst, infer OneSecond]
  ? Two extends [infer TwoFirst, infer TwoSecond]
    ? [[OneFirst, TwoFirst], [OneSecond, TwoSecond]]
    : []
  : []

/**
 * zip组合任意多个元素的元组
 */
export type Zip<One extends unknown[], Other extends unknown[]> = One extends [
  infer OneFirst,
  ...infer OneRest,
]
  ? Other extends [infer TwoFirst, ...infer TwoRest]
    ? [[OneFirst, TwoFirst], ...Zip<OneRest, TwoRest>]
    : []
  : []
