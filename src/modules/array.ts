// src/modules/array.ts
export function arr_unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

export function str_ensure_prefix(s: string, prefix: string) {
  return s.startsWith(prefix) ? s : `${prefix}${s}`
}

export async function test(array: number[]) {
  const lll = 111
  console.log({ lll })

  await Promise.resolve()
  return array.filter((item) => item > 2)
}
