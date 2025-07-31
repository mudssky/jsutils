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
    options: LoggerOptions,
    message?: unknown,
    ...optionalParams: unknown[]
  ) => string
}
/**
 * 日志内容的接口，用于格式化后的日志输出。
 */
export interface LogContent
  extends Omit<LoggerOptions, 'formatter' | 'enableFormat'> {
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
  private formatInfo(message?: unknown, ...optionalParams: unknown[]) {
    if (this.options.formatter) {
      return this.options.formatter(this.options, message, ...optionalParams)
    }
    const res: LogContent = {
      ...omit(this.options, ['formatter', 'enableFormat']),
      message: message,
      timestamp: new Date().toISOString(),
    }

    // 将额外参数放入一个专用字段
    if (optionalParams.length > 0) {
      res.context = optionalParams
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
      logFn(this.formatInfo(message, ...optionalParams))
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
}

/**
 * 创建并返回一个 ConsoleLogger 实例。
 * @param options - 日志器配置选项。
 * @returns ConsoleLogger 实例。
 */
export function createLogger(options: LoggerOptions) {
  return new ConsoleLogger(options)
}
