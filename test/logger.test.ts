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

        expect(customFormatter).toHaveBeenCalledWith(
          expect.objectContaining({ level: 'info' }),
          'test message',
          { extra: 'data' },
        )
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

        expect(customFormatter).toHaveBeenCalledWith(options, 'test message')
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
