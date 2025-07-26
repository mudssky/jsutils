/**
 * 获取构造器参数类型
 *  ts 内置了 ConstructorParameters ，所以这个不需要了
 */
// export type ConstructorParameterType<ConstructorType extends AnyConstructor> =
//   ConstructorType extends new (...args: infer ParametersType) => unknown
//     ? ParametersType
//     : never

/**
 *获取class public 属性，利用keyof只能拿到class的public索引
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClassPublicProps<Obj extends Record<string, any>> = {
  [Key in keyof Obj]: Obj[Key]
}
