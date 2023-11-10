import { TestCase, regexChecker, tableTest } from '@mudssky/jsutil'
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
