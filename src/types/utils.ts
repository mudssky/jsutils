import { AnyFunction } from './global'

/**
 * @public
 */
export type Expect<T extends true> = T
/**
 * @public
 */
export type ExpectTrue<T extends true> = T
/**
 * @public
 */
export type ExpectFalse<T extends false> = T
/**
 * @public
 */
export type IsTrue<T extends true> = T
/**
 * @public
 */
export type IsFalse<T extends false> = T

/**
 * ts对函数类型有特殊处理，可以区分any类型
 * @public
 */
export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false

/**
 * @public
 */
export type IsEqual<X, Y> = Equal<X, Y>

/**
 * @public
 */
export type NotEqual<X, Y> = true extends Equal<X, Y> ? false : true

/**
 * any 类型与任何类型的交叉都是 any，也就是 1 & any 结果是 any。
 */
// https://stackoverflow.com/questions/49927523/disallow-call-with-any/49928360#49928360
/**
 * @public
 */
export type IsAny<T> = 0 extends 1 & T ? true : false
/**
 * @public
 */
export type NotAny<T> = true extends IsAny<T> ? false : true

/**
 * @public
 */
export type Debug<T> = { [K in keyof T]: T[K] }
/**
 * @public
 */
export type MergeInsertions<T> = T extends object
  ? { [K in keyof T]: MergeInsertions<T[K]> }
  : T

/**
 * @public
 */
export type Alike<X, Y> = Equal<MergeInsertions<X>, MergeInsertions<Y>>

/**
 * @public
 */
export type ExpectExtends<VALUE, EXPECTED> = EXPECTED extends VALUE
  ? true
  : false
/**
 * @public
 */
export type ExpectValidArgs<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FUNC extends (...args: any[]) => any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ARGS extends any[],
> = ARGS extends Parameters<FUNC> ? true : false

/**
 * 类型编程中的If判断
 * @public
 */
export type If<Condition extends boolean, T, F> = Condition extends true ? T : F

/**
 * Readonly递归版本
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DeepReadonly<Obj extends Record<string, any>> = {
  readonly [Key in keyof Obj]: Obj[Key] extends object
    ? Obj[Key] extends AnyFunction
      ? Obj[Key]
      : DeepReadonly<Obj[Key]>
    : Obj[Key]
}

/**
 * 判断是否是never类型
 * @public
 */
export type IsNever<T> = [T] extends [never] ? true : false

/**
 * 判断是否为元组
 * 元组和数组的区别是，数组的length是number类型
 * @public
 */
export type IsTuple<T> = T extends [...params: infer Elements]
  ? NotEqual<Elements['length'], number>
  : false

/**
 * @public
 */
export type Nullable<T> = T | null | undefined
