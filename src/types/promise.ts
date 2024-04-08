/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 获取一个Promise类型的返回值类型
 */
export type PromiseType<T extends Promise<unknown>> =
  T extends Promise<infer U> ? U : never

/**
 * 递归获取一个Promise类型的返回值类型
 * 处理嵌套的Promise类型
 */
export type DeepPromiseType<T extends Promise<unknown>> =
  T extends Promise<infer ValueType>
    ? ValueType extends Promise<unknown>
      ? DeepPromiseType<ValueType>
      : ValueType
    : never

/**
 * 去掉DeepPromiseType的类型约束，可以简化代码
 */
// export type DeepPromiseType2<T> =
//   T extends Promise<infer ValueType> ? DeepPromiseType2<ValueType> : T

/**
 * 获取PromiseLike，即具有满足PromiseA+的then方法函数的返回值类型，递归获取
 * 这里不用PromiseLike<unknown>是因为any更宽松一些
 */
export type DeepAwaited<P extends PromiseLike<any>> =
  P extends PromiseLike<infer R>
    ? R extends PromiseLike<any>
      ? DeepAwaited<R>
      : R
    : P
