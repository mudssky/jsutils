import { PromiseType } from '@mudssky/jsutil'
import { assertType, test } from 'vitest'

test('test PromiseType', async () => {
  const testFn: () => Promise<string> = async () => {
    return 'dsad'
  }

  // expectTypeOf(testFn).toMatchTypeOf<{ name: string }>()

  assertType<PromiseType<ReturnType<typeof testFn>>>(await testFn())
})
