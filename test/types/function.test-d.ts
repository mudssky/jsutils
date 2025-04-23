/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  AppendArgument,
  ParameterType,
  PromiseParameterType,
  PromiseReturnType,
} from '@mudssky/jsutils'
import { assertType, test } from 'vitest'

let n!: never

class Dog {
  name: string
  constructor() {
    this.name = 'wang'
  }

  say(this: Dog) {
    return 'hello ' + this.name
  }
}
// let str!:string
test('test ParameterType', () => {
  assertType<ParameterType<() => void>>([])
  assertType<ParameterType<(a: string) => void>>(['123'])
})

test('test ThisParameterType', () => {
  const dog = new Dog()
  assertType<ThisParameterType<typeof dog.say>>(dog)
})

test('test AppendArgument', () => {
  const fn = () => {}
  assertType<AppendArgument<typeof fn, string>>((ll: string) => {})
})

test('test PromiseReturnType', () => {
  const asyncFn = async () => 'hello'
  assertType<PromiseReturnType<typeof asyncFn>>('hello')
})

test('test PromiseParameterType', () => {
  const asyncFn = async (a: string, b: number) => a + b
  assertType<PromiseParameterType<typeof asyncFn>>(['test', 123])
})
