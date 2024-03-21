export type PropertyName = string | number | symbol

export interface Dictionary<T> {
  [index: string]: T
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ObjectIterator<T extends object, TResult = any> = (
  value: T[keyof T],
  key: keyof T,
  obj: T,
) => TResult
