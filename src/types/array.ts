import { Tuple } from './global'
import { Equal } from './utils'

/**
 * 获取数组第一个类型
 * @public
 */
export type First<T extends unknown[]> = T extends [infer F, ...unknown[]]
  ? F
  : never

/**
 * 获取数组最后一个类型
 * @public
 */
export type Last<T extends unknown[]> = T extends [...unknown[], infer L]
  ? L
  : never

/**
 * 元组转为键值相等的对象
 * @public
 */
export type TupleToObject<T extends readonly PropertyKey[]> = {
  [K in T[number]]: K
}

/**
 * 获取元组长度
 * @public
 */
export type Length<T extends readonly unknown[]> = T['length']

/**
 * 获取数组除最后一个元素外的其他元素,如果是空数组则返回空数组
 * @public
 */
export type PopArray<ARR extends unknown[]> = ARR extends []
  ? []
  : ARR extends [...infer Rest, unknown]
    ? Rest
    : never

/**
 * 获取数组除第一个元素外的其他元素,如果是空数组则返回空数组
 * @public
 */
export type ShiftArray<ARR extends unknown[]> = ARR extends []
  ? []
  : ARR extends [unknown, ...infer Rest]
    ? Rest
    : never

/**
 * 合并两个元组类型
 * @public
 */
export type Concat<Arr1 extends Tuple<unknown>, Arr2 extends Tuple<unknown>> = [
  ...Arr1,
  ...Arr2,
]

/**
 * 判断元组是否包含某个元素
 * @public
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
 * @public
 */
export type Push<T extends Tuple<unknown>, U> = [...T, U]

/**
 * 在元组类型头部添加值
 * @public
 */
export type Unshift<T extends Tuple<unknown>, U> = [U, ...T]

/**
 * zip组合两个元素的元组
 * 如果元组不满足含有两个元素，那么返回\{\}
 * @public
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
 * @public
 */
export type Zip<One extends unknown[], Other extends unknown[]> = One extends [
  infer OneFirst,
  ...infer OneRest,
]
  ? Other extends [infer TwoFirst, ...infer TwoRest]
    ? [[OneFirst, TwoFirst], ...Zip<OneRest, TwoRest>]
    : []
  : []

/**
 *反转数组
 * @public
 */
export type ReverseArr<Arr extends unknown[]> = Arr extends [
  infer First,
  ...infer Rest,
]
  ? [...ReverseArr<Rest>, First]
  : Arr

/**
 * 移除数组中的元素
 * @public
 */
export type RemoveArrItem<
  Arr extends unknown[],
  Item,
  Result extends unknown[] = [],
> = Arr extends [infer First, ...infer Rest]
  ? Equal<First, Item> extends true
    ? RemoveArrItem<Rest, Item, Result>
    : RemoveArrItem<Rest, Item, [...Result, First]>
  : Result

/**
 * 创建任意长度相同元素的数组
 * @public
 */
export type BuildArray<
  Length extends number,
  Ele = unknown,
  Arr extends unknown[] = [],
> = Arr['length'] extends Length ? Arr : BuildArray<Length, Ele, [...Arr, Ele]>

/**
 * 对数组做分组，传入两个参数,数组和分组的长度
 * @public
 */
export type Chunk<
  Arr extends unknown[],
  ItemLen extends number,
  CurItem extends unknown[] = [],
  Res extends unknown[] = [],
> = Arr extends [infer First, ...infer Rest]
  ? CurItem['length'] extends ItemLen // 是否提取到ItemLen个元素
    ? Chunk<Rest, ItemLen, [First], [...Res, CurItem]> // 已提取到ItemLen个元素，此时CurItem为ItemLen长度的数组，直接放入Res，继续处理下一个元素
    : Chunk<Rest, ItemLen, [...CurItem, First], Res> // 为提取到，则CurItem继续添加元素
  : [...Res, CurItem] //退出条件，即传入的Arr为空时，此时CurItem时最后累计的数组

/**
 * 元组转为嵌套对象
 *  ['a', 'b', 'c'] 转为 \{
    a: \{
        b: \{
            c: 'xxx'
        \}
    \}
\}
 * @public
 */
export type TupleToNestedObject<
  Tuple extends unknown[],
  Value,
> = Tuple extends [infer First, ...infer Rest]
  ? {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [Key in First as Key extends keyof any
        ? Key
        : never]: Rest extends unknown[]
        ? TupleToNestedObject<Rest, Value>
        : Value
    }
  : Value
