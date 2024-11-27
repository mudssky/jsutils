/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  Add,
  Divide,
  Equal,
  Fibonacci,
  GreaterThan,
  GreaterThanOrEqual,
  Mutiply,
  Subtract,
} from '@mudssky/jsutils'
import { assertType, test } from 'vitest'

let n: never

test('test Add', () => {
  assertType<Add<3, 5>>(8)
  assertType<Add<0, 0>>(0)
})

test('test Subtract', () => {
  assertType<Equal<Subtract<3, 5>, never>>(true)
  assertType<Equal<Subtract<5, 3>, 2>>(true)
  assertType<Equal<Subtract<0, 0>, 0>>(true)
})

test('test Mutiply', () => {
  assertType<Equal<Mutiply<5, 3>, 15>>(true)
  assertType<Equal<Mutiply<5, 0>, 0>>(true)
  assertType<Equal<Mutiply<0, 5>, 0>>(true)
})

test('test Divide', () => {
  assertType<Equal<Divide<6, 3>, 2>>(true)
  // assertType<Equal<Divide<5, 3>, 1>>(true)
})

test('test GreaterThan', () => {
  assertType<Equal<GreaterThan<6, 3>, true>>(true)
  assertType<Equal<GreaterThan<3, 3>, false>>(true)
})

test('test GreaterThanOrEqual', () => {
  assertType<Equal<GreaterThanOrEqual<6, 3>, true>>(true)
  assertType<Equal<GreaterThanOrEqual<3, 3>, true>>(true)
})

test('test Fibonacci', () => {
  assertType<Equal<Fibonacci<1>, 1>>(true)
  assertType<Equal<Fibonacci<2>, 1>>(true)
  assertType<Equal<Fibonacci<3>, 2>>(true)
  assertType<Equal<Fibonacci<4>, 3>>(true)
  assertType<Equal<Fibonacci<5>, 5>>(true)
  assertType<Equal<Fibonacci<6>, 8>>(true)
  assertType<Equal<Fibonacci<7>, 13>>(true)
  assertType<Equal<Fibonacci<8>, 21>>(true)
})
