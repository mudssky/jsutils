/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyFunction } from './global'

/**
 * 获取函数的参数类型
 * @public
 */
export type ParameterType<Func extends AnyFunction> = Func extends (
  ...args: infer Args
) => unknown
  ? Args
  : never

/**
 * 获取函数this的类型
 * @public
 */
export type ThisParameterType<Func> = Func extends (
  this: infer ThisType,
  ...args: unknown[]
) => unknown
  ? ThisType
  : unknown

/**
 * 给函数添加参数
 * @template Func - 原函数类型
 * @template Arg - 要添加的参数类型
 * @example
 * ```ts
 * type Fn = (a: string) => number
 * type NewFn = AppendArgument<Fn, boolean> // (a: string, b: boolean) => number
 * ```
 * @public
 */
export type AppendArgument<Func extends AnyFunction, Arg> = Func extends (
  ...args: infer Args
) => infer ReturnType
  ? (...args: [...Args, Arg]) => ReturnType
  : never

/**
 * @public
 */
export type PromiseFunction<Args extends any[] = any[], R = any> = (
  ...args: Args
) => Promise<R>

/**
 * 获取Promise函数的返回值类型
 * @public
 */
export type PromiseReturnType<Func extends PromiseFunction> = Func extends (
  ...args: any
) => Promise<infer R>
  ? R
  : never

/**
 * 获取Promise函数的参数类型
 * @public
 */
export type PromiseParameterType<Func extends PromiseFunction> = Func extends (
  ...args: infer Args
) => Promise<any>
  ? Args
  : never
