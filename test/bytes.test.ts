import {
  BytesUnitType,
  bytes,
  bytesInstance,
  bytesUnitMap,
  genAllCasesCombination,
} from '@mudssky/jsutil'
import { assert, describe, expect, it, test } from 'vitest'

function genTestCases(
  num: number,
  bytesType: BytesUnitType,
): [string, number][] {
  const mbAllCases = genAllCasesCombination(bytesType)
  const testCases: [string, number][] = mbAllCases.map((item) => {
    return [num + item, num * bytesUnitMap[bytesType]]
  })
  return testCases
}

describe('Test byte parse function', function () {
  test('Should return null if input is invalid', function () {
    expect(bytesInstance.parse('foobar')).toBe(null)
  })

  test('Should parse KB', function () {
    const kb = 1 * Math.pow(1024, 1)
    const testCases: [string, number][] = [
      ['1kb', kb],
      ['1Kb', kb],
      ['1kB', kb],
      ['1KB', kb],
      ['0.5Kb', 0.5 * kb],
      ['0.5kB', 0.5 * kb],
      ['0.5kb', 0.5 * kb],
      ['0.5KB', 0.5 * kb],
      ['1.5kb', 1.5 * kb],
      ['1.5Kb', 1.5 * kb],
      ['1.5kB', 1.5 * kb],
      ['1.5KB', 1.5 * kb],
    ]
    for (const [input, expected] of testCases) {
      expect(bytesInstance.parse(input)).toBe(expected)
    }
  })

  test('Should parse MB', function () {
    const mbAllCases = genAllCasesCombination('mb')
    const testCases: [string, number][] = mbAllCases.map((item) => {
      return [1 + item, 1 * Math.pow(1024, 2)]
    })
    for (const [input, expected] of testCases) {
      expect(bytesInstance.parse(input)).toBe(expected)
    }
  })

  test('Should parse GB', function () {
    const mbAllCases = genAllCasesCombination('GB')
    const testCases: [string, number][] = mbAllCases.map((item) => {
      return [1 + item, 1 * Math.pow(1024, 3)]
    })
    for (const [input, expected] of testCases) {
      expect(bytesInstance.parse(input)).toBe(expected)
    }
  })

  test('Should parse TB', function () {
    const testCases = [
      ...genTestCases(1, 'tb'),
      ...genTestCases(0.5, 'tb'),
      ...genTestCases(1.5, 'tb'),
    ]
    for (const [input, expected] of testCases) {
      expect(bytesInstance.parse(input)).toBe(expected)
    }
  })

  test('Should parse PB', function () {
    const testCases = [
      ...genTestCases(1, 'pb'),
      ...genTestCases(0.5, 'pb'),
      ...genTestCases(1.5, 'pb'),
    ]
    for (const [input, expected] of testCases) {
      expect(bytesInstance.parse(input)).toBe(expected)
    }
  })
  // 没有单位时假定为b
  test('Should assume bytes when no units', function () {
    expect(bytesInstance.parse('0')).toBe(0)
    expect(bytesInstance.parse('-1')).toBe(-1)
    expect(bytesInstance.parse('1024')).toBe(1024)
    expect(bytesInstance.parse('0x11')).toBe(0)
  })

  test('Should accept negative values', () => {
    expect(bytesInstance.parse('-1')).toBe(-1)
    expect(bytesInstance.parse('-1024')).toBe(-1024)
    expect(bytesInstance.parse('-1.5TB')).toBe(-1.5 * Math.pow(1024, 4))
  })

  // 精度只到1b
  test('Should drop partial bytes', () => {
    expect(bytesInstance.parse('1.1b')).toBe(1)
    expect(bytesInstance.parse('1.0001kb')).toBe(1024)
  })

  test('Should allow whitespace', () => {
    expect(bytesInstance.parse('1 TB')).toBe(1 * Math.pow(1024, 4))
  })
})

describe('Test byte format function', function () {
  const pb = Math.pow(1024, 5)
  const tb = (1 << 30) * 1024,
    gb = 1 << 30,
    mb = 1 << 20,
    kb = 1 << 10

  it('Should return null if input is invalid', function () {
    assert.strictEqual(bytesInstance.format(NaN), null)
    assert.strictEqual(bytesInstance.format(Infinity), null)
  })

  it('Should convert numbers < 1024 to `bytes` string', function () {
    assert.equal(bytesInstance.format(0)?.toLowerCase(), '0b')
    assert.equal(bytesInstance.format(100)?.toLowerCase(), '100b')
    assert.equal(bytesInstance.format(-100)?.toLowerCase(), '-100b')
  })

  it('Should convert numbers >= 1 024 to kb string', function () {
    assert.equal(bytesInstance.format(kb)?.toLowerCase(), '1kb')
    assert.equal(bytesInstance.format(-kb)?.toLowerCase(), '-1kb')
    assert.equal(bytesInstance.format(2 * kb)?.toLowerCase(), '2kb')
  })

  it('Should convert numbers >= 1 048 576 to mb string', function () {
    assert.equal(bytesInstance.format(mb)?.toLowerCase(), '1mb')
    assert.equal(bytesInstance.format(-mb)?.toLowerCase(), '-1mb')
    assert.equal(bytesInstance.format(2 * mb)?.toLowerCase(), '2mb')
  })

  it('Should convert numbers >= (1 << 30) to gb string', function () {
    assert.equal(bytesInstance.format(gb)?.toLowerCase(), '1gb')
    assert.equal(bytesInstance.format(-gb)?.toLowerCase(), '-1gb')
    assert.equal(bytesInstance.format(2 * gb)?.toLowerCase(), '2gb')
  })

  it('Should convert numbers >= ((1 << 30) * 1024) to tb string', function () {
    assert.equal(bytesInstance.format(tb)?.toLowerCase(), '1tb')
    assert.equal(bytesInstance.format(-tb)?.toLowerCase(), '-1tb')
    assert.equal(bytesInstance.format(2 * tb)?.toLowerCase(), '2tb')
  })

  it('Should convert numbers >= 1 125 899 906 842 624 to pb string', function () {
    assert.equal(bytesInstance.format(pb)?.toLowerCase(), '1pb')
    assert.equal(bytesInstance.format(-pb)?.toLowerCase(), '-1pb')
    assert.equal(bytesInstance.format(2 * pb)?.toLowerCase(), '2pb')
  })

  it('Should return standard case', function () {
    assert.equal(bytesInstance.format(10), '10B')
    assert.equal(bytesInstance.format(kb), '1KB')
    assert.equal(bytesInstance.format(mb), '1MB')
    assert.equal(bytesInstance.format(gb), '1GB')
    assert.equal(bytesInstance.format(tb), '1TB')
    assert.equal(bytesInstance.format(pb), '1PB')
  })

  it('Should support custom thousands separator', function () {
    assert.equal(bytesInstance.format(1000)?.toLowerCase(), '1000b')
    assert.equal(
      bytesInstance.format(1000, { thousandsSeparator: '' })?.toLowerCase(),
      '1000b',
    )
    assert.equal(
      bytesInstance.format(1000, { thousandsSeparator: '.' })?.toLowerCase(),
      '1.000b',
    )
    assert.equal(
      bytesInstance.format(1000, { thousandsSeparator: ',' })?.toLowerCase(),
      '1,000b',
    )
    assert.equal(
      bytesInstance.format(1000, { thousandsSeparator: ' ' })?.toLowerCase(),
      '1 000b',
    )
    assert.equal(
      bytesInstance
        .format(1005.1005 * kb, { decimalPlaces: 4, thousandsSeparator: '_' })
        ?.toLowerCase(),
      '1_005.1005kb',
    )
  })

  it('Should support custom unit separator', function () {
    assert.equal(bytesInstance.format(1024), '1KB')
    assert.equal(bytesInstance.format(1024, { unitSeparator: '' }), '1KB')

    assert.equal(bytesInstance.format(1024, { unitSeparator: ' ' }), '1 KB')
    assert.equal(bytesInstance.format(1024, { unitSeparator: '\t' }), '1\tKB')
  })

  it('Should support custom number of decimal places', function () {
    assert.equal(
      bytesInstance.format(kb - 1, { decimalPlaces: 0 })?.toLowerCase(),
      '1023b',
    )
    assert.equal(
      bytesInstance.format(kb, { decimalPlaces: 0 })?.toLowerCase(),
      '1kb',
    )
    assert.equal(
      bytesInstance.format(1.4 * kb, { decimalPlaces: 0 })?.toLowerCase(),
      '1kb',
    )
    assert.equal(
      bytesInstance.format(1.5 * kb, { decimalPlaces: 0 })?.toLowerCase(),
      '2kb',
    )
    assert.equal(
      bytesInstance.format(kb - 1, { decimalPlaces: 1 })?.toLowerCase(),
      '1023b',
    )
    assert.equal(
      bytesInstance.format(kb, { decimalPlaces: 1 })?.toLowerCase(),
      '1kb',
    )
    assert.equal(
      bytesInstance.format(1.04 * kb, { decimalPlaces: 1 })?.toLowerCase(),
      '1kb',
    )
    assert.equal(
      bytesInstance.format(1.05 * kb, { decimalPlaces: 1 })?.toLowerCase(),
      '1.1kb',
    )
    assert.equal(
      bytesInstance.format(1.1005 * kb, { decimalPlaces: 4 })?.toLowerCase(),
      '1.1005kb',
    )
  })

  it('Should support fixed decimal places', function () {
    assert.equal(
      bytesInstance
        .format(kb, { decimalPlaces: 3, fixedDecimals: true })
        ?.toLowerCase(),
      '1.000kb',
    )
  })

  it('Should support floats', function () {
    assert.equal(bytesInstance.format(1.2 * mb)?.toLowerCase(), '1.2mb')
    assert.equal(bytesInstance.format(-1.2 * mb)?.toLowerCase(), '-1.2mb')
    assert.equal(bytesInstance.format(1.2 * kb)?.toLowerCase(), '1.2kb')
  })

  it('Should support custom unit', function () {
    assert.equal(
      bytesInstance.format(12 * mb, { unit: 'b' })?.toLowerCase(),
      '12582912b',
    )
    assert.equal(
      bytesInstance.format(12 * mb, { unit: 'kb' })?.toLowerCase(),
      '12288kb',
    )
    assert.equal(
      bytesInstance.format(12 * gb, { unit: 'mb' })?.toLowerCase(),
      '12288mb',
    )
    assert.equal(
      bytesInstance.format(12 * tb, { unit: 'gb' })?.toLowerCase(),
      '12288gb',
    )
    assert.equal(
      bytesInstance.format(12 * mb, { unit: '' })?.toLowerCase(),
      '12mb',
    )
    assert.equal(
      bytesInstance.format(12 * mb, { unit: 'bb' })?.toLowerCase(),
      '12mb',
    )
  })
})

describe('Test constructor', function () {
  it('Expect a function', function () {
    assert.equal(typeof bytes, 'function')
  })

  it('Should return null if input is invalid', function () {
    assert.strictEqual(bytes(NaN), null)

    assert.strictEqual(bytes('foobar'), null)
  })

  it('Should be able to parse a string into a number', function () {
    // This function is tested more accurately in another test suite
    assert.equal(bytes('1KB'), 1024)
  })

  it('Should convert a number into a string', function () {
    // This function is tested more accurately in another test suite
    assert.equal(bytes(1024), '1KB')
  })

  it('Should convert a number into a string with options', function () {
    // This function is tested more accurately in another test suite
    assert.equal(bytes(1000, { thousandsSeparator: ' ' }), '1 000B')
  })
})
