import { PromiseType } from '@mudssky/jsutils'
import { assertType, test } from 'vitest'

test('test PromiseType', async () => {
  const testFn: () => Promise<string> = async () => {
    return 'dad'
  }

  // expectTypeOf(testFn).toMatchTypeOf<{ name: string }>()

  assertType<PromiseType<ReturnType<typeof testFn>>>(await testFn())
})
