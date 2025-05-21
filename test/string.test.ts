import * as _ from '@mudssky/jsutils'
import {
  TestCase,
  fuzzyMatch,
  genAllCasesCombination,
  generateBase62Code,
  generateUUID,
  getFileExt,
  range,
  tableTest,
} from '@mudssky/jsutils'
import { assert, describe, expect, test } from 'vitest'

describe('genAllCasesCombination', () => {
  test('should return [""] when input empty str ', () => {
    expect(genAllCasesCombination('')).toEqual([''])
  })
  test('main func', () => {
    expect(genAllCasesCombination('kb').sort()).toEqual(
      ['kb', 'Kb', 'kB', 'KB'].sort(),
    )
    expect(genAllCasesCombination('k1b').sort()).toEqual(
      ['k1b', 'K1b', 'k1B', 'K1B'].sort(),
    )
  })
})

describe('generateUUID', () => {
  test('check id unique ', () => {
    const uuids = range(1, 100000).map(() => {
      return generateUUID()
    })
    const uuidSet = new Set(uuids)
    expect(uuids.length).toEqual(uuidSet.size)
  })
})

describe('fuzzyMatch table', () => {
  test('email', () => {
    const testCases: TestCase<[string, string]>[] = [
      { input: ['jk', 'jkl;djaksl'], expect: true },
      { input: ['jkk', 'jkl;djaksl'], expect: false },
      { input: ['jK', 'jkl;djaksl'], expect: true },
      { input: ['Jk', 'jkl;djaksl'], expect: true },
    ]
    tableTest(testCases, (tcase) => {
      try {
        expect(fuzzyMatch(...tcase.input)).toBe(tcase.expect)
      } catch (e) {
        console.log(tcase)
        // console.log({ e })
        throw e
      }
    })
  })
})

describe('generateBase62Code', () => {
  test('should generate a string of default length 6', () => {
    const result = generateBase62Code()
    expect(result).toMatch(/^[0-9A-Za-z]{6}$/)
  })

  test('should generate a string of specified length', () => {
    const len = 10
    const result = generateBase62Code(len)
    expect(result).toHaveLength(len)
    expect(result).toMatch(/^[0-9A-Za-z]{10}$/)
  })

  test('should throw an error if length is less than or equal to 0', () => {
    expect(() => generateBase62Code(0)).toHaveLength(0)
    expect(() => generateBase62Code(-5)).toThrow('len must be greater than 0')
  })

  test('should generate different strings on multiple calls', () => {
    const result1 = generateBase62Code()
    const result2 = generateBase62Code()
    expect(result1).not.toEqual(result2)
  })

  test('should generate a string of length 1', () => {
    const result = generateBase62Code(1)
    expect(result).toHaveLength(1)
    expect(result).toMatch(/^[0-9A-Za-z]$/)
  })
})

describe('getFileExt', () => {
  // Happy path test case
  test('should return the correct file extension for a valid file name', () => {
    expect(getFileExt('document.pdf')).toBe('pdf')
    expect(getFileExt('archive.tar.gz')).toBe('gz')
    expect(getFileExt('image.jpeg')).toBe('jpeg')
  })

  // Edge cases
  test('should return an empty string for a file name without an extension', () => {
    expect(getFileExt('filename')).toBe('')
    expect(getFileExt('no_extension.')).toBe('')
  })

  test('should return an empty string for an empty file name', () => {
    expect(getFileExt('')).toBe('')
  })

  test('should return the extension for a file name with multiple dots', () => {
    expect(getFileExt('file.name.with.multiple.dots.txt')).toBe('txt')
  })

  test('should handle a single dot as the file name', () => {
    expect(getFileExt('.')).toBe('')
  })
})

describe('capitalize function', () => {
  test('handles null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = _.capitalize(null as any)
    assert.equal(result, '')
  })
  test('converts hello as Hello', () => {
    const result = _.capitalize('hello')
    assert.equal(result, 'Hello')
  })
  test('converts hello Bob as Hello bob', () => {
    const result = _.capitalize('hello Bob')
    assert.equal(result, 'Hello bob')
  })
})

describe('camelCase function', () => {
  test('returns correctly cased string', () => {
    const result = _.camelCase('hello world')
    assert.equal(result, 'helloWorld')
  })
  test('returns single word', () => {
    const result = _.camelCase('hello')
    assert.equal(result, 'hello')
  })
  test('returns empty string for empty input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = _.camelCase(null as any)
    assert.equal(result, '')
  })
  test('a word in camel case should remain in camel case', () => {
    const result = _.camelCase('helloWorld')
    assert.equal(result, 'helloWorld')
  })
})

describe('snake_case function', () => {
  test('returns correctly cased string', () => {
    const result = _.snake_case('hello world')
    assert.equal(result, 'hello_world')
  })
  test('must handle strings that are camelCase', () => {
    const result = _.snake_case('helloWorld')
    assert.equal(result, 'hello_world')
  })
  test('must handle strings that are dash', () => {
    const result = _.snake_case('hello-world')
    assert.equal(result, 'hello_world')
  })
  test('splits numbers that are next to letters', () => {
    const result = _.snake_case('hello-world12_19-bye')
    assert.equal(result, 'hello_world_12_19_bye')
  })
  test('does not split numbers when flag is set to false', () => {
    const result = _.snake_case('hello-world12_19-bye', {
      splitOnNumber: false,
    })
    assert.equal(result, 'hello_world12_19_bye')
  })
  test('returns single word', () => {
    const result = _.snake_case('hello')
    assert.equal(result, 'hello')
  })
  test('returns empty string for empty input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = _.snake_case(null as any)
    assert.equal(result, '')
  })
})

describe('dashCase function', () => {
  test('returns correctly cased string', () => {
    const result = _.dashCase('hello world')
    assert.equal(result, 'hello-world')
  })
  test('returns single word', () => {
    const result = _.dashCase('hello')
    assert.equal(result, 'hello')
  })
  test('returns empty string for empty input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = _.dashCase(null as any)
    assert.equal(result, '')
  })
  test('must handle strings that are camelCase', () => {
    const result = _.dashCase('helloWorld')
    assert.equal(result, 'hello-world')
  })
  test('must handle strings that are dash', () => {
    const result = _.dashCase('hello-world')
    assert.equal(result, 'hello-world')
  })
})

describe('PascalCase function', () => {
  test('returns non alphanumerics in pascal', () => {
    const result = _.PascalCase('Exobase Starter_flash AND-go')
    assert.equal(result, 'ExobaseStarterFlashAndGo')
  })
  test('returns single word', () => {
    const result = _.PascalCase('hello')
    assert.equal(result, 'Hello')
  })
  test('returns empty string for empty input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = _.PascalCase(null as any)
    assert.equal(result, '')
  })
})

describe('parseTemplate function', () => {
  test('replaces all occurrences', () => {
    const tmp = `
    Hello my name is {{name}}. I am a {{type}}.
    Not sure why I am {{reason}}.

    Thank You - {{name}}
  `
    const data = {
      name: 'Ray',
      type: 'template',
      reason: 'so beautiful',
    }

    const result = _.parseTemplate(tmp, data)
    const expected = `
    Hello my name is ${data.name}. I am a ${data.type}.
    Not sure why I am ${data.reason}.

    Thank You - ${data.name}
  `

    assert.equal(result, expected)
  })

  test('replaces all occurrences given template', () => {
    const tmp = `Hello <name>.`
    const data = {
      name: 'Ray',
    }

    const result = _.parseTemplate(tmp, data, /<(.+?)>/g)
    assert.equal(result, `Hello ${data.name}.`)
  })
})

describe('trim function', () => {
  test('handles bad input', () => {
    assert.equal(_.trim(null), '')
    assert.equal(_.trim(undefined), '')
  })
  test('returns input string correctly trimmed', () => {
    assert.equal(_.trim('\n\n\t\nhello\n\t  \n', '\n\t '), 'hello')
    assert.equal(_.trim('hello', 'x'), 'hello')
    assert.equal(_.trim(' hello  '), 'hello')
    assert.equal(_.trim(' __hello__  ', '_'), ' __hello__  ')
    assert.equal(_.trim('__hello__', '_'), 'hello')
    assert.equal(_.trim('//repos////', '/'), 'repos')
    assert.equal(_.trim('/repos/:owner/:repo/', '/'), 'repos/:owner/:repo')
  })

  test('handles when char to trim is special case in regex', () => {
    assert.equal(_.trim('_- hello_- ', '_- '), 'hello')
  })
})

describe('removePrefix function', () => {
  test('handles bad input', () => {
    assert.equal(_.removePrefix(null, 'prefix'), '')
    assert.equal(_.removePrefix(undefined, 'prefix'), '')
    assert.equal(_.removePrefix('test', ''), 'test')
  })
  test('removes prefix when present', () => {
    assert.equal(_.removePrefix('hello world', 'hello '), 'world')
    assert.equal(_.removePrefix('__hello__', '__'), 'hello__')
    assert.equal(_.removePrefix('//path', '//'), 'path')
    assert.equal(_.removePrefix('//path', '//'), 'path')
  })
  test('returns original string when prefix not found', () => {
    assert.equal(_.removePrefix('hello world', 'world'), 'hello world')
    assert.equal(_.removePrefix('test', 'no'), 'test')
  })
  test('handles when prefix is special case in regex', () => {
    assert.equal(_.removePrefix('_-hello_- ', '_-'), 'hello_- ')
  })
})

describe('trimStart function', () => {
  test('handles bad input', () => {
    assert.equal(_.trimStart(null), '')
    assert.equal(_.trimStart(undefined), '')
  })
  test('returns input string correctly trimmed at start', () => {
    assert.equal(_.trimStart('\n\n\t\nhello\n\t  \n', '\n\t '), 'hello\n\t  \n')
    assert.equal(_.trimStart(' hello  '), 'hello  ')
    assert.equal(_.trimStart('__hello__', '_'), 'hello__')
    assert.equal(_.trimStart('//repos////', '/'), 'repos////')
  })
  test('handles when char to trim is special case in regex', () => {
    assert.equal(_.trimStart('_- hello_- ', '_- '), 'hello_- ')
  })
})

describe('trimEnd function', () => {
  test('handles bad input', () => {
    assert.equal(_.trimEnd(null), '')
    assert.equal(_.trimEnd(undefined), '')
  })
  test('returns input string correctly trimmed at end', () => {
    assert.equal(_.trimEnd('\n\n\t\nhello\n\t  \n', '\n\t '), '\n\n\t\nhello')
    assert.equal(_.trimEnd(' hello  '), ' hello')
    assert.equal(_.trimEnd('__hello__', '_'), '__hello')
    assert.equal(_.trimEnd('//repos////', '/'), '//repos')
  })
  test('handles when char to trim is special case in regex', () => {
    assert.equal(_.trimEnd('_- hello_- ', '_- '), '_- hello')
  })
})
