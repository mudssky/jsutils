import { describe, expect, test } from 'vitest'
// 直接把根目录作为一个npm包引入
import { EnumArray, EnumArrayObj, createEnum } from '@mudssky/jsutil'

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
})
