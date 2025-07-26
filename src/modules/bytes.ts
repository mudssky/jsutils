// 关于字节的单位转换

/**
 * 单位转换的字典
 * @public
 */
const bytesUnitMap = {
  b: 1,
  kb: 1 << 10,
  mb: 1 << 20,
  gb: 1 << 30,
  tb: Math.pow(1024, 4),
  pb: Math.pow(1024, 5),
}

/**
 * 单位类型
 * @public
 */
type BytesUnitType = keyof typeof bytesUnitMap

/**
 * 配置项
 * @public
 */
interface BytesOption {
  unit?: BytesUnitType
  decimalPlaces?: number
  fixedDecimals?: boolean
  thousandsSeparator?: string
  unitSeparator?: string
}

/**
 * 整合了字节单位格式化相关的方法
 * @public
 */
class Bytes {
  /**
   * 用于格式化千分为字符串
   * B非单词边界，也就是说是连续的数字
   * ?= 肯定预查，后面会跟3个数字
   * ?! 否定预查，后面不会跟数字
   * 也就是说，前面多个3个数字连续，加上非数尾部
   * 多次执行replace，就是不断从后面取3个数，前面加上分隔符
   */
  readonly formatThousandsRegExp = /\B(?=(\d{3})+(?!\d))/g
  /**
   *去除小数点后多余的零
   */
  readonly formatDecimalsRegExp = /(?:\.0*|(\.[^0]+)0+)$/
  /**
   * 提取正负号，数字，和单位
   */
  readonly parseRegExp = /^((-|\+)?(\d+(?:\.\d+)?)) *(kb|mb|gb|tb|pb)$/i

  readonly unitMap = bytesUnitMap

  constructor() {}

  /**
   * 传入数值转化为字节字符串或是传入字节字符串解析出数值，根据传入变量的类型区分调用方式
   * @param value - 要转换的值
   * @param options - 转换选项
   * @returns - 转换结果
   */
  convert(value: number | string, options?: BytesOption) {
    if (typeof value === 'string') {
      return this.parse(value)
    }
    if (typeof value === 'number') {
      return this.format(value, options)
    }
    // return null
  }
  parse(val: string) {
    // if (typeof val === 'number' && !isNaN(val)) {
    //   return val
    // }
    // if (typeof val !== 'string') {
    //   return null
    // }
    const results = this.parseRegExp.exec(val)
    let floatValue
    let unit: BytesUnitType = 'b'

    if (!results) {
      // 解析不到单位的时候，单位设为b
      floatValue = parseInt(val, 10)
      unit = 'b'
    } else {
      // 获取数值和单位
      floatValue = parseFloat(results[1])
      unit = results[4].toLowerCase() as BytesUnitType
    }

    if (isNaN(floatValue)) {
      return null
    }

    return Math.floor(this.unitMap[unit] * floatValue)
  }
  format(value: number, options?: BytesOption) {
    if (!Number.isFinite(value)) {
      return null
    }

    // 获取数值用于比较确定单位。
    const num = Math.abs(value)
    const thousandsSeparator = options?.thousandsSeparator ?? ''

    const unitSeparator = (options && options.unitSeparator) || ''
    const decimalPlaces = options?.decimalPlaces ?? 2
    const fixedDecimals = Boolean(options?.fixedDecimals)
    let unit = options?.unit ?? ''

    if (!unit || !this.unitMap[unit.toLowerCase() as BytesUnitType]) {
      if (num >= this.unitMap.pb) {
        unit = 'PB'
      } else if (num >= this.unitMap.tb) {
        unit = 'TB'
      } else if (num >= this.unitMap.gb) {
        unit = 'GB'
      } else if (num >= this.unitMap.mb) {
        unit = 'MB'
      } else if (num >= this.unitMap.kb) {
        unit = 'KB'
      } else {
        unit = 'B'
      }
    }

    const val = value / this.unitMap[unit.toLowerCase() as BytesUnitType]
    let numstr = val.toFixed(decimalPlaces)

    if (!fixedDecimals) {
      numstr = numstr.replace(this.formatDecimalsRegExp, '$1')
    }

    if (thousandsSeparator) {
      // 拆分为整数部分和小数部分，并且对整数部分添加千分位分隔符
      numstr = numstr
        .split('.')
        .map((s, i) => {
          return i === 0
            ? s.replace(this.formatThousandsRegExp, thousandsSeparator)
            : s
        })
        .join('.')
    }

    return numstr + unitSeparator + unit
  }
}

/**
 * Bytes 类的实例
 * @public
 */
const bytesInstance = new Bytes()

/**
 * 字节转换函数
 * @param value - 要转换的值
 * @param options - 转换选项
 * @returns - 转换结果
 * @public
 */
function bytes(value: number | string, options?: BytesOption) {
  return bytesInstance.convert(value, options)
}

export { Bytes, bytes, bytesInstance, bytesUnitMap }

export type { BytesOption, BytesUnitType }
