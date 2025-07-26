/**
 * 参数相关的报错
 * @public
 */
class ArgumentError extends Error {
  /**
   * 构造器
   * @param message - 错误信息
   * @param options - 可选，包含其他错误参数。
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ArgumentError'
    this.message = message
  }
}

export { ArgumentError }
