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
