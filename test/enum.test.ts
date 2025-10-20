import { describe, expect, test, vi } from 'vitest'
// 直接把根目录作为一个npm包引入
import {
  EnumArray,
  EnumArrayObj,
  EnumCreationOptions,
  createEnum,
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

  const sexListWithAttr = [
    {
      label: '男',
      value: 1,
      displayText: '性别男',
      color: 'blue',
    },
    {
      label: '女',
      value: 2,
      color: 'red',
    },
  ] as const

  const sexEnumWithAttr = createEnum(sexListWithAttr)
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

    expect(sexEnumWithAttr.getAttrByValue(1, 'color')).toBe('blue')
    expect(sexEnumWithAttr.getAttrByValue(2, 'color')).toBe('red')
  })

  test('getItemByAttr', () => {
    expect(sexEnumWithAttr.getItemByAttr('color', 'blue')).toEqual(
      sexListWithAttr[0],
    )
    expect(sexEnumWithAttr.getItemByAttr('color', 'red')).toEqual(
      sexListWithAttr[1],
    )
    // 非法值
    expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sexEnumWithAttr.getItemByAttr('color', 'green' as any),
    ).toBeUndefined()

    // 使用已有的基础属性进行匹配
    expect(sexEnum.getItemByAttr('label', '男')).toEqual(sexList[0])
    expect(sexEnum.getItemByAttr('value', 2)).toEqual(sexList[1])
  })

  test('isAttrInLabels', () => {
    expect(sexEnumWithAttr.isAttrInLabels('color', 'blue', ['男'])).toBe(true)
    expect(sexEnumWithAttr.isAttrInLabels('color', 'red', ['女'])).toBe(true)
    expect(sexEnumWithAttr.isAttrInLabels('color', 'blue', ['女'])).toBe(false)
    expect(sexEnumWithAttr.isAttrInLabels('color', 'red', ['男'])).toBe(false)

    // 不合法或不存在的数据
    expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sexEnumWithAttr.isAttrInLabels('color', 'green' as any, ['男', '女']),
    ).toBe(false)
    // @ts-expect-error 需要测试不合法数据
    expect(sexEnumWithAttr.isAttrInLabels('color', null, ['男'])).toBe(false)
    // @ts-expect-error 需要测试不合法数据
    expect(sexEnumWithAttr.isAttrInLabels('color', undefined, ['男'])).toBe(
      false,
    )

    // 使用基础属性进行判断
    expect(sexEnum.isAttrInLabels('value', 1, ['男'])).toBe(true)
    expect(sexEnum.isAttrInLabels('value', 1, ['女'])).toBe(false)
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

  describe('EnumArray.match() chainable API', () => {
    test('should correctly match using .value().labelIsIn()', () => {
      expect(sexEnum.match().value(1).labelIsIn(['男'])).toBe(true)
      expect(sexEnum.match().value(2).labelIsIn(['男'])).toBe(false)
      expect(sexEnum.match().value(999).labelIsIn(['男', '女'])).toBe(false)
    })

    test('should correctly match using .label().labelIsIn()', () => {
      expect(sexEnum.match().label('男').labelIsIn(['男'])).toBe(true)
      expect(sexEnum.match().label('女').labelIsIn(['男'])).toBe(false)
      const externalLabel: string = '女'
      expect(sexEnum.match().label(externalLabel).labelIsIn(['男', '女'])).toBe(
        true,
      )
    })

    test('should correctly match using .attr().labelIsIn()', () => {
      expect(
        sexEnumWithAttr.match().attr('color', 'blue').labelIsIn(['男']),
      ).toBe(true)
      expect(
        sexEnumWithAttr.match().attr('color', 'red').labelIsIn(['男']),
      ).toBe(false)
      expect(
        sexEnumWithAttr.match().attr('color', 'blue').labelIsIn(['男', '女']),
      ).toBe(true)
    })

    test('should return false for empty allowedLabels', () => {
      expect(sexEnum.match().value(1).labelIsIn([])).toBe(false)
      expect(sexEnum.match().label('男').labelIsIn([])).toBe(false)
      expect(sexEnumWithAttr.match().attr('color', 'blue').labelIsIn([])).toBe(
        false,
      )
    })
  })

  describe.skip('matchesLabel method (deprecated)', () => {
    test('matchesLabel - value 模式', () => {
      // 基本功能与边界情况
      expect(sexEnum.matchesLabel({ type: 'value', value: 1 }, ['男'])).toBe(
        true,
      )
      expect(sexEnum.matchesLabel({ type: 'value', value: 2 }, ['男'])).toBe(
        false,
      )
      expect(
        sexEnum.matchesLabel({ type: 'value', value: 999 }, ['男', '女']),
      ).toBe(false)

      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sexEnum.matchesLabel({ type: 'value', value: null as any }, ['男']),
      ).toBe(false)

      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sexEnum.matchesLabel({ type: 'value', value: undefined as any }, [
          '男',
        ]),
      ).toBe(false)
      // 外部字符串类型但枚举值为number，应返回false
      expect(
        sexEnum.matchesLabel({ type: 'value', value: '1' }, ['男', '女']),
      ).toBe(false)
    })

    test('matchesLabel - label 模式', () => {
      expect(
        sexEnum.matchesLabel({ type: 'label', label: '男' }, ['男', '女']),
      ).toBe(true)
      expect(sexEnum.matchesLabel({ type: 'label', label: '女' }, ['男'])).toBe(
        false,
      )

      const externalLabel: string = '男'
      expect(
        sexEnum.matchesLabel({ type: 'label', label: externalLabel }, [
          '男',
          '女',
        ]),
      ).toBe(true)

      const unknownLabel: string = '未知'
      expect(
        sexEnum.matchesLabel({ type: 'label', label: unknownLabel }, [
          '男',
          '女',
        ]),
      ).toBe(false)

      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sexEnum.matchesLabel({ type: 'label', label: null as any }, ['男']),
      ).toBe(false)
      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sexEnum.matchesLabel({ type: 'label', label: undefined as any }, [
          '男',
        ]),
      ).toBe(false)
    })

    test('matchesLabel - attr 模式', () => {
      // 复杂属性
      expect(
        sexEnumWithAttr.matchesLabel(
          { type: 'attr', key: 'color', value: 'blue' },
          ['男'],
        ),
      ).toBe(true)
      expect(
        sexEnumWithAttr.matchesLabel(
          { type: 'attr', key: 'color', value: 'red' },
          ['男'],
        ),
      ).toBe(false)
      // 非法/不存在的属性值
      expect(
        sexEnumWithAttr.matchesLabel(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { type: 'attr', key: 'color', value: 'green' as any },
          ['男', '女'],
        ),
      ).toBe(false)
      expect(
        sexEnumWithAttr.matchesLabel(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { type: 'attr', key: 'color', value: null as any },
          ['男'],
        ),
      ).toBe(false)
      expect(
        sexEnumWithAttr.matchesLabel(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { type: 'attr', key: 'color', value: undefined as any },
          ['男'],
        ),
      ).toBe(false)

      // 基础属性走 O(1) 快路径
      expect(
        sexEnum.matchesLabel({ type: 'attr', key: 'value', value: 1 }, ['男']),
      ).toBe(true)
      expect(
        sexEnum.matchesLabel({ type: 'attr', key: 'label', value: '女' }, [
          '女',
        ]),
      ).toBe(true)
    })
  })

  test('isEnumValue type guard', () => {
    // 测试基本类型守卫功能
    expect(sexEnum.isEnumValue(1)).toBe(true)
    expect(sexEnum.isEnumValue(2)).toBe(true)
    expect(sexEnum.isEnumValue(3)).toBe(false)
    expect(sexEnum.isEnumValue('1')).toBe(false)
    expect(sexEnum.isEnumValue(null)).toBe(false)
    expect(sexEnum.isEnumValue(undefined)).toBe(false)
    expect(sexEnum.isEnumValue({})).toBe(false)
    expect(sexEnum.isEnumValue([])).toBe(false)

    // 测试类型收窄功能
    const unknownValue: unknown = 1
    if (sexEnum.isEnumValue(unknownValue)) {
      // 在这个分支中，unknownValue 应该被收窄为枚举的值类型
      expect(typeof unknownValue).toBe('number')
      expect(sexEnum.getItemByValue(unknownValue)).toBeDefined()
    }

    // 测试边界情况
    const mixedValues = [1, 2, 3, '男', null, undefined, {}]
    const validValues = mixedValues.filter((v) => sexEnum.isEnumValue(v))
    expect(validValues).toEqual([1, 2])

    // 测试数字边界情况
    expect(sexEnum.isEnumValue(0)).toBe(false)
    expect(sexEnum.isEnumValue(-1)).toBe(false)
    expect(sexEnum.isEnumValue(NaN)).toBe(false)
    expect(sexEnum.isEnumValue(Infinity)).toBe(false)
    expect(sexEnum.isEnumValue(-Infinity)).toBe(false)

    // 测试字符串类型的枚举值
    const stringEnum = createEnum([
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ] as const)

    expect(stringEnum.isEnumValue('active')).toBe(true)
    expect(stringEnum.isEnumValue('inactive')).toBe(true)
    expect(stringEnum.isEnumValue('pending')).toBe(false)
    expect(stringEnum.isEnumValue('')).toBe(false)

    // 测试混合类型的枚举值
    const mixedEnum = createEnum([
      { label: 'Number', value: 1 },
      { label: 'String', value: 'str' },
      { label: 'Zero', value: 0 },
    ] as const)

    expect(mixedEnum.isEnumValue(1)).toBe(true)
    expect(mixedEnum.isEnumValue('str')).toBe(true)
    expect(mixedEnum.isEnumValue(0)).toBe(true)
    expect(mixedEnum.isEnumValue(2)).toBe(false)
    expect(mixedEnum.isEnumValue('other')).toBe(false)
  })

  test('isEnumLabel type guard', () => {
    // 测试基本类型守卫功能
    expect(sexEnum.isEnumLabel('男')).toBe(true)
    expect(sexEnum.isEnumLabel('女')).toBe(true)
    expect(sexEnum.isEnumLabel('其他')).toBe(false)
    expect(sexEnum.isEnumLabel(1)).toBe(false)
    expect(sexEnum.isEnumLabel(null)).toBe(false)
    expect(sexEnum.isEnumLabel(undefined)).toBe(false)

    // 测试类型收窄功能
    const unknownLabel: unknown = '男'
    if (sexEnum.isEnumLabel(unknownLabel)) {
      // 在这个分支中，unknownLabel 应该被收窄为枚举的标签类型
      expect(typeof unknownLabel).toBe('string')
      expect(sexEnum.getItemByLabel(unknownLabel)).toBeDefined()
    }

    // 测试外部字符串
    const externalString: string = '女'
    expect(sexEnum.isEnumLabel(externalString)).toBe(true)

    const invalidString: string = '未知性别'
    expect(sexEnum.isEnumLabel(invalidString)).toBe(false)

    // 测试边界情况
    const mixedLabels = ['男', '女', '其他', 1, null, undefined, {}]
    const validLabels = mixedLabels.filter((l) => sexEnum.isEnumLabel(l))
    expect(validLabels).toEqual(['男', '女'])

    // 测试特殊字符串情况
    expect(sexEnum.isEnumLabel(' 男 ')).toBe(false) // 包含空格
    expect(sexEnum.isEnumLabel('男\n')).toBe(false) // 包含换行符
    expect(sexEnum.isEnumLabel('MAN')).toBe(false) // 大小写敏感

    // 测试包含特殊字符的标签
    const specialEnum = createEnum([
      { label: 'test-label', value: 1 },
      { label: 'test_label', value: 2 },
      { label: 'test.label', value: 3 },
      { label: 'test label', value: 4 },
      { label: '测试-标签', value: 5 },
    ] as const)

    expect(specialEnum.isEnumLabel('test-label')).toBe(true)
    expect(specialEnum.isEnumLabel('test_label')).toBe(true)
    expect(specialEnum.isEnumLabel('test.label')).toBe(true)
    expect(specialEnum.isEnumLabel('test label')).toBe(true)
    expect(specialEnum.isEnumLabel('测试-标签')).toBe(true)

    expect(specialEnum.isEnumLabel('test')).toBe(false)
    expect(specialEnum.isEnumLabel('label')).toBe(false)

    // 测试空字符串和特殊值
    const edgeCaseEnum = createEnum([
      { label: '', value: 1 }, // 空字符串标签
      { label: '0', value: 2 }, // 字符串数字
      { label: 'null', value: 3 }, // 字符串null
      { label: 'undefined', value: 4 }, // 字符串undefined
    ] as const)

    expect(edgeCaseEnum.isEnumLabel('')).toBe(true)
    expect(edgeCaseEnum.isEnumLabel('0')).toBe(true)
    expect(edgeCaseEnum.isEnumLabel('null')).toBe(true)
    expect(edgeCaseEnum.isEnumLabel('undefined')).toBe(true)

    // 实际的null和undefined应该返回false
    expect(edgeCaseEnum.isEnumLabel(null)).toBe(false)
    expect(edgeCaseEnum.isEnumLabel(undefined)).toBe(false)
    expect(edgeCaseEnum.isEnumLabel(0)).toBe(false)
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

  test('createEnum with enhanced type safety', () => {
    const statusList = [
      { label: '待审核', value: 1, color: '#faad14', priority: 'low' },
      { label: '已通过', value: 2, color: '#52c41a', priority: 'high' },
      { label: '已拒绝', value: 3, color: '#f5222d', priority: 'medium' },
    ] as const

    const statusEnum = createEnum(statusList)
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

    // 测试更多数组方法
    const mapped = sexEnum.map((item) => item.label)
    // map方法返回的是EnumArray，需要转换为普通数组进行比较
    expect([...mapped]).toEqual(['男', '女'])
    expect(mapped.length).toBe(2)

    const filtered = sexEnum.filter((item) => (item.value as number) > 1)
    expect(filtered).toHaveLength(1)
    expect(filtered[0]).toEqual(sexList[1])

    // 测试 reduce
    const totalValue = sexEnum.reduce(
      (sum, item) => sum + (item.value as number),
      0,
    )
    expect(totalValue).toBe(3)

    // 测试 some 和 every
    expect(sexEnum.some((item) => (item.value as number) > 1)).toBe(true)
    expect(sexEnum.every((item) => typeof item.value === 'number')).toBe(true)

    // 测试 includes (注意：这里测试的是对象引用)
    expect(sexEnum.includes(sexEnum[0])).toBe(true)

    // 测试 indexOf 和 lastIndexOf
    expect(sexEnum.indexOf(sexEnum[1])).toBe(1)
    expect(sexEnum.lastIndexOf(sexEnum[0])).toBe(0)
  })

  test('performance and large dataset', () => {
    // 创建大数据集
    const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
      label: `Label${i}`,
      value: i,
      category: `Category${i % 10}`,
    }))

    const largeEnum = createEnum(largeDataSet)

    // 测试查找性能
    const startTime = performance.now()

    // 执行多次查找操作
    for (let i = 0; i < 100; i++) {
      const randomValue = Math.floor(Math.random() * 1000)
      largeEnum.getLabelByValue(randomValue)
      largeEnum.getItemByValue(randomValue)
      largeEnum.isEnumValue(randomValue)
    }

    const endTime = performance.now()
    const duration = endTime - startTime

    // 性能应该在合理范围内（100次操作应该在100ms内完成）
    expect(duration).toBeLessThan(100)

    // 验证功能正确性
    expect(largeEnum.getLabelByValue(500)).toBe('Label500')
    expect(largeEnum.isEnumValue(999)).toBe(true)
    expect(largeEnum.isEnumValue(1000)).toBe(false)
  })

  test('duplicate values handling', () => {
    // 测试重复值的处理（实际行为：后面的值会覆盖前面的值）
    const duplicateEnum = createEnum([
      { label: 'First', value: 1 },
      { label: 'Second', value: 1 }, // 重复值
      { label: 'Third', value: 2 },
    ] as const)

    // 实际返回最后一个匹配的标签（后面覆盖前面）
    expect(duplicateEnum.getLabelByValue(1)).toBe('Second')
    expect(duplicateEnum.getItemByValue(1)?.label).toBe('Second')

    // 但是数组中仍然包含所有项目
    expect(duplicateEnum.length).toBe(3)
    expect(duplicateEnum[0].label).toBe('First')
    expect(duplicateEnum[1].label).toBe('Second')
  })

  describe('immutability protection', () => {
    const testEnum = createEnum([
      { label: 'A', value: 1 },
      { label: 'B', value: 2 },
    ] as const)

    test('should throw error when calling push()', () => {
      expect(() => {
        testEnum.push({ label: 'C', value: 3 })
      }).toThrow(
        "EnumArray Error: Cannot call '.push()' on an immutable EnumArray instance",
      )
    })

    test('should throw error when calling pop()', () => {
      expect(() => {
        testEnum.pop()
      }).toThrow(
        "EnumArray Error: Cannot call '.pop()' on an immutable EnumArray instance",
      )
    })

    test('should throw error when calling splice()', () => {
      expect(() => {
        testEnum.splice(0, 1)
      }).toThrow(
        "EnumArray Error: Cannot call '.splice()' on an immutable EnumArray instance",
      )
    })

    test('should throw error when calling shift()', () => {
      expect(() => {
        testEnum.shift()
      }).toThrow(
        "EnumArray Error: Cannot call '.shift()' on an immutable EnumArray instance",
      )
    })

    test('should throw error when calling unshift()', () => {
      expect(() => {
        testEnum.unshift({ label: 'Z', value: 0 })
      }).toThrow(
        "EnumArray Error: Cannot call '.unshift()' on an immutable EnumArray instance",
      )
    })

    test('should throw error when calling sort()', () => {
      expect(() => {
        testEnum.sort()
      }).toThrow(
        "EnumArray Error: Cannot call '.sort()' on an immutable EnumArray instance",
      )
    })

    test('should throw error when calling reverse()', () => {
      expect(() => {
        testEnum.reverse()
      }).toThrow(
        "EnumArray Error: Cannot call '.reverse()' on an immutable EnumArray instance",
      )
    })

    test('should throw error when calling fill()', () => {
      expect(() => {
        testEnum.fill({ label: 'X', value: 99 })
      }).toThrow(
        "EnumArray Error: Cannot call '.fill()' on an immutable EnumArray instance",
      )
    })

    test('should throw error when calling copyWithin()', () => {
      expect(() => {
        testEnum.copyWithin(0, 1)
      }).toThrow(
        "EnumArray Error: Cannot call '.copyWithin()' on an immutable EnumArray instance",
      )
    })

    test('should provide helpful error message with solution', () => {
      expect(() => {
        testEnum.push({ label: 'C', value: 3 })
      }).toThrow(
        'If you need a new enum with modified data, please create a new instance with createEnum()',
      )
    })

    test('should still allow safe read-only operations', () => {
      // 这些操作应该正常工作
      expect(testEnum.length).toBe(2)
      expect(testEnum[0].label).toBe('A')
      expect(testEnum.getLabelByValue(1)).toBe('A')
      expect([...testEnum.map((item) => item.label)]).toEqual(['A', 'B'])
      expect(
        testEnum.filter((item) => (item.value as number) > 1),
      ).toHaveLength(1)
    })
  })

  describe('configurable duplicate checking', () => {
    const duplicateList = [
      { label: '待处理', value: 1 },
      { label: '处理中', value: 2 },
      { label: '待处理', value: 3 }, // label 重复
      { label: '已完成', value: 2 }, // value 重复
    ] as const

    test('should check duplicates in development mode by default', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      createEnum(duplicateList)

      expect(consoleSpy).toHaveBeenCalledWith(
        "EnumArray: Duplicate label '待处理' found in enum items. (checkLevel: 'development')",
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        "EnumArray: Duplicate value '2' found in enum items. (checkLevel: 'development')",
      )

      consoleSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    test('should not check duplicates in production mode by default', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      createEnum(duplicateList)

      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    test('should always check duplicates when checkDuplicates is "always"', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      createEnum(duplicateList, { checkDuplicates: 'always' })

      expect(consoleSpy).toHaveBeenCalledWith(
        "EnumArray: Duplicate label '待处理' found in enum items. (checkLevel: 'always')",
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        "EnumArray: Duplicate value '2' found in enum items. (checkLevel: 'always')",
      )

      consoleSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    test('should always check duplicates when checkDuplicates is true (boolean)', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      createEnum(duplicateList, { checkDuplicates: true })

      expect(consoleSpy).toHaveBeenCalledWith(
        "EnumArray: Duplicate label '待处理' found in enum items. (checkLevel: 'true')",
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        "EnumArray: Duplicate value '2' found in enum items. (checkLevel: 'true')",
      )

      consoleSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    test('should never check duplicates when checkDuplicates is "never"', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      createEnum(duplicateList, { checkDuplicates: 'never' })

      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    test('should never check duplicates when checkDuplicates is false (boolean)', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      createEnum(duplicateList, { checkDuplicates: false })

      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    test('should work with EnumArray constructor directly', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      new EnumArray(duplicateList, { checkDuplicates: 'never' })

      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    test('should handle configuration methods correctly', () => {
      const testEnum = new EnumArray([
        { label: 'A', value: 1 },
        { label: 'B', value: 2 },
      ] as const)

      // 测试私有方法的逻辑（通过公共接口间接测试）
      expect(
        testEnum.shouldPerformDuplicateCheck({ checkDuplicates: 'always' }),
      ).toBe(true)
      expect(
        testEnum.shouldPerformDuplicateCheck({ checkDuplicates: 'never' }),
      ).toBe(false)
      expect(
        testEnum.shouldPerformDuplicateCheck({ checkDuplicates: true }),
      ).toBe(true)
      expect(
        testEnum.shouldPerformDuplicateCheck({ checkDuplicates: false }),
      ).toBe(false)

      const originalEnv = process.env.NODE_ENV

      process.env.NODE_ENV = 'development'
      expect(
        testEnum.shouldPerformDuplicateCheck({
          checkDuplicates: 'development',
        }),
      ).toBe(true)
      expect(testEnum.shouldPerformDuplicateCheck()).toBe(true) // 默认值

      process.env.NODE_ENV = 'production'
      expect(
        testEnum.shouldPerformDuplicateCheck({
          checkDuplicates: 'development',
        }),
      ).toBe(false)
      expect(testEnum.shouldPerformDuplicateCheck()).toBe(false) // 默认值

      process.env.NODE_ENV = originalEnv
    })

    test('should maintain backward compatibility', () => {
      // 不传 options 参数应该和之前的行为一致
      const enum1 = createEnum([
        { label: 'A', value: 1 },
        { label: 'B', value: 2 },
      ] as const)

      const enum2 = createEnum(
        [
          { label: 'A', value: 1 },
          { label: 'B', value: 2 },
        ] as const,
        undefined,
      )

      expect(enum1.getLabelByValue(1)).toBe('A')
      expect(enum2.getLabelByValue(1)).toBe('A')
      expect(enum1.length).toBe(enum2.length)
    })

    test('should provide helpful error messages with checkLevel info', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      createEnum(duplicateList, { checkDuplicates: 'always' })

      // 验证错误消息包含 checkLevel 信息
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("(checkLevel: 'always')"),
      )

      consoleSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    test('should handle edge cases in configuration', () => {
      // 测试空配置对象
      const enum1 = createEnum(
        [{ label: 'A', value: 1 }] as const,
        {} as EnumCreationOptions,
      )
      expect(enum1.getLabelByValue(1)).toBe('A')

      // 测试 undefined checkDuplicates
      const enum2 = createEnum([{ label: 'A', value: 1 }] as const, {
        checkDuplicates: undefined,
      })
      expect(enum2.getLabelByValue(1)).toBe('A')
    })
  })
})
