/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 使用值类型过滤索引类型
 */
export type FilterRecordByValue<Obj extends Record<string, any>, ValueType> = {
  [Key in keyof Obj as Obj[Key] extends ValueType ? Key : never]: Obj[Key]
}

/**
 * 提取Record中的可选索引
 * 注意可选在ts里不等于值可能为undefined吗，虽然在js里是一样的
 * 即\{age: number | undefined \} 和 \{ age?: number \} 不相等
 * 可选表示可以没有这个索引
 */

export type ExtractOptional<Obj extends Record<string, any>> = {
  [Key in keyof Obj as Record<string, any> extends Pick<Obj, Key>
    ? Key
    : never]: Obj[Key]
}

/**
 * 判断Record的某个key是否为必选，也就是排除可选
 * 可选的可以用Record\<string,any\> ，也就是空的索引\{\} extends来判断
 */

export type IsRequired<Key extends keyof Obj, Obj extends Record<string, any>> =
  Record<string, any> extends Pick<Obj, Key> ? false : true

/**
 * 提取Record中的必选索引
 */

export type ExtractRequired<Obj extends Record<string, any>> = {
  [Key in keyof Obj as IsRequired<Key, Obj> extends true
    ? Key
    : never]: Obj[Key]
}

/**
 * 移除索引签名
 * 即 [key:string]:any
 * 这个允许任意key
 *
 * 这里利用了索引签名不能构造字面量类型（因为没有名字）
 */

export type RemoveIndexSignature<Obj extends Record<string, any>> = {
  [Key in keyof Obj as Key extends `${infer Str}` ? Str : never]: Obj[Key]
}

/**
 * ts的类型会在使用时才计算
 * 这个拷贝触发类型计算，计算出最后的索引类型
 */

export type CopyRecord<Obj extends Record<string, any>> = {
  [Key in keyof Obj]: Obj[Key]
}

/**
 * 执行Record的部分key为可选
 */
export type PartialBy<
  Obj extends Record<string, any>,
  Key extends keyof any,
> = CopyRecord<Partial<Pick<Obj, Extract<keyof Obj, Key>>> & Omit<Obj, Key>>

/**
 * 获取Record的所有key的路径的联合类型
 */

export type AllKeyPath<Obj extends Record<string, any>> = {
  [Key in keyof Obj]: Key extends string
    ? Obj[Key] extends Record<string, any>
      ? Key | `${Key}.${AllKeyPath<Obj[Key]>}`
      : Key
    : never
}[keyof Obj]

/**
 * 递归给对象字面量类型，添加Record\<string, any\>，即每一层可以额外添加任意字段
 */
export type DeepRecord<Obj extends Record<string, any>> = {
  [Key in keyof Obj]: Obj[Key] extends Record<string, any>
    ? DeepRecord<Obj[Key]> & Record<string, any>
    : Obj[Key]
} & Record<string, any>

/**
 * 给对象字面量类型所有key添加前缀
 */
export type PrefixKeyBy<
  Obj extends Record<string, any>,
  Prefix extends string,
> = {
  [Key in keyof Obj as `${Prefix}${Key & string}`]: Obj[Key]
}
