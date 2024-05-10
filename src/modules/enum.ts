import { mapKeys } from '@/modules/object'

// 枚举类型接口
interface EnumArrayObj {
  value: number | string
  label: string //中文key，方便阅读
  displayText?: string //展示的文字,只有和label不同的时候使用，
}

type ValueOf<T extends readonly EnumArrayObj[]> = T[number]['value']
type LabelOf<T extends readonly EnumArrayObj[]> = T[number]['label']

/**
 * 枚举数组类，继承了Array
 */
class EnumArray<T extends readonly EnumArrayObj[]> extends Array<EnumArrayObj> {
  private readonly kvMap = new Map<unknown, ValueOf<T>>()
  private readonly vkMap = new Map<unknown, LabelOf<T>>()

  /**
   * 传入一个符合EnumArrayObj的元组
   * @param list
   */
  constructor(list: T) {
    super(list.length)
    for (let i = 0; i < list.length; i++) {
      const item = list[i]
      this[i] = item
      this.kvMap.set(item.label, item.value)
      this.vkMap.set(item.value, item.label)
    }
  }

  /**
   * 根据value获取label
   * @param value 可以从创建枚举的所有value中选
   * @returns 返回value匹配的label
   */
  getLabelByValue(value: ValueOf<T>) {
    return this.vkMap.get(value)
  }

  /**
   * 根据label获取value
   * @param label
   * @returns
   */
  getValueByLabel(label: LabelOf<T>) {
    return this.kvMap.get(label)
  }
  getItemByLabel(label: LabelOf<T>) {
    return this.find((item) => {
      return item.label === label
    })
  }
  getItemByValue(value: ValueOf<T>) {
    return this.find((item) => {
      return item.value === value
    })
  }
  getDisplayTextByLabel(label: LabelOf<T>) {
    const item = this.getItemByLabel(label)
    return item?.displayText ?? label
  }
  getDisplayTextByValue(value: ValueOf<T>) {
    const item = this.getItemByValue(value)
    return item?.displayText ?? item?.label
  }

  /**
   * 使用映射字典改变枚举类的键
   * @param mapDictionary
   * @returns
   */
  getKeyMappedIter(mapDictionary: Record<string, string>) {
    return this.map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mapKeys(item, (value: any, key: string) => {
        if (key in mapDictionary) {
          return mapDictionary[key]!
        }
        return key
      })
    }).values()
  }
  getKeyMappedList(mapDictionary: Record<string, string>) {
    return [...this.getKeyMappedIter(mapDictionary)]
  }
  /**
   * 使value和label用相同的值
   * @returns
   */
  getAllLabelList() {
    return this.toList().map((item) => {
      return {
        ...item,
        value: item.label,
      }
    })
  }
  /**
   * 获取所有label的列表
   */
  getLabelList() {
    return this.toList().map((item) => {
      return item.label
    }) as LabelOf<T>[]
  }
  getLabels() {
    return this.getLabelList()
  }
  getValues() {
    return this.toList().map((item) => {
      return item.value
    }) as ValueOf<T>[]
  }
  toList() {
    return [...this.values()]
  }

  /**
   * 判断枚举值匹配label列表中的某个label
   * @param labels
   * @param value
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isLabelsMatchValue(labels: LabelOf<T>[], value?: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return labels.includes(this.getLabelByValue(value) as any)
  }
  /**
   * 判断label是否匹配列表，可以节省引入Type的时间
   * @param labels
   * @param label
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isLabelsMatchLabel(labels: LabelOf<T>[], label?: any) {
    return labels.includes(label)
  }
}

/**
 * 创建一个枚举元组，EnumArray继承了Array，所以可以用array的各种方法
 * @param enumsTuple 传入的枚举元组，需要用as const 修饰
 * @returns 返回不可变的EnumArray对象
 * @example
 * ```ts
 *  const sexList = [
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
 * ```
 */
function createEnum<T extends readonly EnumArrayObj[]>(enumsTuple: T) {
  return Object.freeze(new EnumArray(enumsTuple)) // 需要升级到typescript4.9才不会报错
  // return new EnumArray(enums)
}

export { EnumArray, createEnum }
export type { EnumArrayObj, LabelOf, ValueOf }
