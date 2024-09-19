import { Nullable } from 'vitest'

class RegexChecker {
  /**
   * 用户名正则
   * 数字字母，连接符，下划线
   * @memberof RegexChecker
   */
  readonly usernamePattern = /^[a-zA-Z0-9_-]{4,16}$/
  /**
   *正数
   * @memberof RegexChecker
   */
  readonly positivePattern = /^\d*\.?\d+$/

  /**
   * 负数
   *
   * @memberof RegexChecker
   */
  readonly negativePattern = /^-\d*\.?\d+$/

  /**
   * 邮箱,允许中文邮箱
   *
   * @memberof RegexChecker
   */
  readonly emailPatternCN =
    /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/

  readonly emailPattern =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

  /**
   *手机号码
   *
   * @memberof RegexChecker
   */
  readonly mobilePattern = /^1[34578]\d{9}$/
}
const regexChecker = new RegexChecker()

interface PasswordStrengthRule {
  key: string
  regex: RegExp
  desp: string
}
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

type PasswordStrengthRuleKey = (typeof passwordStrengthRule)[number]['key']

/**
 * 检查密码强度，返回多个判断的结果对象
 * @param options
 * @returns
 */
function analyzePasswordStrength(
  password: Nullable<string>,
  options?: {
    minLength?: number
  },
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

export {
  analyzePasswordStrength,
  passwordStrengthRule,
  RegexChecker,
  regexChecker,
}
export type { PasswordStrengthRuleKey }
