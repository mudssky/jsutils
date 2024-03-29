import {
  mapKeys,
  mapValues,
  omit,
  omitBy,
  pick,
  pickBy,
} from '@mudssky/jsutils'
import { describe, expect, test } from 'vitest'

describe('pick', () => {
  test('should pick exist property', () => {
    const testCases = [
      {
        input: [
          {
            a: 1,
            b: 2,
            c: 3,
          },
          ['a', 'c'],
        ],
        output: {
          a: 1,
          c: 3,
        },
      },
      {
        input: [
          {
            a: 1,
            b: 2,
            c: 3,
          },
          ['a', 'e'],
        ],
        output: {
          a: 1,
        },
      },

      {
        input: [
          {
            a: 1,
            b: 2,
            c: 3,
          },
          ['f', 'e'],
        ],
        output: {},
      },

      {
        input: [{}, ['f', 'e']],
        output: {},
      },
      {
        input: [null, ['f', 'e']],
        output: {},
      },
      {
        input: [undefined, ['f', 'e']],
        output: {},
      },
    ] as const

    for (const caseItem of testCases) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(pick(caseItem.input[0], [...caseItem.input[1]])).toEqual(
        caseItem.output,
      )
    }
  })
})

describe('pickBy', () => {
  test('should pick exist property', () => {
    const testCases = [
      {
        input: [{ a: 1, b: null, c: 3, d: false, e: undefined }, undefined],
        output: {
          a: 1,
          c: 3,
        },
      },
      {
        input: [
          {
            a: 1,
            b: 2,
            c: 3,
          },
          (value: unknown) => value === 1,
        ],
        output: {
          a: 1,
        },
      },
      {
        input: [undefined, (value: unknown) => value === 1],
        output: {},
      },
    ] as const

    for (const caseItem of testCases) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment

      expect(pickBy(caseItem.input[0], caseItem.input[1])).toEqual(
        caseItem.output,
      )
    }
  })
})

describe('omit', () => {
  test('should pick exist property', () => {
    const testCases = [
      {
        input: [
          {
            a: 1,
            b: 2,
            c: 3,
          },
          ['a', 'c'],
        ],
        output: {
          b: 2,
        },
      },
      {
        input: [
          {
            a: 1,
            b: 2,
            c: 3,
          },
          ['a', 'e'],
        ],
        output: {
          b: 2,
          c: 3,
        },
      },

      {
        input: [
          {
            a: 1,
            b: 2,
            c: 3,
          },
          ['f', 'e'],
        ],
        output: {
          a: 1,
          b: 2,
          c: 3,
        },
      },

      {
        input: [{}, ['f', 'e']],
        output: {},
      },
      {
        input: [null, ['f', 'e']],
        output: {},
      },
      {
        input: [undefined, ['f', 'e']],
        output: {},
      },
    ] as const

    for (const caseItem of testCases) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(omit(caseItem.input[0], [...caseItem.input[1]])).toEqual(
        caseItem.output,
      )
    }
  })
})

describe('omitBy', () => {
  test('should pick exist property', () => {
    const testCases = [
      {
        input: [{ a: 1, b: null, c: 3, d: false, e: undefined }, undefined],
        output: {
          b: null,
          d: false,
          e: undefined,
        },
      },
      {
        input: [
          {
            a: 1,
            b: 2,
            c: 3,
          },
          (value: unknown) => value !== 1,
        ],
        output: {
          a: 1,
        },
      },
    ] as const

    for (const caseItem of testCases) {
      expect(omitBy(caseItem.input[0], caseItem.input[1])).toEqual(
        caseItem.output,
      )
    }
  })
})

describe('mapKeys', () => {
  test('normal usage', () => {
    const testCases = [
      {
        input: [
          {
            a: 1,
            b: 2,
            c: 3,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (value: any, key: any) => {
            return key + value
          },
        ],
        output: {
          a1: 1,
          b2: 2,
          c3: 3,
        },
      },
    ] as const

    for (const caseItem of testCases) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(mapKeys(...caseItem.input)).toEqual(caseItem.output)
    }
  })
})

describe('mapValues', () => {
  test('normal usage', () => {
    const testCases = [
      {
        input: [
          {
            a: 1,
            b: 2,
            c: 3,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (value: any, key: any) => {
            return key + value
          },
        ],
        output: {
          a: 'a1',
          b: 'b2',
          c: 'c3',
        },
      },
    ] as const

    for (const caseItem of testCases) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(mapValues(...caseItem.input)).toEqual(caseItem.output)
    }
  })
})
