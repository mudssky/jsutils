import { SpaceString } from './global'

/**
 * 判断字符串是否以某个前缀开头
 * 模式匹配 ${string} 表示任意字符串
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