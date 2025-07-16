/**
 * 枚举相关的通用类型定义
 * 注意：基础类型已在 enum.ts 中定义，这里只保留扩展类型
 */

// 枚举项的键类型
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EnumItemKey<T extends readonly any[]> = keyof T[number]

// 只读枚举数组类型
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReadonlyEnumArray<T extends readonly any[]> = readonly T[number][]

// 枚举映射字典类型
export type EnumMappingDict = Record<string, string>

// 枚举查找结果类型
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint, @typescript-eslint/no-explicit-any
export type EnumLookupResult<T extends any> = T | undefined
