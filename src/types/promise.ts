/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 获取一个Promise类型的返回值类型
 */
export type PromiseType<T extends Promise<unknown>> =
  T extends Promise<infer U> ? U : never

/**
 * 获取PromiseLike，即具有满足PromiseA+的then方法函数的返回值类型，递归获取
 * 这里不用PromiseLike<unknown>是因为any更宽松一些
 */
export type Awaited<P extends PromiseLike<any>> =
  P extends PromiseLike<infer R>
    ? R extends PromiseLike<any>
      ? Awaited<R>
      : R
    : P
