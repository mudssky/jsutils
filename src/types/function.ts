import { AnyFunction } from './global'

/**
 * 获取函数的参数类型
 */
export type ParameterType<Func extends AnyFunction> = Func extends (
  ...args: infer Args
) => unknown
  ? Args
  : never

/**
 * 获取函数this的类型
 */
export type ThisParameterType<Func> = Func extends (
  this: infer ThisType,
  ...args: unknown[]
) => unknown
  ? ThisType
  : unknown

/**
 * 给函数添加参数
 */
export type AppendArgument<Func extends AnyFunction, Arg> = Func extends (
  ...args: infer Args
) => infer ReturnType
  ? (...args: [...Args, Arg]) => ReturnType
  : never
