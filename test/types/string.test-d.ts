/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  AllCombinations,
  CamelCaseToKebabCase,
  Equal,
  JoinStr,
  KebabCaseToCamelCase,
  Replace,
  ReplaceAll,
  ReverseStr,
  StartsWith,
  StrLen,
  Trim,
  TrimFirst,
  TrimLeft,
  TrimPrefix,
  TrimRight,
  TrimSuffix,
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

test('test KebabCaseToCamelCase', () => {
  assertType<
    Equal<KebabCaseToCamelCase<'who-is-your-daddy'>, 'whoIsYourDaddy'>
  >(true)
})

test('test CamelCaseToKebabCase', () => {
  assertType<
    Equal<CamelCaseToKebabCase<'whoIsYourDaddy'>, 'who-is-your-daddy'>
  >(true)
})

test('test AllCombinations', () => {
  assertType<Equal<AllCombinations<'a'>, 'a'>>(true)
  assertType<Equal<AllCombinations<'a' | 'b'>, 'a' | 'b' | 'ab' | 'ba'>>(true)
  assertType<
    Equal<
      AllCombinations<'a' | 'b' | 'c'>,
      | 'a'
      | 'b'
      | 'c'
      | 'ab'
      | 'ac'
      | 'ba'
      | 'bc'
      | 'ca'
      | 'cb'
      | 'abc'
      | 'acb'
      | 'bac'
      | 'bca'
      | 'cab'
      | 'cba'
    >
  >(true)
})

test('test JoinStr', () => {
  assertType<Equal<JoinStr<['a', 'b', 'c'], '-'>, 'a-b-c'>>(true)
})

test('test TrimFirst', () => {
  assertType<Equal<TrimFirst<'abc'>, 'bc'>>(true)
})

test('test TrimPrefix', () => {
  assertType<Equal<TrimPrefix<'abc', 'ab'>, 'c'>>(true)
})

test('test TrimSuffix', () => {
  assertType<Equal<TrimSuffix<'abc', 'bc'>, 'a'>>(true)
})
