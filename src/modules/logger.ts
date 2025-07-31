/* eslint-disable no-console */
import { omit } from './object'

/* eslint-disable @typescript-eslint/no-explicit-any */
abstract class AbstractLogger {
  abstract log(message?: any, ...optionalParams: any[]): void
  abstract trace(message?: any, ...optionalParams: any[]): void
  abstract debug(message?: any, ...optionalParams: any[]): void
  abstract info(message?: any, ...optionalParams: any[]): void
  abstract warn(message?: any, ...optionalParams: any[]): void
  abstract error(message?: any, ...optionalParams: any[]): void
}

const loggerLevels = {
  trace: 0,
  log: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
} as const

export type LogLevel = keyof typeof loggerLevels
export interface LoggerOptions {
  name?: string
  level: LogLevel
  enableFormat?: boolean
  formatter?: (
    options: LoggerOptions,
    message?: any,
    ...optionalParams: any[]
  ) => string
}
export interface LogContent
  extends Omit<LoggerOptions, 'formatter' | 'enableFormat'> {
  message: any
  timestamp: any
  context?: any[]
}
export class ConsoleLogger extends AbstractLogger {
  constructor(private options: LoggerOptions) {
    super()
    // 提供默认值
    this.options.enableFormat = this.options.enableFormat !== false
  }
  private formatInfo(message?: any, ...optionalParams: any[]) {
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
    message?: any,
    ...optionalParams: any[]
  ): void {
    if (!this.canLog(level)) return

    // 获取对应的 console 方法，如 console.log, console.info 等
    const logFn = (console as any)[level] || console.log

    if (this.options.enableFormat) {
      logFn(this.formatInfo(message, ...optionalParams))
    } else {
      logFn(message, ...optionalParams)
    }
  }

  log(message?: any, ...optionalParams: any[]): void {
    this.performLog('log', message, ...optionalParams)
  }

  trace(message?: any, ...optionalParams: any[]): void {
    this.performLog('trace', message, ...optionalParams)
  }

  debug(message?: any, ...optionalParams: any[]): void {
    this.performLog('debug', message, ...optionalParams)
  }

  info(message?: any, ...optionalParams: any[]): void {
    this.performLog('info', message, ...optionalParams)
  }

  warn(message?: any, ...optionalParams: any[]): void {
    this.performLog('warn', message, ...optionalParams)
  }

  error(message?: any, ...optionalParams: any[]): void {
    this.performLog('error', message, ...optionalParams)
  }
}

export function createLogger(options: LoggerOptions) {
  return new ConsoleLogger(options)
}
