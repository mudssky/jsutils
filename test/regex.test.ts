import {
  PasswordStrengthLevelStrategy,
  TestCase,
  analyzePasswordStrength,
  calculatePasswordStrengthLevel,
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
    const result = analyzePasswordStrength(null)
    expect(result).toEqual({
      minLength: false,
      hasLowercase: false,
      hasUppercase: false,
      hasDigit: false,
      hasSpecialChar: false,
    })
  })

  test('当密码长度小于 minLength 时，返回 minLength 为 true', () => {
    const result = analyzePasswordStrength('Ab1!', { minLength: 5 })
    expect(result.minLength).toBe(true)
  })

  test('当密码包含小写字母时，返回 hasLowercase 为 true', () => {
    const result = analyzePasswordStrength('abcDEF1!')
    expect(result.hasLowercase).toBe(true)
  })

  test('当密码包含大写字母时，返回 hasUppercase 为 true', () => {
    const result = analyzePasswordStrength('abcDEF1!')
    expect(result.hasUppercase).toBe(true)
  })

  test('当密码包含数字时，返回 hasDigit 为 true', () => {
    const result = analyzePasswordStrength('abcDEF1!')
    expect(result.hasDigit).toBe(true)
  })

  test('当密码包含特殊字符时，返回 hasSpecialChar 为 true', () => {
    const result = analyzePasswordStrength('abcDEF1!')
    expect(result.hasSpecialChar).toBe(true)
  })

  test('当密码符合所有强度要求时，返回所有判断为 true', () => {
    const password = 'A1b@cdef' // 自定义符合所有标准的密码
    const result = analyzePasswordStrength(password)
    expect(result).toEqual({
      minLength: false,
      hasLowercase: true,
      hasUppercase: true,
      hasDigit: true,
      hasSpecialChar: true,
    })
  })
})

describe('calculatePasswordStrengthLevel', () => {
  test('should return 4 for password with all character requirements met', () => {
    const result = calculatePasswordStrengthLevel('Abcde1@!')
    expect(result).toBe(4)
  })

  test('should handle passwords without special characters correctly', () => {
    const result = calculatePasswordStrengthLevel('Abcde1234')
    expect(result).toBe(3)
  })

  test('should return 0 for empty password', () => {
    const result = calculatePasswordStrengthLevel('')
    expect(result).toBe(0)
  })

  test('should return correct strength level for a complex password', () => {
    const result = calculatePasswordStrengthLevel('A1@abcdEf')
    expect(result).toBe(4)
  })

  test('should return 0 for password shorter than minLength', () => {
    const result = calculatePasswordStrengthLevel('abc', { minLength: 8 })
    expect(result).toBe(0)
  })

  test('should return 1 for password with minimum length and one lowercase letter', () => {
    const result = calculatePasswordStrengthLevel('abcdefgh')
    expect(result).toBe(1)
  })

  test('should return 2 for password with minimum length, one lowercase and one uppercase letter', () => {
    const result = calculatePasswordStrengthLevel('abcDeEFGH')
    expect(result).toBe(2)
  })

  test('should return 3 for password with minimum length, one lowercase, one uppercase letter, and one digit', () => {
    const result = calculatePasswordStrengthLevel('abcDeEFG1')
    expect(result).toBe(3)
  })

  test('should return 4 for password with minimum length and all required characters', () => {
    const result = calculatePasswordStrengthLevel('Abcdefg1@!', {
      minLength: 8,
    })
    expect(result).toBe(4)
  })

  test('should return 0 for null password', () => {
    const result = calculatePasswordStrengthLevel(null as unknown as string)
    expect(result).toBe(0)
  })

  test('should allow custom strategy for password strength level', () => {
    const customStrategy: PasswordStrengthLevelStrategy = (res) => {
      return Object.values(res).filter(Boolean).length * 2
    }
    const result = calculatePasswordStrengthLevel('Abcdefg1@!', {
      strategy: customStrategy,
      minLength: 8,
    })
    expect(result).toBe(8) // 4 rules satisfied, so 4 * 2
  })
})
