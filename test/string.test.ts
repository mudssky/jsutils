import {
  TestCase,
  fuzzyMatch,
  genAllCasesCombination,
  generateBase62Code,
  generateUUID,
  getFileExt,
  range,
  tableTest,
} from '@mudssky/jsutils'

import { describe, expect, test } from 'vitest'

describe('genAllCasesCombination', () => {
  test('should return [""] when input empty str ', () => {
    expect(genAllCasesCombination('')).toEqual([''])
  })
  test('main func', () => {
    expect(genAllCasesCombination('kb').sort()).toEqual(
      ['kb', 'Kb', 'kB', 'KB'].sort(),
    )
    expect(genAllCasesCombination('k1b').sort()).toEqual(
      ['k1b', 'K1b', 'k1B', 'K1B'].sort(),
    )
  })
})

describe('generateUUID', () => {
  test('check id unique ', () => {
    const uuids = range(1, 100000).map(() => {
      return generateUUID()
    })
    const uuidSet = new Set(uuids)
    expect(uuids.length).toEqual(uuidSet.size)
  })
})

describe('fuzzyMatch table', () => {
  test('email', () => {
    const testCases: TestCase<[string, string]>[] = [
      { input: ['jk', 'jkl;djaksl'], expect: true },
      { input: ['jkk', 'jkl;djaksl'], expect: false },
      { input: ['jK', 'jkl;djaksl'], expect: true },
      { input: ['Jk', 'jkl;djaksl'], expect: true },
    ]
    tableTest(testCases, (tcase) => {
      try {
        expect(fuzzyMatch(...tcase.input)).toBe(tcase.expect)
      } catch (e) {
        console.log(tcase)
        // console.log({ e })
        throw e
      }
    })
  })
})

describe('generateBase62Code', () => {
  test('should generate a string of default length 6', () => {
    const result = generateBase62Code()
    expect(result).toMatch(/^[0-9A-Za-z]{6}$/)
  })

  test('should generate a string of specified length', () => {
    const len = 10
    const result = generateBase62Code(len)
    expect(result).toHaveLength(len)
    expect(result).toMatch(/^[0-9A-Za-z]{10}$/)
  })

  test('should throw an error if length is less than or equal to 0', () => {
    expect(() => generateBase62Code(0)).toHaveLength(0)
    expect(() => generateBase62Code(-5)).toThrow('len must be greater than 0')
  })

  test('should generate different strings on multiple calls', () => {
    const result1 = generateBase62Code()
    const result2 = generateBase62Code()
    expect(result1).not.toEqual(result2)
  })

  test('should generate a string of length 1', () => {
    const result = generateBase62Code(1)
    expect(result).toHaveLength(1)
    expect(result).toMatch(/^[0-9A-Za-z]$/)
  })
})

describe('getFileExt', () => {
  // Happy path test case
  test('should return the correct file extension for a valid file name', () => {
    expect(getFileExt('document.pdf')).toBe('pdf')
    expect(getFileExt('archive.tar.gz')).toBe('gz')
    expect(getFileExt('image.jpeg')).toBe('jpeg')
  })

  // Edge cases
  test('should return an empty string for a file name without an extension', () => {
    expect(getFileExt('filename')).toBe('')
    expect(getFileExt('no_extension.')).toBe('')
  })

  test('should return an empty string for an empty file name', () => {
    expect(getFileExt('')).toBe('')
  })

  test('should return the extension for a file name with multiple dots', () => {
    expect(getFileExt('file.name.with.multiple.dots.txt')).toBe('txt')
  })

  test('should handle a single dot as the file name', () => {
    expect(getFileExt('.')).toBe('')
  })
})
