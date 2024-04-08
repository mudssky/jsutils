import { AnyFunction } from './global'

export type Expect<T extends true> = T
export type ExpectTrue<T extends true> = T
export type ExpectFalse<T extends false> = T
export type IsTrue<T extends true> = T
export type IsFalse<T extends false> = T

export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false
export type NotEqual<X, Y> = true extends Equal<X, Y> ? false : true

// https://stackoverflow.com/questions/49927523/disallow-call-with-any/49928360#49928360
export type IsAny<T> = 0 extends 1 & T ? true : false
export type NotAny<T> = true extends IsAny<T> ? false : true

export type Debug<T> = { [K in keyof T]: T[K] }
export type MergeInsertions<T> = T extends object
  ? { [K in keyof T]: MergeInsertions<T[K]> }
  : T

export type Alike<X, Y> = Equal<MergeInsertions<X>, MergeInsertions<Y>>

export type ExpectExtends<VALUE, EXPECTED> = EXPECTED extends VALUE
  ? true
  : false
export type ExpectValidArgs<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FUNC extends (...args: any[]) => any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ARGS extends any[],
> = ARGS extends Parameters<FUNC> ? true : false

export type UnionToIntersection<U> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void
    ? I
    : never

/**
 * 类型编程中的If判断
 */
export type If<Condition extends boolean, T, F> = Condition extends true ? T : F

/**
 * Readonly递归版本
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
 * 判断是否是联合类型
 * 因为联合类型会触发分布式，比如A是'1'|'2'|'3', A extends A触发了分布式，每次都会分别传入 '1','2','3',
 * 但是B([A]extends [A],只有单独的条件类型的A触发)不会触发分布式，是'1'|'2'|'3',所以这两个不相等的情况的是联合类型
 *
 * 当extends关键字左侧是泛型且传入的是联合类型时，它可以实现分配效果，即对联合类型中的每个类型分别进行处理。
 * 如果左侧不是泛型，直接是一个联合类型，那么extends只是进行简单的条件判断，没有分配效果。
 */
export type IsUnion<A, B = A> = A extends A
  ? [B] extends [A]
    ? false
    : true
  : never
