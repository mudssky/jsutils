import { mapKeys } from '@/modules/object'

/**
 * 基础枚举对象类型，用于更好的类型推断
 * @public
 */
interface BaseEnumObj {
  /** 枚举值，可以是字符串或数字 */
  value: string | number
  /** 枚举标签，用于显示 */
  label: string
  /** 可选的显示文本，用于覆盖默认的label显示 */
  displayText?: string
  /** 允许任意其他属性，以实现完全的类型推断 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

/**
 * 枚举创建时的配置项
 * @public
 */
interface EnumCreationOptions {
  /**
   * 配置重复 value 和 label 的检查级别
   * - `true`:  等同于 'always'，强制始终检查
   * - `false`: 等同于 'never'，强制从不检查
   * - 'development': (默认值) 仅在 process.env.NODE_ENV === 'development' 时检查
   * - 'always': 始终进行检查
   * - 'never': 从不进行检查
   */
  checkDuplicates?: boolean | 'always' | 'never' | 'development'
}

/**
 * 基础枚举对象接口
 * @public
 */
type EnumArrayObj = BaseEnumObj

/**
 * 从枚举数组中提取 value 的联合类型
 * @template T - 枚举数组类型
 * @public
 */
type ValueOf<T extends readonly EnumArrayObj[]> = T[number]['value']

/**
 * 从枚举数组中提取 label 的联合类型
 * @template T - 枚举数组类型
 * @public
 */
type LabelOf<T extends readonly EnumArrayObj[]> = T[number]['label']

type AttributeOf<T extends readonly EnumArrayObj[]> = Extract<
  keyof T[number],
  string
>
/**
 * 外部数据类型，用于处理来自 API 等外部源的数据
 * @public
 */
type ExternalValue = string | number | null | undefined

/**
 * 增强的标签类型，支持类型提示的同时兼容外部字符串
 * @template T - 字符串类型
 * @public
 */
type EnhancedLabel<T extends string> = T | (string & {})

/**
 * @internal
 *
 * 链式调用的终结者，用于执行最终的匹配操作
 */
class EnumMatcher<T extends readonly EnumArrayObj[], U> {
  constructor(
    private readonly enumArray: EnumArray<T>,
    private readonly matcher: U,
  ) {}

  /**
   * 检查当前匹配项的标签是否存在于指定的标签列表中
   * @param labels - 允许的标签数组
   * @returns 如果匹配项的标签在允许的列表中，则返回 true
   */
  labelIsIn(labels: readonly LabelOf<T>[]): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.enumArray.matchesLabel(this.matcher as any, labels)
  }
}

/**
 * @internal
 *
 * 枚举匹配器的构建器，用于启动链式调用
 *
 * 由 `EnumArray.match()` 方法返回，提供 `.value()`、`.label()` 和 `.attr()` 方法来指定匹配的字段
 */
class EnumMatcherBuilder<T extends readonly EnumArrayObj[]> {
  constructor(private readonly enumArray: EnumArray<T>) {}

  /**
   * 根据 `value` 匹配
   * @param value - 要匹配的枚举值
   * @returns 返回一个 `EnumMatcher` 实例，可以继续调用 `.labelIsIn()`
   */
  value(value: ExternalValue) {
    return new EnumMatcher(this.enumArray, { type: 'value', value })
  }

  /**
   * 根据 `label` 匹配
   * @param label - 要匹配的枚举标签
   * @returns 返回一个 `EnumMatcher` 实例，可以继续调用 `.labelIsIn()`
   */
  label(label: EnhancedLabel<LabelOf<T>>) {
    return new EnumMatcher(this.enumArray, { type: 'label', label })
  }

  /**
   * 根据任意属性匹配
   * @param key - 要匹配的属性名
   * @param value - 要匹配的属性值
   * @returns 返回一个 `EnumMatcher` 实例，可以继续调用 `.labelIsIn()`
   */
  attr<K extends AttributeOf<T>>(key: K, value: T[number][K]) {
    return new EnumMatcher(this.enumArray, { type: 'attr', key, value })
  }
}

/**
 * 枚举数组类，继承了Array，提供高性能的枚举操作方法
 *
 * 该类通过内部维护的Map结构实现O(1)时间复杂度的查找操作，
 * 同时保持了Array的所有原生方法和特性。
 *
 * @template T - 枚举数组的完整字面量类型，必须由 `as const` 断言。
 *              例如：`typeof [\{ label: 'A', value: 1 \}] as const`
 * @public
 *
 * @example
 * ```typescript
 * const statusList = [
 *   { label: '待处理', value: 1, color: 'orange' },
 *   { label: '已完成', value: 2, color: 'green' }
 * ] as const
 *
 * const statusEnum = createEnum(statusList)
 * const label = statusEnum.getLabelByValue(1) // '待处理'
 * const item = statusEnum.getItemByValue(1) // 完整对象
 * ```
 */
class EnumArray<T extends readonly EnumArrayObj[]> extends Array<EnumArrayObj> {
  /** 性能优化的Map，通过value快速查找完整对象，实现O(1)查找 */
  private readonly valueToItemMap = new Map<ValueOf<T>, T[number]>()
  /** 性能优化的Map，通过label快速查找完整对象，实现O(1)查找 */
  private readonly labelToItemMap = new Map<LabelOf<T>, T[number]>()

  /**
   * 私有方法：执行重复性检查
   *
   * 检查当前项的 value 和 label 是否与已存在的项重复，
   * 如果发现重复则输出警告信息。
   *
   * @param item - 要检查的枚举项
   * @param checkLevel - 检查级别配置
   */
  private performDuplicateChecks(
    item: T[number],
    checkLevel: EnumCreationOptions['checkDuplicates'],
  ): void {
    if (this.valueToItemMap.has(item.value)) {
      // eslint-disable-next-line no-console
      console.warn(
        `EnumArray: Duplicate value '${item.value}' found in enum items. (checkLevel: '${checkLevel}')`,
      )
    }
    if (this.labelToItemMap.has(item.label)) {
      // eslint-disable-next-line no-console
      console.warn(
        `EnumArray: Duplicate label '${item.label}' found in enum items. (checkLevel: '${checkLevel}')`,
      )
    }
  }

  /**
   * 私有方法：获取重复检查配置
   *
   * 根据传入的配置项决定是否需要执行重复检查。
   *
   * @param options - 枚举创建配置项
   * @returns 是否应该执行重复检查
   */
  public shouldPerformDuplicateCheck(options?: EnumCreationOptions): boolean {
    const checkLevel = options?.checkDuplicates ?? 'development'

    // 处理 boolean 类型
    if (typeof checkLevel === 'boolean') {
      return checkLevel
    }

    // 处理字符串类型
    if (checkLevel === 'always') {
      return true
    } else if (checkLevel === 'development') {
      return process.env.NODE_ENV === 'development'
    }
    // checkLevel === 'never'
    return false
  }

  /**
   * 创建EnumArray实例
   *
   * 构造函数会初始化内部的Map结构以提供高性能查找，
   * 并根据配置检查重复的value和label。
   *
   * @param list - 符合EnumArrayObj接口的元组，建议使用 as const 断言
   * @param options - 创建时的配置项
   *
   * @example
   * ```typescript
   * const list = [
   *   { label: '启用', value: 1 },
   *   { label: '禁用', value: 0 }
   * ] as const
   * const enumArray = new EnumArray(list)
   *
   * // 配置检查级别
   * const enumArray2 = new EnumArray(list, { checkDuplicates: 'always' })
   * ```
   */
  constructor(list: T, options?: EnumCreationOptions) {
    super(list.length)

    // 获取重复检查配置
    const shouldCheck = this.shouldPerformDuplicateCheck(options)
    const checkLevel = options?.checkDuplicates ?? 'development'

    for (let i = 0; i < list.length; i++) {
      const item = list[i]
      this[i] = item

      // 在填充 Map 之前执行重复检查
      if (shouldCheck) {
        this.performDuplicateChecks(item, checkLevel)
      }

      // 构建性能优化的Map
      this.valueToItemMap.set(item.value, item)
      this.labelToItemMap.set(item.label, item)
    }
  }

  /**
   * 根据value获取对应的label
   *
   * 时间复杂度：O(1)
   *
   * @param value - 枚举值，必须是创建枚举时定义的value之一
   * @returns 返回value匹配的label，如果未找到则返回undefined
   *
   * @example
   * ```typescript
   * const label = enumArray.getLabelByValue(1) // '启用'
   * ```
   */
  getLabelByValue(value: ValueOf<T>): LabelOf<T> | undefined {
    return this.getItemByValue(value)?.label
  }

  /**
   * 根据label获取对应的value
   *
   * 时间复杂度：O(1)
   *
   * @param label - 枚举标签，必须是创建枚举时定义的label之一
   * @returns 返回label匹配的value，如果未找到则返回undefined
   *
   * @example
   * ```typescript
   * const value = enumArray.getValueByLabel('启用') // 1
   * ```
   */
  getValueByLabel(label: LabelOf<T>): ValueOf<T> | undefined {
    return this.getItemByLabel(label)?.value
  }
  /**
   * 根据label获取完整的枚举对象
   *
   * 时间复杂度：O(1)
   *
   * @param label - 枚举标签
   * @returns 返回匹配的完整对象，如果未找到则返回undefined
   *
   * @example
   * ```typescript
   * const item = enumArray.getItemByLabel('启用')
   * // { label: '启用', value: 1, ...其他属性 }
   * ```
   */
  getItemByLabel(label: LabelOf<T>): T[number] | undefined {
    return this.labelToItemMap.get(label)
  }

  /**
   * 根据value获取完整的枚举对象
   *
   * 时间复杂度：O(1)
   *
   * @param value - 枚举值
   * @returns 返回匹配的完整对象，如果未找到则返回undefined
   *
   * @example
   * ```typescript
   * const item = enumArray.getItemByValue(1)
   * // { label: '启用', value: 1, ...其他属性 }
   * ```
   */
  getItemByValue(value: ValueOf<T>): T[number] | undefined {
    return this.valueToItemMap.get(value)
  }

  /**
   * 根据任意属性键和值获取完整的枚举对象
   *
   * 该方法会遍历枚举列表，通过指定的属性键和值查找对应的枚举项
   *
   * 时间复杂度：O(n)
   *
   * @template K - 属性键名类型
   * @param key - 枚举对象的属性键
   * @param attrValue - 属性值
   * @returns 返回匹配的完整对象，如果未找到则返回undefined
   *
   * @example
   * ```typescript
   * const item = enumArray.getItemByAttr('color', 'blue')
   * // { label: '启用', value: 1, color: 'blue', ...其他属性 }
   * ```
   */
  getItemByAttr<K extends AttributeOf<T>, V extends T[number][K]>(
    key: K,
    attrValue: V,
  ): Extract<T[number], Record<K, V>> | undefined {
    // 针对常用键采用 O(1) 查找以提升性能
    if (key === 'label') {
      return this.getItemByLabel(attrValue as unknown as LabelOf<T>) as Extract<
        T[number],
        Record<K, V>
      >
    }
    if (key === 'value') {
      return this.getItemByValue(attrValue as unknown as ValueOf<T>) as Extract<
        T[number],
        Record<K, V>
      >
    }
    for (const item of this) {
      const typedItem = item as T[number]
      if (typedItem[key] === attrValue) {
        return typedItem as Extract<T[number], Record<K, V>>
      }
    }
    return undefined
  }

  /**
   * 根据label获取显示文本
   *
   * 如果枚举对象有displayText属性则返回displayText，否则返回label本身
   *
   * @param label - 枚举标签
   * @returns 显示文本
   *
   * @example
   * ```typescript
   * const displayText = enumArray.getDisplayTextByLabel('启用') // '状态启用' 或 '启用'
   * ```
   */
  getDisplayTextByLabel(label: LabelOf<T>): string {
    const item = this.getItemByLabel(label)
    return item?.displayText ?? label
  }

  /**
   * 根据value获取显示文本
   *
   * 如果枚举对象有displayText属性则返回displayText，否则返回label
   *
   * @param value - 枚举值
   * @returns 显示文本
   *
   * @example
   * ```typescript
   * const displayText = enumArray.getDisplayTextByValue(1) // '状态启用' 或 '启用'
   * ```
   */
  getDisplayTextByValue(value: ValueOf<T>): string | undefined {
    const item = this.getItemByValue(value)
    return item?.displayText ?? item?.label
  }

  /**
   * 使用映射字典改变枚举类的键，返回新对象组成的数组
   *
   * @param mapDictionary - 键映射字典，例如 \{ value: 'id', label: 'name' \}
   * @returns - 映射后的对象数组
   *
   * @example
   * ```typescript
   * const mapped = enumArray.getKeyMappedList(\{ value: 'id', label: 'name' \})
   * // [\{ id: 1, name: '启用' \}, \{ id: 0, name: '禁用' \}]
   * ```
   */
  getKeyMappedList(mapDictionary: Record<string, string>) {
    return [...this.getKeyMappedIter(mapDictionary)]
  }
  /**
   * 获取所有label的列表
   *
   * @returns - 包含所有枚举标签的数组
   *
   * @example
   * ```typescript
   * const labels = enumArray.getLabelList() // ['启用', '禁用']
   * ```
   */
  getLabelList(): ReadonlyArray<LabelOf<T>> {
    return Array.from(this, (item) => item.label) as LabelOf<T>[]
  }

  /**
   * 获取所有label的列表 (别名方法)
   *
   * @returns 包含所有枚举标签的数组
   *
   * @example
   * ```typescript
   * const labels = enumArray.getLabels() // ['启用', '禁用']
   * ```
   */
  getLabels(): ReadonlyArray<LabelOf<T>> {
    return this.getLabelList()
  }

  /**
   * 获取所有value的列表
   *
   * @returns - 包含所有枚举值的数组
   *
   * @example
   * ```typescript
   * const values = enumArray.getValues() // [1, 0]
   * ```
   */
  getValues() {
    return Array.from(this, (item) => item.value) as ValueOf<T>[]
  }

  /**
   * 判断给定的外部值是否属于指定的label集合
   *
   * 该方法特别适用于处理来自API等外部源的数据，支持null和undefined的安全检查
   *
   * @param value - 要检查的值，可以是来自API等外部源的数据
   * @param labels - 允许的标签数组
   * @returns - 如果value对应的label在labels中则返回true
   *
   * @example
   * ```typescript
   * const isValid = enumArray.isValueInLabels(apiData.status, ['启用', '禁用'])
   * ```
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
   * 判断给定的label是否在指定的label集合中
   *
   * 该方法的核心优势是：在输入label参数时，会获得所有枚举内合法label的自动补全提示，
   * 同时它也接受任意普通字符串作为输入，实现了类型安全和开发便利性的完美平衡。
   *
   * @param label - 要检查的标签，输入时会获得自动补全
   * @param allowedLabels - 包含所有期望的合法标签的数组
   * @returns - 如果label不为null/undefined且存在于allowedLabels中，则返回true
   *
   * @example
   * ```typescript
   * const isAllowed = enumArray.isLabelIn(userInput, ['启用', '禁用'])
   * ```
   */
  isLabelIn(
    label: EnhancedLabel<LabelOf<T>>,
    allowedLabels: readonly LabelOf<T>[],
  ): boolean {
    if (label === null || label === undefined) {
      return false
    }

    // 类型断言是安全的，因为 EnumArrayObj 已经约束了 label 必须是 string
    return (allowedLabels as readonly string[]).includes(label)
  }

  /**
   * 判断给定的属性值对应的枚举项的label是否在指定的label集合中
   *
   * @template K - 属性键名类型
   * @param key - 枚举对象的属性键
   * @param attrValue - 属性值
   * @param allowedLabels - 包含所有期望的合法标签的数组
   * @returns - 如果找到匹配的枚举项且其label存在于allowedLabels中，则返回true
   *
   * @example
   * ```typescript
   * const isAllowed = enumArray.isAttrInLabels('color', 'blue', ['启用', '禁用'])
   * ```
   */
  isAttrInLabels<K extends AttributeOf<T>, V extends T[number][K]>(
    key: K,
    attrValue: V,
    allowedLabels: readonly LabelOf<T>[],
  ): boolean {
    if (
      this.length === 0 ||
      !Array.isArray(allowedLabels) ||
      allowedLabels.length === 0
    ) {
      return false
    }

    if ((attrValue as unknown) == null) {
      return false
    }

    // 针对常用键采用 O(1) 查找以提升性能
    if (key === 'label') {
      return this.isLabelIn(
        attrValue as unknown as EnhancedLabel<LabelOf<T>>,
        allowedLabels,
      )
    }
    if (key === 'value') {
      return this.isValueInLabels(
        attrValue as unknown as ExternalValue,
        allowedLabels,
      )
    }

    const item = this.getItemByAttr(key, attrValue)
    if (!item) return false

    return allowedLabels.includes(item.label as LabelOf<T>)
  }

  /**
   * @internal
   * 统一的标签匹配方法：支持 value、label、attr 三种模式
   */
  matchesLabel(
    input: { type: 'value'; value: ExternalValue },
    allowedLabels: readonly LabelOf<T>[],
  ): boolean
  matchesLabel(
    input: { type: 'label'; label: EnhancedLabel<LabelOf<T>> },
    allowedLabels: readonly LabelOf<T>[],
  ): boolean
  matchesLabel<K extends AttributeOf<T>, V extends T[number][K]>(
    input: { type: 'attr'; key: K; value: V },
    allowedLabels: readonly LabelOf<T>[],
  ): boolean
  matchesLabel(
    input:
      | { type: 'value'; value: ExternalValue }
      | { type: 'label'; label: EnhancedLabel<LabelOf<T>> }
      | { type: 'attr'; key: AttributeOf<T>; value: unknown },
    allowedLabels: readonly LabelOf<T>[],
  ): boolean {
    if (!Array.isArray(allowedLabels) || allowedLabels.length === 0) {
      return false
    }

    switch (input.type) {
      case 'value':
        return this.isValueInLabels(input.value, allowedLabels)
      case 'label':
        return this.isLabelIn(input.label, allowedLabels)
      case 'attr':
        return this.isAttrInLabels(
          input.key as AttributeOf<T>,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          input.value as any,
          allowedLabels,
        )
      default:
        return false
    }
  }

  /**
   * 开启一个链式调用，用于更方便地进行多条件匹配
   *
   * @returns {EnumMatcherBuilder<T>} 返回一个匹配器构建器，可以继续调用 .value() .label() 或 .attr() 方法
   *
   * @example
   * ```typescript
   * const isEnabled = statusEnum.match().value(1).labelIsIn(['启用'])
   * const isWarning = statusEnum.match().attr('color', 'orange').labelIsIn(['待处理'])
   * ```
   */
  match(): EnumMatcherBuilder<T> {
    return new EnumMatcherBuilder(this)
  }

  /**
   * 获取一个基于属性的匹配器，用于后续的链式调用。
   *
   * 这种方式是 `match().attr(key, value)` 的一种备选语法，
   * 在需要对同一个属性键进行多次匹配时，可以减少代码重复。
   *
   * @template K - 属性键名类型
   * @param key - 要匹配的属性名
   * @returns 返回一个包含 `value` 方法的对象，用于指定属性值并返回一个 {@link EnumMatcher}
   *
   * @example
   * ```typescript
   * const colorMatcher = statusEnum.getAttrMatcher('color')
   * const isWarning = colorMatcher.value('orange').labelIsIn(['待处理'])
   * const isSuccess = colorMatcher.value('green').labelIsIn(['已完成'])
   * ```
   */
  getAttrMatcher<K extends AttributeOf<T>>(key: K) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return {
      /**
       * 根据指定的属性值进行匹配。
       * @param attrValue - 要匹配的属性值
       * @returns 返回一个 `EnumMatcher` 实例，用于最终的断言
       */
      value: (attrValue: T[number][K]) => {
        return new EnumMatcher(self, { type: 'attr', key, value: attrValue })
      },
    }
  }

  /**
   * 根据value获取指定属性的值
   *
   * 该方法提供类型安全的属性访问，支持获取枚举对象的任意属性
   *
   * @template K - 属性键名类型
   * @param value - 枚举值
   * @param key - 属性键名
   * @returns - 属性值，如果未找到则返回undefined
   *
   * @example
   * ```typescript
   * const color = enumArray.getAttrByValue(1, 'color') // 类型安全的属性访问
   * ```
   */
  getAttrByValue<K extends AttributeOf<T>>(
    value: ValueOf<T>,
    key: K,
  ): T[number][K] | undefined {
    return this.getItemByValue(value)?.[key]
  }

  /**
   * 根据label获取指定属性的值
   *
   * 该方法提供类型安全的属性访问，支持获取枚举对象的任意属性
   *
   * @template K - 属性键名类型
   * @param label - 枚举标签
   * @param key - 属性键名
   * @returns 属性值，如果未找到则返回undefined
   *
   * @example
   * ```typescript
   * const color = enumArray.getAttrByLabel('启用', 'color') // 类型安全的属性访问
   * ```
   */
  getAttrByLabel<K extends AttributeOf<T>>(
    label: LabelOf<T>,
    key: K,
  ): T[number][K] | undefined {
    return this.getItemByLabel(label)?.[key]
  }

  /**
   * 检查给定的值或标签是否存在于枚举中
   *
   * @param valueOrLabel - 要检查的值或标签
   * @returns - 如果存在则返回true
   *
   * @example
   * ```typescript
   * const exists = enumArray.has(1) // true
   * const exists2 = enumArray.has('启用') // true
   * ```
   */
  has(valueOrLabel: unknown): boolean {
    return this.isEnumValue(valueOrLabel) || this.isEnumLabel(valueOrLabel)
  }

  /**
   * 类型守卫：检查给定值是否为有效的枚举值
   *
   * 该方法不仅检查值的存在性，还提供TypeScript类型缩窄功能，
   * 在类型守卫通过后，TypeScript会将参数类型缩窄为具体的枚举值类型。
   *
   * @param value - 要检查的值，可以是任意类型
   * @returns - 如果是有效的枚举值则返回true，同时提供类型缩窄
   *
   * @example
   * ```typescript
   * const unknownValue: unknown = 1
   * if (enumArray.isEnumValue(unknownValue)) {
   *   // 此时 unknownValue 的类型被缩窄为 ValueOf<T>
   *   const label = enumArray.getLabelByValue(unknownValue) // 类型安全
   * }
   * ```
   */
  isEnumValue(value: unknown): value is ValueOf<T> {
    return this.valueToItemMap.has(value as ValueOf<T>)
  }

  /**
   * 类型守卫：检查给定标签是否为有效的枚举标签
   *
   * 该方法不仅检查标签的存在性，还提供TypeScript类型缩窄功能，
   * 在类型守卫通过后，TypeScript会将参数类型缩窄为具体的枚举标签类型。
   *
   * @param label - 要检查的标签，可以是任意类型
   * @returns 如果是有效的枚举标签则返回true，同时提供类型缩窄
   *
   * @example
   * ```typescript
   * const unknownLabel: unknown = '启用'
   * if (enumArray.isEnumLabel(unknownLabel)) {
   *   // 此时 unknownLabel 的类型被缩窄为 LabelOf<T>
   *   const value = enumArray.getValueByLabel(unknownLabel) // 类型安全
   * }
   * ```
   */
  isEnumLabel(label: unknown): label is LabelOf<T> {
    return this.labelToItemMap.has(label as LabelOf<T>)
  }

  // ==================== 废弃方法区域 ====================
  // 以下方法已废弃，保留用于向后兼容，建议使用新的替代方法

  /**
   * 根据label获取完整的枚举对象 (兼容性方法)
   *
   * @deprecated 请使用 getItemByLabel，该方法性能更好 (O(1) vs O(n))
   * @param label - 枚举标签
   * @returns 匹配的完整对象或undefined
   */
  getItemByLabelLegacy(label: LabelOf<T>): T[number] | undefined {
    return this.find((item) => {
      return item.label === label
    })
  }

  /**
   * 根据value获取完整的枚举对象 (兼容性方法)
   *
   * @deprecated 请使用 getItemByValue，该方法性能更好 (O(1) vs O(n))
   * @param value - 枚举值
   * @returns 匹配的完整对象或undefined
   */
  getItemByValueLegacy(value: ValueOf<T>): T[number] | undefined {
    return this.find((item) => {
      return item.value === value
    })
  }

  /**
   * 使用映射字典改变枚举类的键
   *
   * @deprecated 建议直接使用 getKeyMappedList，迭代器模式在此场景下意义不大
   * @param mapDictionary - 键映射字典
   * @returns 映射后对象的迭代器
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
   * 使value和label用相同的值
   *
   * @deprecated 该方法功能特殊，建议在外部通过 map 方法实现: myEnum.map(item =\> (\{ ...item, value: item.label \}))
   * @returns 所有项的label作为value的新数组
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
   * 转换为普通数组
   *
   * @deprecated EnumArray本身继承自Array，可以直接使用或用展开语法 [...myEnum]
   * @returns 普通数组
   */
  toList(): T[number][] {
    return [...this.values()]
  }

  /**
   * 判断枚举值匹配label列表中的某个label
   *
   * @deprecated 请使用 isValueInLabels(value, labels)，参数顺序更符合直觉且类型更安全
   * @param labels - 标签列表
   * @param value - 要检查的值
   * @returns - 是否匹配
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isLabelsMatchValue(labels: LabelOf<T>[], value?: any): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return labels.includes(this.getLabelByValue(value) as any)
  }

  /**
   * 判断label是否匹配列表，可以节省引入Type的时间
   *
   * @param labels - 标签列表
   * @param label - 要检查的标签
   * @returns - 是否匹配
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isLabelsMatchLabel(labels: LabelOf<T>[], label?: any): boolean {
    return labels.includes(label)
  }

  /**
   * 根据label列表获取value列表
   *
   * @deprecated 建议在外部通过 labels.map(l =\> myEnum.getValueByLabel(l)) 实现，以保持API简洁
   * @param labels - 标签列表
   * @returns - value列表
   */
  getValuesByLabels(labels: LabelOf<T>[]): (ValueOf<T> | undefined)[] {
    return labels.map((label) => {
      return this.getValueByLabel(label)
    })
  }

  /**
   * 根据value列表获取label列表
   *
   * @deprecated 建议在外部通过 values.map(v =\> myEnum.getLabelByValue(v)) 实现，以保持API简洁
   * @param values - 值列表
   * @returns - label列表
   */
  getLabelsByValues(values: ValueOf<T>[]): (LabelOf<T> | undefined)[] {
    return values.map((value) => {
      return this.getLabelByValue(value)
    })
  }

  // ===================================================================
  //           方法覆盖：阻止不安全的数组修改器方法
  // ===================================================================

  private throwImmutableError(methodName: string): never {
    throw new Error(
      `EnumArray Error: Cannot call '.${methodName}()' on an immutable EnumArray instance. ` +
        `EnumArray is designed to be a read-only constant. ` +
        `If you need a new enum with modified data, please create a new instance with createEnum().`,
    )
  }

  /** @deprecated EnumArray is immutable. This method will throw an error. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  push(...items: any[]): number {
    this.throwImmutableError('push')
  }

  /** @deprecated EnumArray is immutable. This method will throw an error. */
  pop(): EnumArrayObj | undefined {
    this.throwImmutableError('pop')
  }

  /** @deprecated EnumArray is immutable. This method will throw an error. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  splice(start: number, deleteCount?: number, ...items: any[]): EnumArrayObj[] {
    this.throwImmutableError('splice')
  }

  /** @deprecated EnumArray is immutable. This method will throw an error. */
  shift(): EnumArrayObj | undefined {
    this.throwImmutableError('shift')
  }

  /** @deprecated EnumArray is immutable. This method will throw an error. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  unshift(...items: any[]): number {
    this.throwImmutableError('unshift')
  }

  /** @deprecated EnumArray is immutable. This method will throw an error. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  sort(compareFn?: (a: any, b: any) => number): this {
    this.throwImmutableError('sort')
  }

  /** @deprecated EnumArray is immutable. This method will throw an error. */
  reverse(): this {
    this.throwImmutableError('reverse')
  }

  /** @deprecated EnumArray is immutable. This method will throw an error. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  fill(value: any, start?: number, end?: number): this {
    this.throwImmutableError('fill')
  }

  /** @deprecated EnumArray is immutable. This method will throw an error. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  copyWithin(target: number, start: number, end?: number): this {
    this.throwImmutableError('copyWithin')
  }
}

/**
 * 创建类型安全的、不可变的枚举工具实例
 *
 * 该函数是创建EnumArray实例的推荐方式，返回的对象被冻结以确保不可变性。
 * EnumArray继承了Array，因此可以使用所有原生Array方法。
 *
 * @template T - 枚举数组类型，必须使用 as const 断言以保留字面量类型
 * @param enumsTuple - 枚举元组，建议使用 as const 修饰以获得最佳类型推断
 * @param options - 创建时的配置项
 * @returns - 返回冻结的EnumArray实例，提供高性能的枚举操作方法
 *
 * @example
 * 基础用法：
 * ```typescript
 * const statusList = [
 *   { label: '待处理', value: 1, color: 'orange' },
 *   { label: '已完成', value: 2, color: 'green' },
 *   { label: '已取消', value: 3, color: 'red' }
 * ] as const
 *
 * const statusEnum = createEnum(statusList)
 *
 * // 基础查找操作 (O(1) 时间复杂度)
 * const label = statusEnum.getLabelByValue(1) // '待处理'
 * const value = statusEnum.getValueByLabel('已完成') // 2
 * const item = statusEnum.getItemByValue(1) // 完整对象
 *
 * // 类型安全的属性访问
 * const color = statusEnum.getAttrByValue(1, 'color') // 类型推断为 'orange' \\| 'green' \\| 'red' \\| undefined
 *
 * // 列表操作
 * const allLabels = statusEnum.getLabels() // ['待处理', '已完成', '已取消']
 * const allValues = statusEnum.getValues() // [1, 2, 3]
 *
 * // 条件判断
 * const isValid = statusEnum.isValueInLabels(apiData.status, ['待处理', '已完成'])
 * const exists = statusEnum.has(1) // true
 *
 * // 显示文本处理
 * const displayText = statusEnum.getDisplayTextByValue(1) // 如果有displayText则返回，否则返回label
 * ```
 *
 * @example
 * 配置化重复检查：
 * ```typescript
 * const statusList = [
 *   { label: '待处理', value: 1 },
 *   { label: '处理中', value: 2 },
 *   { label: '待处理', value: 3 } // label 重复
 * ] as const
 *
 * // 默认行为：只在开发环境检查
 * const enum1 = createEnum(statusList)
 *
 * // 强制始终检查 (例如，用于生产环境启动脚本)
 * const enum2 = createEnum(statusList, { checkDuplicates: 'always' })
 * // 或使用 boolean 简写
 * const enum2b = createEnum(statusList, { checkDuplicates: true })
 *
 * // 强制从不检查 (例如，用于特殊测试)
 * const enum3 = createEnum(statusList, { checkDuplicates: 'never' })
 * // 或使用 boolean 简写
 * const enum3b = createEnum(statusList, { checkDuplicates: false })
 * ```
 *
 * @example
 * 复杂枚举示例：
 * ```typescript
 * const userRoleList = [
 *   {
 *     label: '管理员',
 *     value: 'admin',
 *     displayText: '系统管理员',
 *     permissions: ['read', 'write', 'delete'],
 *     level: 1
 *   },
 *   {
 *     label: '编辑者',
 *     value: 'editor',
 *     displayText: '内容编辑者',
 *     permissions: ['read', 'write'],
 *     level: 2
 *   },
 *   {
 *     label: '访客',
 *     value: 'guest',
 *     permissions: ['read'],
 *     level: 3
 *   }
 * ] as const
 *
 * const roleEnum = createEnum(userRoleList)
 *
 * // 获取权限信息
 * const permissions = roleEnum.getAttrByValue('admin', 'permissions')
 * // 类型推断为: ['read', 'write', 'delete'] \| ['read', 'write'] \| ['read'] \| undefined
 *
 * // 检查角色级别
 * const level = roleEnum.getAttrByLabel('编辑者', 'level') // 2
 * ```
 *
 * @public
 */
function createEnum<T extends readonly EnumArrayObj[]>(
  enumsTuple: T,
  options?: EnumCreationOptions,
) {
  return Object.freeze(new EnumArray(enumsTuple, options))
}

export { createEnum, EnumArray }
export type {
  AttributeOf,
  EnhancedLabel,
  EnumArrayObj,
  EnumCreationOptions,
  ExternalValue,
  LabelOf,
  ValueOf,
}
