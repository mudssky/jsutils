/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  EnhancedLabel,
  EnumArrayObj,
  EnumItemKey,
  EnumLookupResult,
  EnumMappingDict,
  ExternalValue,
  LabelOf,
  ReadonlyEnumArray,
  ValueOf,
} from '@mudssky/jsutils'
import { createEnum } from '@mudssky/jsutils'
import { assertType, test } from 'vitest'

// 测试用的枚举数据
const statusList = [
  { label: '待审核', value: 1, color: '#faad14' },
  { label: '已通过', value: 2, color: '#52c41a' },
  { label: '已拒绝', value: 3, color: '#f5222d' },
] as const

const sexList = [
  { label: '男', value: 1, displayText: '性别男', color: '#1890ff' },
  { label: '女', value: 2, color: '#f5222d' },
] as const

const statusEnum = createEnum(statusList)
const sexEnum = createEnum(sexList)

let n!: never

test('EnumArrayObj 类型测试', () => {
  // 基础接口类型检查
  const validEnum: EnumArrayObj = {
    value: 1,
    label: '测试',
    displayText: '测试文本',
    customProp: 'custom',
  }

  assertType<EnumArrayObj>(validEnum)

  // @ts-expect-error 缺少必需的 value 属性
  const invalidEnum1: EnumArrayObj = {
    label: '测试',
  }

  // @ts-expect-error 缺少必需的 label 属性
  const invalidEnum2: EnumArrayObj = {
    value: 1,
  }
})

// BaseEnumObj 类型已被移除，使用 EnumArrayObj 替代

test('ValueOf 和 LabelOf 类型提取', () => {
  // 测试 ValueOf 类型提取
  assertType<ValueOf<typeof statusList>>(1)
  assertType<ValueOf<typeof statusList>>(2)
  assertType<ValueOf<typeof statusList>>(3)

  // @ts-expect-error 4 不在枚举值中
  assertType<ValueOf<typeof statusList>>(4)

  // 测试 LabelOf 类型提取
  assertType<LabelOf<typeof statusList>>('待审核')
  assertType<LabelOf<typeof statusList>>('已通过')
  assertType<LabelOf<typeof statusList>>('已拒绝')

  // @ts-expect-error '未知状态' 不在枚举标签中
  assertType<LabelOf<typeof statusList>>('未知状态')
})

test('ExternalValue 类型测试', () => {
  // 外部数据类型应该接受常见的外部值
  assertType<ExternalValue>('string')
  assertType<ExternalValue>(123)
  assertType<ExternalValue>(null)
  assertType<ExternalValue>(undefined)

  // 对象不应该被接受，这里应该会产生类型错误
  // assertType<ExternalValue>({})

  // 数组不应该被接受，这里应该会产生类型错误
  // assertType<ExternalValue>([])
})

test('EnhancedLabel 类型测试', () => {
  type StatusLabels = LabelOf<typeof statusList>

  // 应该接受具体的枚举标签
  assertType<EnhancedLabel<StatusLabels>>('待审核')
  assertType<EnhancedLabel<StatusLabels>>('已通过')

  // 也应该接受任意字符串
  const externalLabel: string = '外部标签'
  assertType<EnhancedLabel<StatusLabels>>(externalLabel)

  // 数字不应该被接受，这里应该会产生类型错误
  // assertType<EnhancedLabel<StatusLabels>>(123)
})

test('isValueInLabels 方法类型测试', () => {
  // 应该接受外部数据类型
  const apiValue: string | null = '1'
  const result1 = statusEnum.isValueInLabels(apiValue, ['待审核', '已通过'])
  assertType<boolean>(result1)

  // 应该接受 undefined
  const undefinedValue: undefined = undefined
  const result2 = statusEnum.isValueInLabels(undefinedValue, ['待审核'])
  assertType<boolean>(result2)

  // 应该接受 null
  const nullValue: null = null
  const result3 = statusEnum.isValueInLabels(nullValue, ['待审核'])
  assertType<boolean>(result3)

  // 应该接受数字
  const numberValue: number = 1
  const result4 = statusEnum.isValueInLabels(numberValue, ['待审核'])
  assertType<boolean>(result4)
})

test('isLabelIn 方法类型测试', () => {
  // 应该提供类型提示并接受具体的枚举标签
  const result1 = statusEnum.isLabelIn('待审核', ['待审核', '已通过'])
  assertType<boolean>(result1)

  // 应该接受外部字符串
  const externalLabel: string = '外部标签'
  const result2 = statusEnum.isLabelIn(externalLabel, ['待审核', '已通过'])
  assertType<boolean>(result2)

  // 应该处理 null 和 undefined
  const result3 = statusEnum.isLabelIn(null as any, ['待审核'])
  assertType<boolean>(result3)
})

test('EnumItemKey 类型测试', () => {
  type StatusItemKey = EnumItemKey<typeof statusList>

  assertType<StatusItemKey>('label')
  assertType<StatusItemKey>('value')
  assertType<StatusItemKey>('color')

  // @ts-expect-error 'nonexistent' 不是有效的键
  assertType<StatusItemKey>('nonexistent')
})

test('ReadonlyEnumArray 类型测试', () => {
  type ReadonlyStatus = ReadonlyEnumArray<typeof statusList>

  const readonlyArray: ReadonlyStatus = statusList
  assertType<ReadonlyStatus>(readonlyArray)

  // @ts-expect-error 只读数组不能被修改
  readonlyArray.push({ label: '新状态', value: 4, color: '#000' })
})

test('EnumMappingDict 类型测试', () => {
  const mappingDict: EnumMappingDict = {
    value: 'id',
    label: 'name',
    color: 'backgroundColor',
  }

  assertType<EnumMappingDict>(mappingDict)

  // 值必须是字符串，这里应该会产生类型错误
  // const invalidDict: EnumMappingDict = {
  //   value: 123
  // }
})

test('EnumLookupResult 类型测试', () => {
  type ColorResult = EnumLookupResult<(typeof statusList)[0]>

  assertType<ColorResult>({ label: '待审核', value: 1, color: '#faad14' })
  assertType<ColorResult>(undefined)

  // @ts-expect-error 错误的类型
  assertType<ColorResult>(123)
})

test('createEnum 类型推断', () => {
  // createEnum 应该保持类型推断
  const enum1 = createEnum(statusList)
  assertType<any>(enum1)

  // 验证方法的类型推断
  const value = enum1.getValueByLabel('待审核')
  assertType<any>(value)

  const label = enum1.getLabelByValue(1)
  assertType<any>(label)
})

test('getAttrByValue 和 getAttrByLabel 类型安全', () => {
  // 测试 getAttrByValue 的类型推断
  const color1 = sexEnum.getAttrByValue(1, 'color')
  assertType<any>(color1)

  const label = sexEnum.getAttrByValue(1, 'label')
  assertType<any>(label)

  // 测试 getAttrByLabel 的类型推断
  const color2 = sexEnum.getAttrByLabel('男', 'color')
  assertType<any>(color2)
})

test('isEnumValue 类型守卫测试', () => {
  // 测试类型守卫的基本功能
  const unknownValue: unknown = 1

  if (statusEnum.isEnumValue(unknownValue)) {
    // 在这个分支中，unknownValue 应该被收窄为枚举的值类型
    assertType<ValueOf<typeof statusList>>(unknownValue)

    // 应该能够安全地使用收窄后的值
    const item = statusEnum.getItemByValue(unknownValue)
    assertType<(typeof statusList)[number] | undefined>(item)
  }

  // 测试返回值类型
  const result1 = statusEnum.isEnumValue(1)
  assertType<boolean>(result1)

  const result2 = statusEnum.isEnumValue('invalid')
  assertType<boolean>(result2)

  // 测试各种输入类型
  assertType<boolean>(statusEnum.isEnumValue(null))
  assertType<boolean>(statusEnum.isEnumValue(undefined))
  assertType<boolean>(statusEnum.isEnumValue({}))
  assertType<boolean>(statusEnum.isEnumValue([]))
})

test('isEnumLabel 类型守卫测试', () => {
  // 测试类型守卫的基本功能
  const unknownLabel: unknown = '待审核'

  if (statusEnum.isEnumLabel(unknownLabel)) {
    // 在这个分支中，unknownLabel 应该被收窄为枚举的标签类型
    assertType<LabelOf<typeof statusList>>(unknownLabel)

    // 应该能够安全地使用收窄后的标签
    const item = statusEnum.getItemByLabel(unknownLabel)
    assertType<(typeof statusList)[number] | undefined>(item)
  }

  // 测试返回值类型
  const result1 = statusEnum.isEnumLabel('待审核')
  assertType<boolean>(result1)

  const result2 = statusEnum.isEnumLabel('invalid')
  assertType<boolean>(result2)

  // 测试外部字符串类型
  const externalString: string = '待审核'
  if (statusEnum.isEnumLabel(externalString)) {
    // 外部字符串也应该被正确收窄
    assertType<LabelOf<typeof statusList>>(externalString)
  }

  // 测试各种输入类型
  assertType<boolean>(statusEnum.isEnumLabel(null))
  assertType<boolean>(statusEnum.isEnumLabel(undefined))
  assertType<boolean>(statusEnum.isEnumLabel(123))
  assertType<boolean>(statusEnum.isEnumLabel({}))
})

test('类型兼容性测试', () => {
  // EnumArray 应该兼容 Array
  const enumAsArray: Array<EnumArrayObj> = statusEnum
  assertType<Array<EnumArrayObj>>(enumAsArray)

  // 应该支持数组方法
  const mapped = statusEnum.map((item) => item.label)
  assertType<string[]>(mapped)

  const filtered = statusEnum.filter(
    (item) => typeof item.value === 'number' && item.value > 1,
  )
  assertType<EnumArrayObj[]>(filtered)
})
