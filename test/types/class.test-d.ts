/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ClassPublicProps, Equal } from '@mudssky/jsutils'
import { assertType, test } from 'vitest'

// class Dog {
//   name: string
//   constructor(name: string) {
//     this.name = name
//   }

//   say(this: Dog) {
//     return 'hello ' + this.name
//   }
// }
// interface DogConstructor {
//   new (name: string): Dog
// }
// test('test ConstructorParameterType', () => {
//   assertType<ConstructorParameterType<DogConstructor>>(['ss'])
// })

test('test ClassPublicProps', () => {
  class Person1 {
    public name: string
    protected age: number
    private hobbies: string[]
    constructor() {
      this.name = 'zhangsan'
      this.age = 20
      this.hobbies = ['sleep', 'eat']
    }
  }

  assertType<Equal<ClassPublicProps<Person1>, { name: string }>>(true)
})
