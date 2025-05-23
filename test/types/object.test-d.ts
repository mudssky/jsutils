import {
  AllKeyPath,
  DeepRecord,
  Equal,
  ExtractOptional,
  ExtractRequired,
  FilterRecordByValue,
  PartialBy,
  PrefixKeyBy,
  RemoveIndexSignature,
} from '@mudssky/jsutils'
import { assertType, test } from 'vitest'

interface TestPerson {
  name: string
  age: number
  hobby: string[]
}
test('test ThisParameterType', () => {
  assertType<
    Equal<
      FilterRecordByValue<TestPerson, string | number>,
      { name: string; age: number }
    >
  >(true)
})

test('test ExtractOptional', () => {
  assertType<
    Equal<ExtractOptional<{ name: string; age?: number }>, { age?: number }>
  >(true)
  assertType<
    Equal<
      ExtractOptional<{ name: string; age: number | undefined }>,
      { age?: number }
    >
  >(false)
})

test('test ExtractRequired', () => {
  assertType<
    Equal<ExtractRequired<{ name: string; age?: number }>, { name: string }>
  >(true)
  assertType<
    Equal<
      ExtractRequired<{ name: string; age: number | undefined }>,
      { name: string; age: number | undefined }
    >
  >(true)
})

test('test RemoveIndexSignature', () => {
  assertType<
    Equal<
      RemoveIndexSignature<{
        name: string
        age?: number
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any
      }>,
      { name: string; age?: number }
    >
  >(true)
  assertType<
    Equal<
      RemoveIndexSignature<{ name: string; age: number | undefined }>,
      { name: string; age: number | undefined }
    >
  >(true)
})

test('test PartialBy', () => {
  assertType<
    Equal<
      PartialBy<{ name: string; age: number; sex: string }, 'name' | 'age'>,
      { name?: string; age?: number; sex: string }
    >
  >(true)
})

test('test PrefixKeyBy', () => {
  // type ll=Debug<PrefixKeyBy<{ name: string; age: number; sex: string }, 'my_'>>

  assertType<
    Equal<
      PrefixKeyBy<{ name: string; age: number; sex: string }, 'my_'>,
      { my_name: string; my_age: number; my_sex: string }
    >
  >(true)
})

test('test AllKeyPath', () => {
  assertType<
    Equal<
      AllKeyPath<{
        a: {
          b: {
            b1: string
            b2: string
          }
          c: {
            c1: string
            c2: string
          }
        }
      }>,
      'a' | 'a.b' | 'a.b.b1' | 'a.b.b2' | 'a.c' | 'a.c.c1' | 'a.c.c2'
    >
  >(true)
})

test('test DeepRecord', () => {
  assertType<
    Equal<
      DeepRecord<{
        a: string
        b: number
      }>,
      {
        a: string
        b: number
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } & Record<string, any>
    >
  >(true)

  assertType<
    Equal<
      DeepRecord<{
        a: string
        b: number
        c: {
          name: string
        }
      }>,
      {
        a: string
        b: number
        c: {
          name: string
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } & Record<string, any>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } & Record<string, any>
    >
  >(true)
})
