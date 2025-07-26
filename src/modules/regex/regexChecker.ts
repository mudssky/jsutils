import { Nullable } from '@/types'
import { omit } from '../object'

/**
 * @public
 */
class RegexChecker {
  /**
   * 用户名正则
   * 数字字母，连接符，下划线
   */
  readonly usernamePattern = /^[a-zA-Z0-9_-]{4,16}$/
  /**
   *正数
   */
  readonly positivePattern = /^\d*\.?\d+$/

  /**
   * 负数
   */
  readonly negativePattern = /^-\d*\.?\d+$/

  /**
   * 邮箱,允许中文邮箱
   */
  readonly emailPatternCN =
    /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/

  readonly emailPattern =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

  /**
   *手机号码
   */
  readonly mobilePattern = /^1[34578]\d{9}$/
}
/**
 * @public
 */
const regexChecker = new RegexChecker()

/**
 * @public
 */
interface PasswordStrengthRule {
  key: string
  regex: RegExp
  desp: string
}
/**
 * @public
 */
const passwordStrengthRule = [
  {
    key: 'minLength',
    regex: /(?=.{8,}).*/,
    desp: '最少 8 个字符',
  },
  {
    key: 'hasLowercase',
    regex: /^(?=.*[a-z]).*$/,
    desp: '必须包含小写字母',
  },
  {
    key: 'hasUppercase',
    regex: /^(?=.*[A-Z]).*$/,
    desp: '必须包含大写字母',
  },
  {
    key: 'hasDigit',
    regex: /^(?=.*\d).*$/,
    desp: '必须包含数字',
  },
  {
    key: 'hasSpecialChar',
    regex: /^(?=.*[`~!@#$%^&*()_+<>?:"{},./;'[\]]).*$/,
    desp: '必须包含特殊字符',
  },
] as const satisfies PasswordStrengthRule[]

/**
 * @public
 */
type PasswordStrengthRuleKey = (typeof passwordStrengthRule)[number]['key']

/**
 * @public
 */
type AnalyzePasswordStrenthOptions = {
  minLength?: number
}
/**
 * 检查密码强度，返回多个判断的结果对象
 * @param password - 要检查的密码
 * @param options - 检查选项
 * @returns 密码强度分析结果
 * @public
 */
function analyzePasswordStrength(
  password: Nullable<string>,
  options?: AnalyzePasswordStrenthOptions,
) {
  const { minLength = 8 } = options || {}
  const res: Record<PasswordStrengthRuleKey, boolean> = {
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasDigit: false,
    hasSpecialChar: false,
  }
  if (!password) {
    return res
  }
  if (password.length < minLength) {
    res.minLength = true
  }
  for (let i = 1; i < passwordStrengthRule.length; i++) {
    if (passwordStrengthRule[i].regex.test(password)) {
      res[passwordStrengthRule[i].key] = true
    }
  }
  // 返回密码强度数据
  return res
}

/**
 * @public
 */
type PasswordStrengthLevelStrategy<OUT = number> = (
  analyzeResult: Record<PasswordStrengthRuleKey, boolean>,
) => OUT
/**
 * @public
 */
const passwordStrengthLevelStrategys: Record<
  string,
  PasswordStrengthLevelStrategy
> = {
  default: (res) => {
    if (res.minLength) {
      return 0
    }
    const entries = Object.entries(omit(res, ['minLength']))
    let strengthLevel = 0
    for (const [, value] of entries) {
      if (value) {
        strengthLevel++
      }
    }
    // 返回密码强度等级
    return strengthLevel
  },
}

/**
 * @public
 */
type CalculatePasswordStrengthLevelOptions = {
  strategy?: PasswordStrengthLevelStrategy
} & AnalyzePasswordStrenthOptions
/**
 * 计算密码强度等级，可以切换不同的策略
 * 有一个默认策略，若密码强度小于minlength，则返回0
 * 处理minLength以外，其他规则若有一项符合则强度+1，比如大写字母，小写字母，特殊字符，数字
 * @param password - 要检查的密码
 * @param options - 计算选项
 * @returns 密码强度等级
 * @public
 */
function calculatePasswordStrengthLevel(
  password: string,
  options?: CalculatePasswordStrengthLevelOptions,
) {
  const {
    strategy = passwordStrengthLevelStrategys['default'],
    ...restOptions
  } = options || {}
  const res = analyzePasswordStrength(password, restOptions)
  return strategy(res)
}

export {
  analyzePasswordStrength,
  calculatePasswordStrengthLevel,
  passwordStrengthLevelStrategys,
  passwordStrengthRule,
  RegexChecker,
  regexChecker,
}
export type {
  AnalyzePasswordStrenthOptions,
  CalculatePasswordStrengthLevelOptions,
  PasswordStrengthLevelStrategy,
  PasswordStrengthRule,
  PasswordStrengthRuleKey,
}
