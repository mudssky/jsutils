import { WebLocalStorage, WebSessionStorage } from '@mudssky/jsutils'
import { assertType, test } from 'vitest'

type CoreSchema = {
  user: { id: number; name: string }
  token: string
}

type SnapshotSchema = Record<
  `snapshot_${string}`,
  { page: number; timestamp: number }
>

type FormSchema = Record<`form_${string}`, Record<string, FormDataEntryValue>>

test('storage schema maps keys to values', async () => {
  const local = new WebLocalStorage<CoreSchema>()
  const session = new WebSessionStorage<
    CoreSchema & SnapshotSchema & FormSchema
  >()

  assertType<{ id: number; name: string } | null>(local.getStorageSync('user'))
  assertType<Promise<string | null>>(local.getStorage('token'))
  assertType<Promise<{ id: number; name: string } | null>>(
    session.getStorage('user'),
  )

  local.setStorageSync('token', 'jwt')
  session.setStorageSync('user', { id: 1, name: 'mudssky' })

  // @ts-expect-error key 不存在
  local.getStorageSync('missing')

  // @ts-expect-error value 类型错误
  session.setStorageSync('token', 1)
})
