import { describe, expect, test } from 'vitest'
// 直接把根目录作为一个npm包引入
import {
  EnumArray,
  EnumArrayObj,
  createEnum,
  createTypedEnum,
} from '@mudssky/jsutils'

describe('EnumArray', () => {
  const sexList = [
    {
      label: '男',
      value: 1,
      displayText: '性别男',
    },
    {
      label: '女',
      value: 2,
    },
  ] as const
  const sexEnum = createEnum(sexList)

  class CustomEnumArray<
    T extends readonly EnumArrayObj[],
  > extends EnumArray<T> {
    hello() {
      return 'hello'
    }
  }
  const customSexEnum = new CustomEnumArray(sexList)

  test('should return a enum array', () => {
    expect([...sexEnum]).toEqual(sexList)
  })
  test('value type', () => {
    const list1 = [
      {
        label: '男',
        value: 1,
      },
      {
        label: '女',
        value: 0,
      },
    ] as const
    const list2 = [
      {
        label: '男',
        value: 'true',
      },
      {
        label: '女',
        value: 'false',
      },
    ] as const

    const list3 = [
      {
        label: '男',
        value: '男',
      },
      {
        label: '女',
        value: '女',
      },
    ] as const
    const list1Enum = createEnum(list1)
    const list2Enum = createEnum(list2)
    const list3Enum = createEnum(list3)
    expect(list1Enum.getLabelByValue(1)).toEqual('男')
    expect(list2Enum.getLabelByValue('true')).toEqual('男')
    expect(list3Enum.getLabelByValue('男')).toEqual('男')
  })
  test('should compatible with array method', () => {
    // 返回的是一个生成器，还带两个map，所以要先用扩展运算符转变为数组才能相等
    expect([...sexEnum.filter((item) => item.label === '男')]).toEqual([
      sexList[0],
    ])
    expect(sexEnum.filter((item) => item.label === '男')[0]).toEqual(sexList[0])
    expect(sexEnum.find((item) => item.label === '男')).toEqual(sexList[0])
    expect(sexEnum.length).toEqual(sexList.length)
  })
  test('get label', () => {
    expect(sexEnum.getLabelByValue(2)).toEqual('女')
    expect(sexEnum.getLabelByValue(1)).toEqual('男')
  })

  test('get value', () => {
    expect(sexEnum.getValueByLabel('男')).toEqual(1)
    expect(sexEnum.getValueByLabel('女')).toEqual(2)
  })
  test('get item', () => {
    expect(sexEnum.getItemByLabel('男')).toEqual(sexEnum[0])
    expect(sexEnum.getItemByLabel('女')).toEqual(sexEnum[1])
    expect(sexEnum.getItemByValue(1)).toEqual(sexEnum[0])
    expect(sexEnum.getItemByValue(2)).toEqual(sexEnum[1])
  })
  test('get displayText', () => {
    expect(sexEnum.getDisplayTextByLabel('男')).toEqual(sexList[0].displayText)
    expect(sexEnum.getDisplayTextByValue(1)).toEqual(sexList[0].displayText)
    expect(sexEnum.getDisplayTextByLabel('女')).toEqual(sexList[1].label)
    expect(sexEnum.getDisplayTextByValue(2)).toEqual(sexList[1].label)
  })
  test('extends EnumArray', () => {
    expect(customSexEnum.hello()).toBe('hello')
  })
  test('getMappedList', () => {
    expect(
      sexEnum.getKeyMappedList({
        label: 'key',
      }),
    ).toEqual([
      { key: '男', value: 1, displayText: '性别男' },
      { key: '女', value: 2 },
    ])
  })

  test('getAllLabelList', () => {
    expect(sexEnum.getAllLabelList()).toEqual([
      { label: '男', value: '男', displayText: '性别男' },
      { label: '女', value: '女' },
    ])
  })
  test('getLabelList', () => {
    expect(sexEnum.getLabelList()).toEqual(['男', '女'])
  })

  test('getLabels', () => {
    expect(sexEnum.getLabels()).toEqual(['男', '女'])
  })

  test('getValues', () => {
    expect(sexEnum.getValues()).toEqual([1, 2])
  })
  test('isLabelsContainValue', () => {
    expect(sexEnum.isLabelsMatchValue(['女'], 2)).toEqual(true)
    expect(sexEnum.isLabelsMatchValue([], 2)).toEqual(false)
    expect(sexEnum.isLabelsMatchValue(['女'], 1)).toEqual(false)
  })

  test('isLabelsMatchLabel', () => {
    expect(sexEnum.isLabelsMatchLabel(['女'], '女')).toEqual(true)
    expect(sexEnum.isLabelsMatchLabel([], '女')).toEqual(false)
    expect(sexEnum.isLabelsMatchLabel(['男', '男'], '女')).toEqual(false)
  })
  test('getValuesByLabels', () => {
    expect(sexEnum.getValuesByLabels(['男'])).toEqual([1])
    expect(sexEnum.getValuesByLabels(['女'])).toEqual([2])
    expect(sexEnum.getValuesByLabels(['男', '女'])).toEqual([1, 2])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sexEnum.getValuesByLabels([undefined as any, '女'])).toEqual([
      undefined,
      2,
    ])
  })

  test('getLabelsByValues', () => {
    expect(sexEnum.getLabelsByValues([1])).toEqual(['男'])
    expect(sexEnum.getLabelsByValues([2])).toEqual(['女'])
    expect(sexEnum.getLabelsByValues([1, 2])).toEqual(['男', '女'])
  })

  // 新增测试：性能优化和新功能
  test('performance optimized getItemByValue and getItemByLabel', () => {
    // 测试O(1)性能的查找方法
    expect(sexEnum.getItemByValue(1)).toEqual(sexList[0])
    expect(sexEnum.getItemByValue(2)).toEqual(sexList[1])
    // @ts-expect-error 需要测试不合法数据
    expect(sexEnum.getItemByValue(999)).toBeUndefined()

    expect(sexEnum.getItemByLabel('男')).toEqual(sexList[0])
    expect(sexEnum.getItemByLabel('女')).toEqual(sexList[1])
    // @ts-expect-error 需要测试不合法数据
    expect(sexEnum.getItemByLabel('不存在')).toBeUndefined()
  })

  test('getAttrByValue and getAttrByLabel', () => {
    // 测试类型安全的属性访问
    // @ts-expect-error 需要测试不合法数据
    expect(sexEnum.getAttrByValue(1, 'displayText')).toBe('性别男')
    // @ts-expect-error 需要测试不合法数据
    expect(sexEnum.getAttrByValue(2, 'displayText')).toBeUndefined()
    expect(sexEnum.getAttrByValue(1, 'label')).toBe('男')
    // @ts-expect-error 需要测试不合法数据
    expect(sexEnum.getAttrByValue(999, 'label')).toBeUndefined()

    expect(sexEnum.getAttrByLabel('男', 'value')).toBe(1)
    expect(sexEnum.getAttrByLabel('女', 'value')).toBe(2)
    // @ts-expect-error 需要测试不合法数据
    expect(sexEnum.getAttrByLabel('男', 'displayText')).toBe('性别男')
    // @ts-expect-error 需要测试不合法数据
    expect(sexEnum.getAttrByLabel('不存在', 'value')).toBeUndefined()
  })

  test('isValueInLabels', () => {
    // 测试新的类型安全的判断方法
    expect(sexEnum.isValueInLabels(1, ['男'])).toBe(true)
    expect(sexEnum.isValueInLabels(2, ['女'])).toBe(true)
    expect(sexEnum.isValueInLabels(1, ['女'])).toBe(false)
    // 测试不合法数据
    expect(sexEnum.isValueInLabels(999, ['男', '女'])).toBe(false)
    expect(sexEnum.isValueInLabels(1, [])).toBe(false)
  })

  test('isLabelIn method', () => {
    // 测试基本功能
    expect(sexEnum.isLabelIn('男', ['男', '女'])).toBe(true)
    expect(sexEnum.isLabelIn('女', ['男'])).toBe(false)
    expect(sexEnum.isLabelIn('男', [])).toBe(false)

    // 测试外部字符串
    const externalLabel: string = '男'
    expect(sexEnum.isLabelIn(externalLabel, ['男', '女'])).toBe(true)

    const unknownLabel: string = '未知'
    expect(sexEnum.isLabelIn(unknownLabel, ['男', '女'])).toBe(false)

    // @ts-expect-error 测试不合法值
    expect(sexEnum.isLabelIn(null, ['男'])).toBe(false)
    // @ts-expect-error 测试不合法值
    expect(sexEnum.isLabelIn(undefined, ['男'])).toBe(false)
  })

  test('deprecated methods still work', () => {
    // 确保被标记为deprecated的方法仍然正常工作
    expect(sexEnum.isLabelsMatchValue(['女'], 2)).toBe(true)
    expect(sexEnum.isLabelsMatchLabel(['女'], '女')).toBe(true)
    expect(sexEnum.getValuesByLabels(['男', '女'])).toEqual([1, 2])
    expect(sexEnum.getLabelsByValues([1, 2])).toEqual(['男', '女'])
    expect(sexEnum.getAllLabelList()).toEqual([
      { label: '男', value: '男', displayText: '性别男' },
      { label: '女', value: '女' },
    ])
    expect(sexEnum.toList()).toEqual([...sexEnum])
  })

  test('createTypedEnum with enhanced type safety', () => {
    const statusList = [
      { label: '待审核', value: 1, color: '#faad14', priority: 'low' },
      { label: '已通过', value: 2, color: '#52c41a', priority: 'high' },
      { label: '已拒绝', value: 3, color: '#f5222d', priority: 'medium' },
    ] as const

    const statusEnum = createTypedEnum(statusList)
    // 测试类型安全的属性访问
    expect(statusEnum.getAttrByValue(1, 'color')).toBe('#faad14')
    expect(statusEnum.getAttrByValue(2, 'priority')).toBe('high')
    expect(statusEnum.getAttrByLabel('已拒绝', 'color')).toBe('#f5222d')

    // 测试完整对象返回
    const item = statusEnum.getItemByValue(1)
    expect(item).toEqual(statusList[0])
    expect(item?.color).toBe('#faad14')
    expect(item?.priority).toBe('low')
  })

  test('edge cases and error handling', () => {
    // 测试边界情况
    const emptyEnum = createEnum([] as const)
    expect(emptyEnum.length).toBe(0)
    // @ts-expect-error 需要测试不合法数据
    expect(emptyEnum.getItemByValue(1)).toBeUndefined()
    expect(emptyEnum.getLabels()).toEqual([])
    expect(emptyEnum.getValues()).toEqual([])

    // 测试单个元素的枚举
    const singleEnum = createEnum([{ label: '唯一', value: 'only' }] as const)
    expect(singleEnum.length).toBe(1)
    expect(singleEnum.getItemByValue('only')?.label).toBe('唯一')
    expect(singleEnum.isValueInLabels('only', ['唯一'])).toBe(true)
  })

  test('array inheritance and compatibility', () => {
    // 确保EnumArray仍然是一个有效的数组
    expect(Array.isArray(sexEnum)).toBe(true)
    expect(sexEnum instanceof Array).toBe(true)
    expect(sexEnum instanceof EnumArray).toBe(true)

    // 测试数组方法仍然可用 - slice返回普通数组
    const sliced = sexEnum.slice(0, 1)
    expect(sliced).toHaveLength(1)
    expect(sliced[0]).toEqual(sexList[0])

    // concat也返回普通数组
    expect(sexEnum.concat([{ label: '其他', value: 3 }])).toHaveLength(3)

    // 测试迭代器
    const labels = []
    for (const item of sexEnum) {
      labels.push(item.label)
    }
    expect(labels).toEqual(['男', '女'])

    // 测试数组索引访问
    expect(sexEnum[0]).toEqual(sexList[0])
    expect(sexEnum[1]).toEqual(sexList[1])
    expect(sexEnum.length).toBe(2)
  })
})
