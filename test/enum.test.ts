import { describe, expect, test } from 'vitest'
// 直接把根目录作为一个npm包引入
import { EnumArray, EnumArrayObj, createEnum } from '@mudssky/jsutils'

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
        value: true,
      },
      {
        label: '女',
        value: false,
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
    expect(list2Enum.getLabelByValue(true)).toEqual('男')
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
})
