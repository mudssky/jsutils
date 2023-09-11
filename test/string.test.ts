import { genAllCasesCombination } from '@mudssky/jsutil'
import { describe, expect, test } from 'vitest'

describe('genAllCasesCombination', () => {
  test('should return [""] when input empty str ', () => {
    expect(genAllCasesCombination('')).toEqual([''])
  })
  test('main func', () => {
    expect(genAllCasesCombination('kb').sort()).toEqual(
      ['kb', 'Kb', 'kB', 'KB'].sort()
    )
    expect(genAllCasesCombination('k1b').sort()).toEqual(
      ['k1b', 'K1b', 'k1B', 'K1B'].sort()
    )
  })
})
