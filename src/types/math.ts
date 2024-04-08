import { Equal } from 'dist/types'
import { BuildArray } from './array'

// 这边很多方法是使用数组长度计数。因此只能实现正整数的运算

/**
 * 使用拼接数组获取length实现加法
 * 只能传入正整数
 */
export type Add<Num1 extends number, Num2 extends number> = [
  ...BuildArray<Num1>,
  ...BuildArray<Num2>,
]['length']

/**
 * 使用数组类型提取获取length实现减法
 * 只能传入正整数
 */
export type Subtract<Num1 extends number, Num2 extends number> =
  BuildArray<Num1> extends [...arr1: BuildArray<Num2>, ...arr2: infer Rest]
    ? Rest['length']
    : never

/**
 * 使用递归累加实现乘法
 */
export type Mutiply<
  Num1 extends number,
  Num2 extends number,
  ResultArr extends unknown[] = [],
> = Num2 extends 0
  ? ResultArr['length']
  : Mutiply<Num1, Subtract<Num2, 1>, [...BuildArray<Num1>, ...ResultArr]>

export type IsNeverOrZero<T> = T extends never
  ? true
  : T extends 0
    ? true
    : false
/**
 * 使用递归累减实现除法,整除
 * 目前只能接受整数除法，并且不能整除会返回never
 */
export type Divide<
  Num1 extends number,
  Num2 extends number,
  CountArr extends unknown[] = [],
> = Num1 extends 0
  ? CountArr['length']
  : Divide<Subtract<Num1, Num2>, Num2, [unknown, ...CountArr]>

/**
 * 比如大小，num1是否大于num2
 * 类型参数 Num1 和 Num2 是待比较的两个数。
 * 类型参数 CountArr 是计数用的，会不断累加，默认值是 [] 代表从 0 开始。
 * 如果 Num1 extends Num2 成立，代表相等，直接返回 false。
 * 否则判断计数数组的长度，如果先到了 Num2，那么就是 Num1 大，返回 true。
 * 反之，如果先到了 Num1，那么就是 Num2 大，返回 false。
 * 如果都没到就往计数数组 CountArr 中放入一个元素，继续递归
 */
export type GreaterThan<
  Num1 extends number,
  Num2 extends number,
  CountArr extends unknown[] = [],
> = Num1 extends Num2
  ? false
  : CountArr['length'] extends Num2
    ? true
    : CountArr['length'] extends Num1
      ? false
      : GreaterThan<Num1, Num2, [...CountArr, unknown]>

/**
 * 大于或等于
 */
export type GreaterThanOrEqual<Num1 extends number, Num2 extends number> =
  Equal<Num1, Num2> extends true
    ? true
    : GreaterThan<Num1, Num2> extends true
      ? true
      : false

type FibonacciLoop<
  PrevArr extends unknown[], //上一个代表数的数组
  CurrentArr extends unknown[], // 当前数的数组
  IndexArr extends unknown[] = [], //当前index，每次递归加一，默认值是 []，代表从 0 开始。
  Num extends number = 1,
> = IndexArr['length'] extends Num
  ? CurrentArr['length']
  : FibonacciLoop<
      CurrentArr,
      [...PrevArr, ...CurrentArr],
      [...IndexArr, unknown], //每次递归index+1
      Num
    >

export type Fibonacci<Num extends number> = FibonacciLoop<[1], [], [], Num>
