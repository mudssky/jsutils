import { pick, pickBy } from '@mudssky/jsutil'
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

      // {
      //   input: [
      //     {
      //       a: 1,
      //       b: 2,
      //       c: 3,
      //     },
      //     ['f', 'e'],
      //   ],
      //   output: {},
      // },

      // {
      //   input: [{}, ['f', 'e']],
      //   output: {},
      // },
    ] as const

    for (const caseItem of testCases) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment

      expect(pickBy(caseItem.input[0], caseItem.input[1])).toEqual(
        caseItem.output,
      )
    }
  })
})
