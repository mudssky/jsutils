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
export { RegexChecker, regexChecker }
