/**
 * 使用值类型过滤索引类型
 */
export type FilterRecordByValue<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Obj extends Record<string, any>,
  ValueType,
> = {
  [Key in keyof Obj as Obj[Key] extends ValueType ? Key : never]: Obj[Key]
}
