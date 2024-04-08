/* eslint-disable @typescript-eslint/no-explicit-any */
// export type PropertyName = string | number | symbol
// keyof any默认是string | number | symbol，开启KeyofStringsOnly后只有string，这里这样用比写死更灵活
export type PropertyName = keyof any

export interface Dictionary<T> {
  [index: string]: T
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ObjectIterator<T extends object, TResult = any> = (
  value: T[keyof T],
  key: keyof T,
  obj: T,
) => TResult

/**
 * 空白字符的联合类型
 */
export type SpaceString = ' ' | '\t' | '\n'

export type AnyFunction = (...args: any) => any

export type AnyConstructor = new (...args: any) => any

export type Tuple<T = any> = readonly T[]
