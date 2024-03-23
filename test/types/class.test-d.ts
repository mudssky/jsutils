/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ConstructorParameterType } from '@mudssky/jsutils'
import { assertType, test } from 'vitest'

let n!: never

class Dog {
  name: string
  constructor(name: string) {
    this.name = name
  }

  say(this: Dog) {
    return 'hello ' + this.name
  }
}
interface DogConstructor {
  new (name: string): Dog
}
test('test ConstructorParameterType', () => {
  assertType<ConstructorParameterType<DogConstructor>>(['ss'])
})
