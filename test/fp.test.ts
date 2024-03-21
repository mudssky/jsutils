import { ArgumentError, Monad, compose, curry, pipe } from '@mudssky/jsutils'
import { describe, expect, test } from 'vitest'

describe('pipe', () => {
  test('should create pipeline', () => {
    const add5 = (x: number) => x + 5
    const double = (x: number) => x * 2
    const square = (x: number) => x * x

    const pipeline = pipe<number>(add5, double, square)
    const result = pipeline(5)
    expect(result).toBe(400)
    // 参数为空时报错
    expect(() => pipe()).toThrowError(ArgumentError)
  })
})

describe('compose', () => {
  test('should create pipeline', () => {
    const add5 = (x: number) => x + 5
    const double = (x: number) => x * 2
    const square = (x: number) => x * x

    const pipeline = compose<number>(square, double, add5)
    const result = pipeline(5)
    expect(result).toBe(400)
    // 参数为空时报错
    expect(() => pipe()).toThrowError(ArgumentError)
  })
})

describe('curry', () => {
  test('should curry function', () => {
    function multiply(a: number, b: number, c: number) {
      return a * b * c
    }
    function add(a: number, b: number) {
      return a + b
    }

    function addMore(a: number, b: number, c: number, d: number) {
      return a + b + c + d
    }

    function divide(a: number, b: number) {
      return a / b
    }
    const multiplyCurried = curry(multiply)

    expect(multiplyCurried(1, 2, 3, 4)).toBe(6)
    expect(multiplyCurried(1, 2)(3)).toBe(6)
    expect(multiplyCurried(1)(2)(3)).toBe(6)

    const curriedAdd = curry(add)
    const curriedMultiply = curry(multiply)
    const curriedAddMore = curry(addMore)
    const curriedDivide = curry(divide)
    const computePipeline = pipe(
      curriedAdd(1),
      curriedMultiply(2)(3),
      curriedAddMore(1)(2)(3),
      curriedDivide(300),
    )
    expect(computePipeline(3)).toBe(10)
  })
})

describe('compose', () => {
  test('should create pipeline', () => {
    const add5 = (x: number) => x + 5
    const double = (x: number) => x * 2
    const square = (x: number) => x * x

    const pipeline = compose<number>(square, double, add5)
    const result = pipeline(5)
    expect(result).toBe(400)
    // 参数为空时报错
    expect(() => pipe()).toThrowError(ArgumentError)
  })
})

describe('monad', () => {
  test('should curry function', () => {
    // const monad = Monad.of(1)
    const nestedMonad = Monad.of(1)

    // 输出 Monad {val: 1}，符合“不嵌套”的预期
    const res = nestedMonad.flatMap((x) => x)
    // console.log({ res })
    expect(res).toEqual(1)
  })
})
