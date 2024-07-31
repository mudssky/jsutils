// 类型之间是有父子关系的，更具体的那个是子类型，比如 A 和 B 的交叉类型 A & B 就是联合类型 A | B 的子类型，因为更具体。
// 如果允许父类型赋值给子类型，就叫做逆变。
// 如果允许子类型赋值给父类型，就叫做协变。

/**
 * 联合类型转交叉类型
 * 也就是{a:1}|{b:1}变成{a:1}&{b:1}
 * TypeScript 有函数参数是有逆变的性质的
 * U extends any 触发分布式，用函数触发你便，转为交叉类型
 */
export type UnionToIntersection<U> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void
    ? I
    : never

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

/**
 * 联合类型转元组
 * T extends any触发分布式，形成函数的联合类型， UnionToIntersection 将联合类型转为交叉类型，ReturnType可以获取函数重载交叉的最后一个返回值类型
 * 之后使用Exculde从联合类型排除这个类型，继续获取最后一个返回值
 * 递归获取所有返回值类型，组成元组
 */
export type UnionToTuple<T> =
  UnionToIntersection<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends any ? () => T : never
  > extends () => infer ReturnType
    ? [...UnionToTuple<Exclude<T, ReturnType>>, ReturnType]
    : []
