import {
  TestCase,
  analyzePasswordStrength,
  regexChecker,
  tableTest,
} from '@mudssky/jsutils'
import { describe, expect, test } from 'vitest'

describe('regexChecker', () => {
  test('email', () => {
    const testCases: TestCase[] = [
      { input: 'test001@163.com', expect: true },
      {
        input: 'test..2002@gmail.com',
        expect: false,
      },
      {
        input: 'test.@gmail.com',
        expect: false,
      },
      {
        input: 'test123@.com.cn',
        expect: false,
      },
      {
        input: '12345@gmail.com.cn',
        expect: true,
      },
      {
        input: 'test@gmail.',
        expect: false,
      },
    ]
    tableTest(testCases, (tcase) => {
      try {
        expect(regexChecker.emailPattern.test(tcase.input)).toBe(tcase.expect)
      } catch (e) {
        console.log(tcase)
        // console.log({ e })
        throw e
      }
    })
  })
})

describe('analyzePasswordStrength', () => {
  test('当密码为 null 时，返回默认结果', () => {
    const result = analyzePasswordStrength({ password: null })
    expect(result).toEqual({
      minLength: false,
      hasLowercase: false,
      hasUppercase: false,
      hasDigit: false,
      hasSpecialChar: false,
    })
  })

  test('当密码长度小于 minLength 时，返回 minLength 为 true', () => {
    const result = analyzePasswordStrength({ password: 'Ab1!', minLength: 5 })
    expect(result.minLength).toBe(true)
  })

  test('当密码包含小写字母时，返回 hasLowercase 为 true', () => {
    const result = analyzePasswordStrength({ password: 'abcDEF1!' })
    expect(result.hasLowercase).toBe(true)
  })

  test('当密码包含大写字母时，返回 hasUppercase 为 true', () => {
    const result = analyzePasswordStrength({ password: 'abcDEF1!' })
    expect(result.hasUppercase).toBe(true)
  })

  test('当密码包含数字时，返回 hasDigit 为 true', () => {
    const result = analyzePasswordStrength({ password: 'abcDEF1!' })
    expect(result.hasDigit).toBe(true)
  })

  test('当密码包含特殊字符时，返回 hasSpecialChar 为 true', () => {
    const result = analyzePasswordStrength({ password: 'abcDEF1!' })
    expect(result.hasSpecialChar).toBe(true)
  })

  test('当密码符合所有强度要求时，返回所有判断为 true', () => {
    const password = 'A1b@cdef' // 自定义符合所有标准的密码
    const result = analyzePasswordStrength({ password })
    expect(result).toEqual({
      minLength: false,
      hasLowercase: true,
      hasUppercase: true,
      hasDigit: true,
      hasSpecialChar: true,
    })
  })
})
