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

const loggerLevelList = [
  {
    name: 'log',
    value: 0,
  },
  {
    name: 'trace',
    value: 0,
  },
  {
    name: 'debug',
    value: 1,
  },
  {
    name: 'info',
    value: 2,
  },
  {
    name: 'warn',
    value: 3,
  },
  {
    name: 'error',
    value: 4,
  },
] as const

export type LogLevel = (typeof loggerLevelList)[number]['name']
export interface LoggerOptions {
  name?: string
  level: LogLevel
  formatter?: (
    options: LoggerOptions,
    message?: any,
    ...optionalParams: any[]
  ) => string
}
export interface LogContent extends Omit<LoggerOptions, 'formatter'> {
  message: any
  timestamp: any
  [key: string]: any
}
export class ConsoleLogger extends AbstractLogger {
  private levelMap: Map<LogLevel, number>
  private enabelFormat = true
  constructor(private options: LoggerOptions) {
    super()
    this.levelMap = new Map(
      loggerLevelList.map((item) => [item.name, item.value]),
    )
  }
  private formatInfo(message?: any, ...optionalParams: any[]) {
    if (this.options.formatter) {
      return this.options.formatter(this.options, message, ...optionalParams)
    }
    const res: LogContent = {
      ...omit(this.options, ['formatter']),
      message: message,
      timestamp: new Date().toISOString(),
    }

    for (let i = 0; i < optionalParams.length; i++) {
      const index = `${i}`
      res[index] = optionalParams[i]
    }
    return JSON.stringify(res)
  }

  private canLog(level: LogLevel) {
    const currentLogLevel = this.levelMap.get(level) ?? 0
    if (currentLogLevel >= this.levelMap.get(this.options.level)!) {
      return true
    }
    return false
  }
  log(message?: any, ...optionalParams: any[]): void {
    if (this.canLog('log')) {
      if (this.enabelFormat) {
        console.log(this.formatInfo(message, ...optionalParams))
      } else {
        console.log(message, ...optionalParams)
      }
    }
  }
  trace(message?: any, ...optionalParams: any[]): void {
    if (this.canLog('trace')) {
      if (this.enabelFormat) {
        console.trace(this.formatInfo(message, ...optionalParams))
      } else {
        console.trace(message, ...optionalParams)
      }
    }
  }
  debug(message?: any, ...optionalParams: any[]): void {
    if (this.canLog('debug')) {
      if (this.enabelFormat) {
        console.debug(this.formatInfo(message, ...optionalParams))
      } else {
        console.debug(message, ...optionalParams)
      }
    }
  }
  info(message?: any, ...optionalParams: any[]): void {
    if (this.canLog('info')) {
      if (this.enabelFormat) {
        console.info(this.formatInfo(message, ...optionalParams))
      } else {
        console.info(message, ...optionalParams)
      }
    }
  }
  warn(message?: any, ...optionalParams: any[]): void {
    if (this.canLog('warn')) {
      if (this.enabelFormat) {
        console.warn(this.formatInfo(message, ...optionalParams))
      } else {
        console.warn(message, ...optionalParams)
      }
    }
  }
  error(message?: any, ...optionalParams: any[]): void {
    if (this.canLog('error')) {
      if (this.enabelFormat) {
        console.error(this.formatInfo(message, ...optionalParams))
      } else {
        console.error(message, ...optionalParams)
      }
    }
  }
}

export function createLogger(options: LoggerOptions) {
  return new ConsoleLogger(options)
}
