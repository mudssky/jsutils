import { Equal, FilterRecordByValue } from '@mudssky/jsutils'
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
