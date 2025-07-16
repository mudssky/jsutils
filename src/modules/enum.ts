import { mapKeys } from '@/modules/object'

/**
 * 基础枚举对象接口
 */
interface EnumArrayObj {
  value: number | string
  label: string // 中文key，方便阅读
  displayText?: string // 展示的文字,只有和label不同的时候使用
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

/**
 * 基础枚举对象类型，用于更好的类型推断
 */
interface BaseEnumObj {
  value: string | number
  label: string
  displayText?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

/**
 * 从枚举数组中提取 value 的联合类型
 */
type ValueOf<T extends readonly EnumArrayObj[]> = T[number]['value']

/**
 * 从枚举数组中提取 label 的联合类型
 */
type LabelOf<T extends readonly EnumArrayObj[]> = T[number]['label']

/**
 * 外部数据类型，用于处理来自 API 等外部源的数据
 */
type ExternalValue = string | number | null | undefined

/**
 * 增强的标签类型，支持类型提示的同时兼容外部字符串
 */
type EnhancedLabel<T extends string> = T | (string & {})

/**
 * 枚举数组类，继承了Array
 * @template T 枚举数组类型
 */
class EnumArray<T extends readonly EnumArrayObj[]> extends Array<EnumArrayObj> {
  private readonly kvMap = new Map<unknown, ValueOf<T>>()
  private readonly vkMap = new Map<unknown, LabelOf<T>>()
  // 新增：性能优化的Map，直接存储完整对象，实现O(1)查找
  private readonly valueToItemMap = new Map<ValueOf<T>, T[number]>()
  private readonly labelToItemMap = new Map<LabelOf<T>, T[number]>()

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
      // 新增：构建性能优化的Map
      this.valueToItemMap.set(item.value, item)
      this.labelToItemMap.set(item.label, item)

      // 检查重复值，提供开发时警告
      if (process.env.NODE_ENV === 'development') {
        const existingByValue = this.valueToItemMap.get(item.value)
        const existingByLabel = this.labelToItemMap.get(item.label)
        if (existingByValue && existingByValue !== item) {
          console.warn(
            `EnumArray: Duplicate value '${item.value}' found in enum items`,
          )
        }
        if (existingByLabel && existingByLabel !== item) {
          console.warn(
            `EnumArray: Duplicate label '${item.label}' found in enum items`,
          )
        }
      }
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
  /**
   * 根据label获取完整的枚举对象 (性能优化: O(1))
   * @param label
   * @returns 返回匹配的完整对象，或 undefined
   */
  getItemByLabel(label: LabelOf<T>) {
    return this.labelToItemMap.get(label)
  }

  /**
   * 根据value获取完整的枚举对象 (性能优化: O(1))
   * @param value
   * @returns 返回匹配的完整对象，或 undefined
   */
  getItemByValue(value: ValueOf<T>) {
    return this.valueToItemMap.get(value)
  }

  /**
   * 根据label获取完整的枚举对象 (兼容性方法)
   * @deprecated 请使用 getItemByLabel，该方法性能更好
   * @param label
   * @returns
   */
  getItemByLabelLegacy(label: LabelOf<T>) {
    return this.find((item) => {
      return item.label === label
    })
  }

  /**
   * 根据value获取完整的枚举对象 (兼容性方法)
   * @deprecated 请使用 getItemByValue，该方法性能更好
   * @param value
   * @returns
   */
  getItemByValueLegacy(value: ValueOf<T>) {
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
   * @deprecated 建议直接使用 getKeyMappedList，迭代器模式在此场景下意义不大
   */
  getKeyMappedIter(mapDictionary: Record<string, string>) {
    return this.map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return mapKeys(item as any, (value: any, key: any) => {
        if (key in mapDictionary) {
          return mapDictionary[key]!
        }
        return key
      })
    }).values()
  }

  /**
   * 使用映射字典改变枚举类的键，返回新对象组成的数组
   * @param mapDictionary 键映射字典，例如 { value: 'id', label: 'name' }
   * @returns 映射后的对象数组
   */
  getKeyMappedList(mapDictionary: Record<string, string>) {
    return [...this.getKeyMappedIter(mapDictionary)]
  }
  /**
   * 使value和label用相同的值
   * @returns
   * @deprecated 该方法功能特殊，建议在外部通过 map 方法实现: myEnum.map(item => ({ ...item, value: item.label }))
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
    return Array.from(this, (item) => item.label) as LabelOf<T>[]
  }

  /**
   * 获取所有label的列表 (别名方法)
   */
  getLabels() {
    return this.getLabelList()
  }

  /**
   * 获取所有value的列表
   */
  getValues() {
    return Array.from(this, (item) => item.value) as ValueOf<T>[]
  }

  /**
   * 转换为普通数组
   * @deprecated EnumArray本身继承自Array，可以直接使用或用展开语法 [...myEnum]
   */
  toList() {
    return [...this.values()]
  }

  /**
   * 判断给定的外部值是否属于指定的label集合（支持外部数据）
   * @param value 要检查的值，可以是来自API等外部源的数据
   * @param labels 标签数组
   * @returns 如果value对应的label在labels中则返回true
   */
  isValueInLabels(
    value: ExternalValue,
    labels: readonly LabelOf<T>[],
  ): boolean {
    // 处理 null 和 undefined
    if (value === null || value === undefined) {
      return false
    }

    const currentLabel = this.getLabelByValue(value as ValueOf<T>)
    return currentLabel !== undefined && labels.includes(currentLabel)
  }

  /**
   * 判断给定的label是否在指定的label集合中（提供更好的类型提示）
   * 这个方法的核心优势是：在输入 label 参数时，会获得所有枚举内合法label的自动补全提示，
   * 同时它也接受任意普通字符串作为输入，实现了类型安全和开发便利性的完美平衡。
   * @param label 要检查的标签，输入时会获得自动补全
   * @param allowedLabels 包含所有期望的合法标签的数组
   * @returns 如果label不为null/undefined且存在于allowedLabels中，则返回true
   */
  isLabelIn(
    label: EnhancedLabel<LabelOf<T>>,
    allowedLabels: readonly LabelOf<T>[],
  ): boolean {
    if (label === null || label === undefined) {
      return false
    }

    // 类型断言是安全的，因为 BaseEnumObj 已经约束了 label 必须是 string
    return (allowedLabels as readonly string[]).includes(label)
  }

  /**
   * 判断枚举值匹配label列表中的某个label
   * @param labels
   * @param value
   * @returns
   * @deprecated 请使用 isValueInLabels(value, labels)，参数顺序更符合直觉且类型更安全
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

  /**
   * 根据label列表获取value列表
   * @param labels
   * @returns
   */
  getValuesByLabels(labels: LabelOf<T>[]) {
    return labels.map((label) => {
      return this.getValueByLabel(label)
    })
  }

  /**
   * 根据value列表获取label列表
   * @param values
   * @returns
   */
  getLabelsByValues(values: ValueOf<T>[]) {
    return values.map((value) => {
      return this.getLabelByValue(value)
    })
  }

  // 新增方法：获取任意属性值，保持类型安全
  /**
   * 根据value获取指定属性的值
   * @param value 枚举值
   * @param key 属性键名
   * @returns 属性值或undefined
   */
  getAttrByValue<K extends keyof T[number]>(
    value: ValueOf<T>,
    key: K,
  ): T[number][K] | undefined {
    return this.getItemByValue(value)?.[key]
  }

  /**
   * 根据label获取指定属性的值
   * @param label 枚举标签
   * @param key 属性键名
   * @returns 属性值或undefined
   */
  getAttrByLabel<K extends keyof T[number]>(
    label: LabelOf<T>,
    key: K,
  ): T[number][K] | undefined {
    return this.getItemByLabel(label)?.[key]
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
      color: '#1890ff'
    },
    {
      label: '女',
      value: 2,
      color: '#f5222d'
    },
  ] as const
  const sexEnum = createEnum(sexList)
  
  // 类型安全的属性访问
  const color = sexEnum.getAttrByValue(1, 'color') // 类型推断为 '#1890ff' | '#f5222d' | undefined
  const item = sexEnum.getItemByValue(1) // 完整的类型推断
 * ```
 */
function createEnum<T extends readonly EnumArrayObj[]>(enumsTuple: T) {
  return Object.freeze(new EnumArray(enumsTuple))
}

/**
 * 创建类型安全的枚举实例（推荐使用）
 * @param enumsTuple 枚举元组，必须使用 as const 断言
 * @returns 类型安全的不可变EnumArray实例
 * @example
 * ```ts
 * const statusList = [
 *   { label: '待审核', value: 1, color: '#faad14' },
 *   { label: '已通过', value: 2, color: '#52c41a' },
 *   { label: '已拒绝', value: 3, color: '#f5222d' }
 * ] as const
 *
 * const statusEnum = createTypedEnum(statusList)
 * // 完整的类型推断和智能提示
 * ```
 */
function createTypedEnum<const T extends readonly BaseEnumObj[]>(
  enumsTuple: T,
) {
  return Object.freeze(new EnumArray<T>(enumsTuple)) as Readonly<EnumArray<T>>
}

export { createEnum, createTypedEnum, EnumArray }
export type {
  BaseEnumObj,
  EnhancedLabel,
  EnumArrayObj,
  ExternalValue,
  LabelOf,
  ValueOf,
}
