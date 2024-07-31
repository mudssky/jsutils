/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AppendArgument, ParameterType } from '@mudssky/jsutils'
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
