import { genAllCasesCombination, generateUUID, range } from '@mudssky/jsutil'

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
