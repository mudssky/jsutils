import { AnyConstructor } from './global'

/**
 * 获取构造器参数类型
 */
export type ConstructorParameterType<ConstructorType extends AnyConstructor> =
  ConstructorType extends new (...args: infer ParametersType) => unknown
    ? ParametersType
    : never
