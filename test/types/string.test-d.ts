/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  Equal,
  Replace,
  ReplaceAll,
  ReverseStr,
  StartsWith,
  StrLen,
  Trim,
  TrimLeft,
  TrimRight,
} from '@mudssky/jsutils'
import { assertType, test } from 'vitest'
let n!: never
test('test StartsWith', () => {
  assertType<StartsWith<'1234', '123'>>(true)
  assertType<StartsWith<'1234', '223'>>(false)
})

test('test Replace', () => {
  assertType<Replace<'1234', '12', 'll'>>('ll34')
  assertType<Replace<'1234', 'aa', 'll'>>('1234')
  assertType<Replace<'123333', '3', '4'>>('124333')
})

test('test ReplaceAll', () => {
  assertType<ReplaceAll<'1234', '12', 'll'>>('ll34')
  assertType<ReplaceAll<'1234', 'aa', 'll'>>('1234')
  assertType<ReplaceAll<'123333', '3', '4'>>('124444')
})

test('test Trim', () => {
  assertType<TrimRight<'1234 \n \t'>>('1234')
  assertType<TrimLeft<'1234 \n \t'>>('1234 \n \t')
  assertType<TrimLeft<' \n1234 '>>('1234 ')
  assertType<TrimLeft<'1234 \n \t'>>('1234 \n \t')

  assertType<Trim<' 1234 \n \t'>>('1234')
  assertType<Trim<'\t1234 \n \t'>>('1234')
  assertType<Trim<'1234'>>('1234')
})

test('test ReverseStr', () => {
  assertType<ReverseStr<'1234'>>('4321')
  assertType<ReverseStr<''>>('')
})

test('test StrLen', () => {
  assertType<Equal<StrLen<'1234'>, 4>>(true)
  assertType<Equal<StrLen<''>, 0>>(true)
})
