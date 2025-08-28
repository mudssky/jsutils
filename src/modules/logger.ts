/* eslint-disable no-console */
import { omit } from './object'

/**
 * 抽象日志器类，定义了所有日志级别的方法。

 */
abstract class AbstractLogger {
  abstract log(message?: unknown, ...optionalParams: unknown[]): void
  abstract trace(message?: unknown, ...optionalParams: unknown[]): void
  abstract debug(message?: unknown, ...optionalParams: unknown[]): void
  abstract info(message?: unknown, ...optionalParams: unknown[]): void
  abstract warn(message?: unknown, ...optionalParams: unknown[]): void
  abstract error(message?: unknown, ...optionalParams: unknown[]): void
}

const loggerLevels = {
  trace: 0,
  log: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
} as const

/**
 * 定义日志级别。
 */
export type LogLevel = keyof typeof loggerLevels
/**
 * 日志器配置选项接口。
 */
export interface LoggerOptions {
  name?: string
  level: LogLevel
  enableFormat?: boolean
  formatter?: (
    level: LogLevel,
    message?: unknown,
    ...optionalParams: unknown[]
  ) => string
  context?: Record<string, unknown>
}
/**
 * 日志内容的接口，用于格式化后的日志输出。
 */
export interface LogContent
  extends Omit<LoggerOptions, 'formatter' | 'enableFormat' | 'context'> {
  [key: string]: unknown
  message: unknown
  timestamp: unknown
  context?: unknown[]
}
/**
 * 控制台日志器类，实现了 AbstractLogger 抽象类，用于向控制台输出日志。
 */
export class ConsoleLogger extends AbstractLogger {
  constructor(private options: LoggerOptions) {
    super()
    // 提供默认值
    this.options.enableFormat = this.options.enableFormat !== false
  }
  /**
   * 处理Error对象，提取其关键信息
   * @param value - 可能是Error对象的值
   * @returns 处理后的值
   */
  private processErrorObject(value: unknown): unknown {
    if (value instanceof Error) {
      const errorInfo: Record<string, unknown> = {
        message: value.message,
        stack: value.stack,
        name: value.name,
      }

      if (value.cause) {
        errorInfo.cause = this.processErrorObject(value.cause)
      }

      return errorInfo
    }
    return value
  }

  private formatInfo(
    level: LogLevel,
    message?: unknown,
    ...optionalParams: unknown[]
  ) {
    if (this.options.formatter) {
      return this.options.formatter(level, message, ...optionalParams)
    }

    const processedMessage = this.processErrorObject(message)

    const res: LogContent = {
      ...this.options.context,
      ...omit(this.options, ['formatter', 'enableFormat', 'context']),
      message: processedMessage,
      timestamp: new Date().toISOString(),
    }

    if (optionalParams.length > 0) {
      res.context = optionalParams.map((param) =>
        this.processErrorObject(param),
      )
    }

    return JSON.stringify(res)
  }

  private canLog(level: LogLevel): boolean {
    const currentLevelValue = loggerLevels[level]
    const optionLevelValue = loggerLevels[this.options.level]
    return currentLevelValue >= optionLevelValue
  }

  /**
   * 统一的私有日志处理方法
   * @param level - 日志级别
   * @param message - 日志消息
   * @param optionalParams - 可选参数
   */
  private performLog(
    level: LogLevel,
    message?: unknown,
    ...optionalParams: unknown[]
  ): void {
    if (!this.canLog(level)) return

    // 获取对应的 console 方法，如 console.log, console.info 等
    const logFn =
      (console as unknown as Record<string, (...args: unknown[]) => void>)[
        level
      ] || console.log

    if (this.options.enableFormat) {
      const formattedMessage = this.formatInfo(
        level,
        message,
        ...optionalParams,
      )
      logFn(formattedMessage)
    } else {
      logFn(message, ...optionalParams)
    }
  }

  /**
   * 输出通用日志信息。
   * @param message - 日志消息。
   * @param optionalParams - 可选参数。
   */
  log(message?: unknown, ...optionalParams: unknown[]): void {
    this.performLog('log', message, ...optionalParams)
  }

  /**
   * 输出跟踪日志信息。
   * @param message - 日志消息。
   * @param optionalParams - 可选参数。
   */
  trace(message?: unknown, ...optionalParams: unknown[]): void {
    this.performLog('trace', message, ...optionalParams)
  }

  /**
   * 输出调试日志信息。
   * @param message - 日志消息。
   * @param optionalParams - 可选参数。
   */
  debug(message?: unknown, ...optionalParams: unknown[]): void {
    this.performLog('debug', message, ...optionalParams)
  }

  /**
   * 输出信息日志信息。
   * @param message - 日志消息。
   * @param optionalParams - 可选参数。
   */
  info(message?: unknown, ...optionalParams: unknown[]): void {
    this.performLog('info', message, ...optionalParams)
  }

  /**
   * 输出警告日志信息。
   * @param message - 日志消息。
   * @param optionalParams - 可选参数。
   */
  warn(message?: unknown, ...optionalParams: unknown[]): void {
    this.performLog('warn', message, ...optionalParams)
  }

  /**
   * 输出错误日志信息。
   * @param message - 日志消息。
   * @param optionalParams - 可选参数。
   */
  error(message?: unknown, ...optionalParams: unknown[]): void {
    this.performLog('error', message, ...optionalParams)
  }

  /**
   * 创建子日志记录器，深度合并上下文信息
   * @param context - 要绑定到子日志记录器的上下文对象
   * @param options - 可选的新配置，用于覆盖level等设置
   * @returns 新的ConsoleLogger实例
   */
  child(
    context: Record<string, unknown>,
    options?: Partial<Omit<LoggerOptions, 'context'>>,
  ): ConsoleLogger {
    const newOptions: LoggerOptions = {
      ...this.options,
      ...options,
      context: {
        ...this.options.context,
        ...context,
      },
    }
    return new ConsoleLogger(newOptions)
  }
}

/**
 * 创建并返回一个 ConsoleLogger 实例。
 * @param options - 日志器配置选项。
 * @returns ConsoleLogger 实例。
 */
export function createLogger(options: LoggerOptions) {
  return new ConsoleLogger(options)
}
