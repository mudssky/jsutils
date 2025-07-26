import { SpaceString } from './global'

/**
 * 判断字符串是否以某个前缀开头
 * 模式匹配 $\{string\} 表示任意字符串
 */
export type StartsWith<
  Str extends string,
  Prefix extends string,
> = Str extends `${Prefix}${string}` ? true : false

/**
 * 使用模式匹配替换字符串类型
 */
export type Replace<
  Str extends string,
  From extends string,
  To extends string,
> = Str extends `${infer Prefix}${From}${infer Suffix}`
  ? `${Prefix}${To}${Suffix}`
  : Str

/**
 * 替换字符串中出现的全部匹配
 */
export type ReplaceAll<
  Str extends string,
  From extends string,
  To extends string,
> = Str extends `${infer Prefix}${From}${infer Suffix}`
  ? `${Prefix}${To}${ReplaceAll<Suffix, From, To>}`
  : Str

/**
 * 移除字符串前缀，不会递归调用
 */
export type TrimPrefix<
  Str extends string,
  Prefix extends string,
> = Str extends `${Prefix}${infer Rest}` ? Rest : Str

/**
 * 移除字符串后缀，不会递归调用
 */
export type TrimSuffix<
  Str extends string,
  Suffix extends string,
> = Str extends `${infer Rest}${Suffix}` ? Rest : Str

/**
 * 移除字符串右边的空白字符
 */
export type TrimRight<Str extends string> =
  Str extends `${infer Rest}${SpaceString}` ? TrimRight<Rest> : Str

/**
 * 移除字符串左边的空白字符
 */
export type TrimLeft<Str extends string> =
  Str extends `${SpaceString}${infer Rest}` ? TrimLeft<Rest> : Str

/**
 * 移除字符串两边的空白字符
 */
export type Trim<Str extends string> = TrimRight<TrimLeft<Str>>

/**
 * 反转字符串
 */
export type ReverseStr<
  Str extends string,
  Result extends string = '',
> = Str extends `${infer First}${infer Rest}`
  ? ReverseStr<Rest, `${First}${Result}`>
  : Result

/**
 * 获取字符串长度
 */
export type StrLen<
  Str extends string,
  CountArr extends unknown[] = [],
> = Str extends `${string}${infer Rest}`
  ? StrLen<Rest, [...CountArr, unknown]>
  : CountArr['length']

/**
 * 传入Block Element，Modifiers，生成所有BEM排列的联合类型
 * bem 是 css 命名规范，用 block__element--modifier 的形式来描述某个区块下面的某个元素的某个状态的样式。
 */
export type BEM<
  Block extends string,
  Element extends string[],
  Modifiers extends string[],
> = `${Block}__${Element[number]}--${Modifiers[number]}`

/**
 * 返回两个字符串字面量类型的所有组合
 */
export type Combination<A extends string, B extends string> =
  | A
  | B
  | `${A}${B}`
  | `${B}${A}`

/**
 * 字符串字面量联合类型，所有排列组合
 * A extends A触发分布式(条件类型左边是联合类型的时候就会触发)，将每一个字面量类型与其余的排列组合，
 * 分布式最后会拼起来就是所有排列
 */
export type AllCombinations<
  A extends string,
  B extends string = A,
> = A extends A ? Combination<A, AllCombinations<Exclude<B, A>>> : never

/**
 * KebabCase 字符串字面量转CamelCase
 */
export type KebabCaseToCamelCase<Str extends string> =
  Str extends `${infer Item}-${infer Rest}`
    ? `${Item}${KebabCaseToCamelCase<Capitalize<Rest>>}`
    : Str

/**
 * CamelCase 字符串字面量转KebabCase
 */
export type CamelCaseToKebabCase<Str extends string> =
  Str extends `${infer First}${infer Rest}`
    ? First extends Lowercase<First>
      ? `${First}${CamelCaseToKebabCase<Rest>}` // First是小写字母，跳过
      : `-${Lowercase<First>}${CamelCaseToKebabCase<Rest>}` // First是大写字母
    : Str

/**
 * 移除开头的字符
 */
export type TrimFirst<Str extends string> =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Str extends `${infer _}${infer Rest}` ? Rest : Str

/**
 * 用分隔符拼接元组为字符串
 */
export type JoinStr<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Items extends any[], //这里是方便传参
  Delimiter extends string,
  Result extends string = '',
> = Items extends [infer Cur, ...infer Rest]
  ? JoinStr<Rest, Delimiter, `${Result}${Delimiter}${Cur & string}`> // Cur 是 unknown 类型，要 & string 转成字符串类型
  : TrimFirst<Result> //因为最开始会在头部拼接分隔符，所以这里移除

/**
 * 转换数字字符串为数字
 * 使用infer extend 语法，这个语法是ts4.7引入，4.8完善可以推导字面量类型
 */
export type StrToNum<Str> = Str extends `${infer Num extends number}`
  ? Num
  : Str

/**
 * 转换布尔字符串为布尔值
 */
export type StrToBoolean<Str> = Str extends `${infer Bool extends boolean}`
  ? Bool
  : Str

/**
 * 转换null字符串为null
 */
export type StrToNull<Str> = Str extends `${infer Null extends null}`
  ? Null
  : Str
