/* eslint-disable @typescript-eslint/no-explicit-any */
// export type PropertyName = string | number | symbol
// keyof any默认是string | number | symbol，开启KeyofStringsOnly后只有string，这里这样用比写死更灵活
/**
 * @public
 */
export type PropertyName = keyof any

/**
 * @public
 */
export interface Dictionary<T> {
  [index: string]: T
}

/**
 * @public
 */
export type ObjectIterator<T extends object, TResult = any> = (
  value: T[keyof T],
  key: keyof T,
  obj: T,
) => TResult

/**
 * 空白字符的联合类型
 * @public
 */
export type SpaceString = ' ' | '\t' | '\n'

/**
 * @public
 */
export type AnyFunction = (...args: any) => any

/**
 * @public
 */
export type AnyConstructor = new (...args: any) => any

/**
 * @public
 */
export type Tuple<T = any> = readonly T[]

/**
 * @public
 */
export type AnyObject = Record<string, any>
