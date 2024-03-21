import {
  TestCase,
  fuzzyMatch,
  genAllCasesCombination,
  generateUUID,
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
