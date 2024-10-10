/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  mapKeys,
  mapValues,
  merge,
  omit,
  omitBy,
  pick,
  pickBy,
  removeNonSerializableProps,
  safeJsonStringify,
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

describe('merge', () => {
  test('normal merge', () => {
    const testCases = [
      {
        input: [
          {
            a: 1,
            b: 2,
            c: 3,
          },
          {
            a: 11,
            b: 22,
          },
        ],
        output: {
          a: 11,
          b: 22,
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
          {
            a: 11,
            b: 22,
          },
          {
            d: 66,
            c: 9,
          },
        ],
        output: {
          a: 11,
          b: 22,
          c: 9,
          d: 66,
        },
      },
      {
        input: [{}, { a: 1 }],
        output: {
          a: 1,
        },
      },
      {
        input: [{ a: 1 }, {}],
        output: {
          a: 1,
        },
      },
      {
        input: [
          {
            a: { b: { c: 3 }, d: 5 },
          },
          { a: { b: { c: 4 } } },
        ],
        output: {
          a: { b: { c: 4 }, d: 5 },
        },
      },
      {
        input: [
          {
            a: { b: { c: 3 } },
            d: 5,
          },
          { a: { b: 4 } },
        ],
        output: {
          a: { b: 4 },
          d: 5,
        },
      },
    ] as const

    for (const caseItem of testCases) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(merge(...caseItem.input)).toEqual(caseItem.output)
    }
  })
})

describe('removeNonSerializableProps', () => {
  test('removes functions and symbols from object', () => {
    const input = {
      name: 'Test',
      age: 30,
      greet: () => 'Hello',
      id: Symbol('id'),
    }
    const expectedOutput = {
      name: 'Test',
      age: 30,
    }
    expect(removeNonSerializableProps(input)).toEqual(expectedOutput)
  })

  test('removes functions from nested objects', () => {
    const input = {
      user: {
        name: 'Test',
        getName: () => 'Test User',
      },
      data: [1, 2, 3],
    }
    const expectedOutput = {
      user: {
        name: 'Test',
      },
      data: [1, 2, 3],
    }
    expect(removeNonSerializableProps(input)).toEqual(expectedOutput)
  })

  test('handles circular references', () => {
    const circularObj: any = { name: 'Circular' }
    circularObj.self = circularObj
    const expectedOutput = {
      name: 'Circular',
      self: '[Circular]',
    }
    expect(removeNonSerializableProps(circularObj)).toEqual(expectedOutput)
  })

  test('returns the same object if no non-serializable props', () => {
    const input = {
      name: 'Test',
      age: 30,
      active: true,
    }
    expect(removeNonSerializableProps(input)).toEqual(input)
  })

  test('handles null input', () => {
    expect(removeNonSerializableProps(null)).toBeNull()
  })

  test('handles array input', () => {
    const input = [1, 2, () => 'function', Symbol('sym')]
    const expectedOutput = [1, 2]
    expect(removeNonSerializableProps(input)).toEqual(expectedOutput)
  })
})

describe('safeJsonStringify', () => {
  test('should stringify a simple object', () => {
    const obj = { name: 'John', age: 30 }
    const result = safeJsonStringify(obj)
    expect(result).toBe(JSON.stringify(obj))
  })

  test('should remove function properties', () => {
    const obj = { name: 'John', age: 30, greet: () => 'Hello' }
    const result = safeJsonStringify(obj)
    expect(result).toBe(JSON.stringify({ name: 'John', age: 30 }))
  })

  test('should handle nested objects', () => {
    const obj = {
      person: { name: 'John', age: 30, greet: () => 'Hello' },
      job: { title: 'Developer', salary: 100000 },
    }
    const result = safeJsonStringify(obj)
    expect(result).toBe(
      JSON.stringify({
        person: { name: 'John', age: 30 },
        job: { title: 'Developer', salary: 100000 },
      }),
    )
  })

  test('should handle arrays with non-serializable objects', () => {
    const obj = { items: [1, 2, () => 'not serializable', { a: 1 }] }
    const result = safeJsonStringify(obj)
    expect(result).toBe(JSON.stringify({ items: [1, 2, { a: 1 }] }))
  })

  test('should return "{}" for an empty object', () => {
    const obj = {}
    const result = safeJsonStringify(obj)
    expect(result).toBe('{}')
  })

  test('should return "null" for null input', () => {
    const result = safeJsonStringify(null)
    expect(result).toBe('null')
  })

  test('should return "undefined" for undefined input', () => {
    const result = safeJsonStringify(undefined)
    expect(result).toBe(undefined)
  })

  test('should handle circular references and return a placeholder', () => {
    const obj: any = {}
    obj.ref = obj
    const result = safeJsonStringify(obj)
    expect(result).toBe(JSON.stringify({ ref: '[Circular]' }))
  })
})
