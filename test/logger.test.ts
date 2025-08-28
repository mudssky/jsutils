import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ConsoleLogger,
  createLogger,
  type LoggerOptions,
  type LogLevel,
} from '../src/modules/logger'

describe('Logger', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>
    trace: ReturnType<typeof vi.spyOn>
    debug: ReturnType<typeof vi.spyOn>
    info: ReturnType<typeof vi.spyOn>
    warn: ReturnType<typeof vi.spyOn>
    error: ReturnType<typeof vi.spyOn>
  }

  beforeEach(() => {
    // Mock all console methods
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      trace: vi.spyOn(console, 'trace').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ConsoleLogger', () => {
    describe('Log Level Filtering', () => {
      it('should only log messages at or above the configured level', () => {
        const logger = new ConsoleLogger({ level: 'warn', enableFormat: false })

        logger.trace('trace message')
        logger.debug('debug message')
        logger.info('info message')
        logger.warn('warn message')
        logger.error('error message')

        expect(consoleSpy.trace).not.toHaveBeenCalled()
        expect(consoleSpy.debug).not.toHaveBeenCalled()
        expect(consoleSpy.info).not.toHaveBeenCalled()
        expect(consoleSpy.warn).toHaveBeenCalledWith('warn message')
        expect(consoleSpy.error).toHaveBeenCalledWith('error message')
      })

      it('should log all messages when level is trace', () => {
        const logger = new ConsoleLogger({
          level: 'trace',
          enableFormat: false,
        })

        logger.trace('trace message')
        logger.log('log message')
        logger.debug('debug message')
        logger.info('info message')
        logger.warn('warn message')
        logger.error('error message')

        expect(consoleSpy.trace).toHaveBeenCalledWith('trace message')
        expect(consoleSpy.log).toHaveBeenCalledWith('log message')
        expect(consoleSpy.debug).toHaveBeenCalledWith('debug message')
        expect(consoleSpy.info).toHaveBeenCalledWith('info message')
        expect(consoleSpy.warn).toHaveBeenCalledWith('warn message')
        expect(consoleSpy.error).toHaveBeenCalledWith('error message')
      })

      it('should handle log and trace levels equally (both at level 0)', () => {
        const logger = new ConsoleLogger({ level: 'log', enableFormat: false })

        logger.trace('trace message')
        logger.log('log message')

        expect(consoleSpy.trace).toHaveBeenCalledWith('trace message')
        expect(consoleSpy.log).toHaveBeenCalledWith('log message')
      })
    })

    describe('Format Options', () => {
      it('should format messages when enableFormat is true (default)', () => {
        const logger = new ConsoleLogger({ level: 'info', name: 'test-logger' })

        logger.info('test message', { extra: 'data' })

        expect(consoleSpy.info).toHaveBeenCalledTimes(1)
        const loggedMessage = consoleSpy.info.mock.calls[0][0] as string
        expect(typeof loggedMessage).toBe('string')

        const parsed = JSON.parse(loggedMessage)
        expect(parsed.name).toBe('test-logger')
        expect(parsed.level).toBe('info')
        expect(parsed.message).toBe('test message')
        expect(parsed.context).toEqual([{ extra: 'data' }])
        expect(parsed.timestamp).toBeDefined()
      })

      it('should not format messages when enableFormat is false', () => {
        const logger = new ConsoleLogger({ level: 'info', enableFormat: false })

        logger.info('test message', { extra: 'data' })

        expect(consoleSpy.info).toHaveBeenCalledWith('test message', {
          extra: 'data',
        })
      })

      it('should default enableFormat to true when not specified', () => {
        const logger = new ConsoleLogger({ level: 'info' })

        logger.info('test message')

        expect(consoleSpy.info).toHaveBeenCalledTimes(1)
        const loggedMessage = consoleSpy.info.mock.calls[0][0] as string
        expect(typeof loggedMessage).toBe('string')
      })

      it('should explicitly set enableFormat to true when passed true', () => {
        const logger = new ConsoleLogger({ level: 'info', enableFormat: true })

        logger.info('test message')

        expect(consoleSpy.info).toHaveBeenCalledTimes(1)
        const loggedMessage = consoleSpy.info.mock.calls[0][0]
        expect(typeof loggedMessage).toBe('string')
      })
    })

    describe('Message Formatting', () => {
      it('should include all logger options except formatter and enableFormat in formatted output', () => {
        const logger = new ConsoleLogger({
          level: 'info',
          name: 'test-logger',
          enableFormat: true,
        })

        logger.info('test message')

        const loggedMessage = consoleSpy.info.mock.calls[0][0] as string
        const parsed = JSON.parse(loggedMessage)

        expect(parsed.name).toBe('test-logger')
        expect(parsed.level).toBe('info')
        expect(parsed.enableFormat).toBeUndefined()
        expect(parsed.formatter).toBeUndefined()
      })

      it('should handle multiple optional parameters in context', () => {
        const logger = new ConsoleLogger({ level: 'info' })

        logger.info(
          'test message',
          { param1: 'value1' },
          { param2: 'value2' },
          'string param',
        )

        const loggedMessage = consoleSpy.info.mock.calls[0][0] as string
        const parsed = JSON.parse(loggedMessage)

        expect(parsed.context).toEqual([
          { param1: 'value1' },
          { param2: 'value2' },
          'string param',
        ])
      })

      it('should not include context field when no optional parameters', () => {
        const logger = new ConsoleLogger({ level: 'info' })

        logger.info('test message')

        const loggedMessage = consoleSpy.info.mock.calls[0][0] as string
        const parsed = JSON.parse(loggedMessage)

        expect(parsed.context).toBeUndefined()
      })

      it('should include timestamp in ISO format', () => {
        const logger = new ConsoleLogger({ level: 'info' })

        logger.info('test message')

        const loggedMessage = consoleSpy.info.mock.calls[0][0] as string
        const parsed = JSON.parse(loggedMessage)

        expect(parsed.timestamp).toBeDefined()
        expect(new Date(parsed.timestamp).toISOString()).toBe(parsed.timestamp)
      })
    })

    describe('Custom Formatter', () => {
      it('should use custom formatter when provided', () => {
        const customFormatter = vi
          .fn()
          .mockReturnValue('custom formatted message')
        const logger = new ConsoleLogger({
          level: 'info',
          formatter: customFormatter,
        })

        logger.info('test message', { extra: 'data' })

        expect(customFormatter).toHaveBeenCalledWith('info', 'test message', {
          extra: 'data',
        })
        expect(consoleSpy.info).toHaveBeenCalledWith('custom formatted message')
      })

      it('should pass correct options to custom formatter', () => {
        const customFormatter = vi.fn().mockReturnValue('formatted')
        const options: LoggerOptions = {
          level: 'info',
          name: 'test-logger',
          enableFormat: true,
          formatter: customFormatter,
        }
        const logger = new ConsoleLogger(options)

        logger.info('test message')

        expect(customFormatter).toHaveBeenCalledWith('info', 'test message')
      })
    })

    describe('All Log Methods', () => {
      const logMethods: Array<{
        method: LogLevel
        consoleFn: keyof typeof consoleSpy
      }> = [
        { method: 'log', consoleFn: 'log' },
        { method: 'trace', consoleFn: 'trace' },
        { method: 'debug', consoleFn: 'debug' },
        { method: 'info', consoleFn: 'info' },
        { method: 'warn', consoleFn: 'warn' },
        { method: 'error', consoleFn: 'error' },
      ]

      logMethods.forEach(({ method, consoleFn }) => {
        it(`should call console.${consoleFn} for ${method} method`, () => {
          const logger = new ConsoleLogger({
            level: 'trace',
            enableFormat: false,
          })

          logger[method]('test message')

          expect(consoleSpy[consoleFn]).toHaveBeenCalledWith('test message')
        })

        it(`should format ${method} messages when enableFormat is true`, () => {
          const logger = new ConsoleLogger({
            level: 'trace',
            enableFormat: true,
          })

          logger[method]('test message')

          expect(consoleSpy[consoleFn]).toHaveBeenCalledTimes(1)
          const loggedMessage = consoleSpy[consoleFn].mock.calls[0][0] as string
          expect(typeof loggedMessage).toBe('string')

          const parsed = JSON.parse(loggedMessage)
          expect(parsed.message).toBe('test message')
        })
      })
    })
  })

  describe('createLogger', () => {
    it('should create a ConsoleLogger instance', () => {
      const logger = createLogger({ level: 'info' })

      expect(logger).toBeInstanceOf(ConsoleLogger)
    })

    it('should pass options to ConsoleLogger constructor', () => {
      const options: LoggerOptions = {
        level: 'warn',
        name: 'test-logger',
        enableFormat: false,
      }
      const logger = createLogger(options)

      logger.warn('test message')

      expect(consoleSpy.warn).toHaveBeenCalledWith('test message')
    })
  })

  describe('Error Object Handling', () => {
    it('should properly serialize Error objects in message', () => {
      const logger = new ConsoleLogger({ level: 'info' })
      const error = new Error('Test error message')
      error.stack = 'Error: Test error message\n    at test'

      logger.info(error)

      const loggedMessage = consoleSpy.info.mock.calls[0][0] as string
      const parsed = JSON.parse(loggedMessage)

      expect(parsed.message).toEqual({
        message: 'Test error message',
        stack: 'Error: Test error message\n    at test',
        name: 'Error',
      })
    })

    it('should properly serialize Error objects in optional parameters', () => {
      const logger = new ConsoleLogger({ level: 'info' })
      const error = new Error('Context error')
      error.stack = 'Error: Context error\n    at context'

      logger.info('Regular message', error, 'other param')

      const loggedMessage = consoleSpy.info.mock.calls[0][0] as string
      const parsed = JSON.parse(loggedMessage)

      expect(parsed.message).toBe('Regular message')
      expect(parsed.context).toEqual([
        {
          message: 'Context error',
          stack: 'Error: Context error\n    at context',
          name: 'Error',
        },
        'other param',
      ])
    })

    it('should handle Error objects with cause property', () => {
      const logger = new ConsoleLogger({ level: 'info' })
      const rootCause = new Error('Root cause')
      const error = new Error('Main error', { cause: rootCause })

      logger.info(error)

      const loggedMessage = consoleSpy.info.mock.calls[0][0] as string
      const parsed = JSON.parse(loggedMessage)

      expect(parsed.message.cause).toEqual({
        message: 'Root cause',
        stack: rootCause.stack,
        name: 'Error',
      })
    })

    it('should handle nested Error objects in cause chain', () => {
      const logger = new ConsoleLogger({ level: 'info' })
      const deepCause = new Error('Deep cause')
      const middleCause = new Error('Middle cause', { cause: deepCause })
      const mainError = new Error('Main error', { cause: middleCause })

      logger.info(mainError)

      const loggedMessage = consoleSpy.info.mock.calls[0][0] as string
      const parsed = JSON.parse(loggedMessage)

      expect(parsed.message.cause.cause).toEqual({
        message: 'Deep cause',
        stack: deepCause.stack,
        name: 'Error',
      })
    })

    it('should not modify non-Error objects', () => {
      const logger = new ConsoleLogger({ level: 'info' })
      const regularObject = { key: 'value', nested: { prop: 'test' } }

      logger.info('message', regularObject)

      const loggedMessage = consoleSpy.info.mock.calls[0][0] as string
      const parsed = JSON.parse(loggedMessage)

      expect(parsed.context[0]).toEqual(regularObject)
    })
  })

  describe('Child Logger', () => {
    it('should create child logger with merged context', () => {
      const parentLogger = new ConsoleLogger({
        level: 'info',
        context: { service: 'api', version: '1.0' },
        enableFormat: true,
      })

      const childLogger = parentLogger.child(
        { requestId: 'abc-123', userId: 99 },
        { level: 'debug' },
      )

      childLogger.debug('debug message')

      const loggedMessage = consoleSpy.debug.mock.calls[0][0] as string
      const parsed = JSON.parse(loggedMessage)

      expect(parsed.service).toBe('api')
      expect(parsed.version).toBe('1.0')
      expect(parsed.requestId).toBe('abc-123')
      expect(parsed.userId).toBe(99)
      expect(parsed.level).toBe('debug')
    })

    it('should inherit parent configuration when child options are partial', () => {
      const parentLogger = new ConsoleLogger({
        level: 'warn',
        context: { app: 'test' },
        enableFormat: true,
      })

      const childLogger = parentLogger.child({ module: 'auth' })

      childLogger.warn('warn message')

      const loggedMessage = consoleSpy.warn.mock.calls[0][0] as string
      const parsed = JSON.parse(loggedMessage)

      expect(parsed.app).toBe('test')
      expect(parsed.module).toBe('auth')
      expect(parsed.level).toBe('warn') // inherited from parent
    })

    it('should handle child logger when parent has no context', () => {
      const parentLogger = new ConsoleLogger({ level: 'info' })
      const childLogger = parentLogger.child({ requestId: 'test-123' })

      childLogger.info('info message')

      const loggedMessage = consoleSpy.info.mock.calls[0][0] as string
      const parsed = JSON.parse(loggedMessage)

      expect(parsed.requestId).toBe('test-123')
    })

    it('should handle child context overriding parent context fields', () => {
      const parentLogger = new ConsoleLogger({
        level: 'info',
        context: { service: 'api', env: 'dev' },
      })
      const childLogger = parentLogger.child({
        service: 'payment',
        requestId: 'abc',
      })

      childLogger.info('info message')

      const loggedMessage = consoleSpy.info.mock.calls[0][0] as string
      const parsed = JSON.parse(loggedMessage)

      expect(parsed.service).toBe('payment') // overridden
      expect(parsed.env).toBe('dev') // inherited
      expect(parsed.requestId).toBe('abc') // new field
    })

    it('should create independent logger instances', () => {
      const parentLogger = new ConsoleLogger({
        level: 'info',
        context: { service: 'api' },
      })
      const childLogger = parentLogger.child(
        { requestId: 'test' },
        { level: 'debug' },
      )

      // Parent should still use its original level
      parentLogger.debug('parent debug') // should not log
      childLogger.debug('child debug') // should log

      expect(consoleSpy.debug).toHaveBeenCalledTimes(1)
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('child debug'),
      )
    })

    it('should allow custom formatter in child logger', () => {
      const customFormatter = vi.fn().mockReturnValue('custom child format')
      const parentLogger = new ConsoleLogger({
        level: 'info',
        context: { app: 'test' },
      })
      const childLogger = parentLogger.child(
        { module: 'auth' },
        { formatter: customFormatter },
      )

      childLogger.info('test message')

      expect(customFormatter).toHaveBeenCalled()
      expect(consoleSpy.info).toHaveBeenCalledWith('custom child format')
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined and null messages', () => {
      const logger = new ConsoleLogger({ level: 'info', enableFormat: false })

      logger.info(undefined)
      logger.info(null)

      expect(consoleSpy.info).toHaveBeenCalledWith(undefined)
      expect(consoleSpy.info).toHaveBeenCalledWith(null)
    })

    it('should handle empty string messages', () => {
      const logger = new ConsoleLogger({ level: 'info', enableFormat: false })

      logger.info('')

      expect(consoleSpy.info).toHaveBeenCalledWith('')
    })

    it('should handle complex objects in optional parameters', () => {
      const logger = new ConsoleLogger({ level: 'info' })
      const complexObject = {
        nested: { deep: { value: 'test' } },
        array: [1, 2, 3],
        date: new Date('2023-01-01'),
      }

      logger.info('test message', complexObject)

      const loggedMessage = consoleSpy.info.mock.calls[0][0] as string
      const parsed = JSON.parse(loggedMessage)

      // Date对象在JSON序列化后会变成字符串，所以需要相应地调整期望值
      const expectedObject = {
        nested: { deep: { value: 'test' } },
        array: [1, 2, 3],
        date: '2023-01-01T00:00:00.000Z',
      }

      expect(parsed.context).toEqual([expectedObject])
    })
  })
})
