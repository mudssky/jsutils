import {
  DomDebugger,
  FailReason,
  debugSelectors,
  diagnoseSelectors,
  formatDiagnostics,
  isValidSelector,
} from '@mudssky/jsutils'
import { beforeEach, describe, expect, test } from 'vitest'

/**
 * @vitest-environment happy-dom
 */

describe('isValidSelector', () => {
  test('合法选择器返回 true', () => {
    expect(isValidSelector('.class')).toBe(true)
    expect(isValidSelector('#id')).toBe(true)
    expect(isValidSelector('div > span')).toBe(true)
    expect(isValidSelector('[data-test="value"]')).toBe(true)
  })

  test('非法选择器返回 false', () => {
    expect(isValidSelector('[invalid')).toBe(false)
    expect(isValidSelector('!!!')).toBe(false)
  })

  test('空字符串非法', () => {
    expect(isValidSelector('')).toBe(false)
  })
})

describe('debugSelectors', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = `
      <div class="bar-top">Toolbar</div>
      <div class="art-table">Table</div>
      <div class="con-sql-result">Result</div>
      <div style="display:none" class="hidden-el">Hidden</div>
    `
    document.body.appendChild(container)
  })

  test('匹配已存在的选择器', () => {
    const results = debugSelectors({ toolbar: '.bar-top' }, { root: container })
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('toolbar')
    expect(results[0].matched).toBe(true)
    expect(results[0].count).toBe(1)
  })

  test('未匹配选择器返回 NOT_FOUND', () => {
    const results = debugSelectors(
      { missing: '.nonexistent' },
      { root: container },
    )
    expect(results[0].matched).toBe(false)
    expect(results[0].reason).toBe(FailReason.NOT_FOUND)
  })

  test('非法选择器返回 INVALID_SELECTOR', () => {
    const results = debugSelectors({ bad: '[invalid' }, { root: container })
    expect(results[0].matched).toBe(false)
    expect(results[0].reason).toBe(FailReason.INVALID_SELECTOR)
  })

  test('自定义断言函数匹配', () => {
    const results = debugSelectors(
      { custom: (root) => root.querySelector('.bar-top') },
      { root: container },
    )
    expect(results[0].matched).toBe(true)
    expect(results[0].count).toBe(1)
  })

  test('自定义断言函数未匹配', () => {
    const results = debugSelectors({ custom: () => null }, { root: container })
    expect(results[0].matched).toBe(false)
    expect(results[0].reason).toBe(FailReason.NOT_FOUND)
  })

  test('多选择器混合结果', () => {
    const results = debugSelectors(
      {
        toolbar: '.bar-top',
        missing: '.nonexistent',
        bad: '[invalid',
        custom: (root) => root.querySelector('.art-table'),
      },
      { root: container },
    )
    expect(results).toHaveLength(4)
    expect(results.filter((r) => r.matched)).toHaveLength(2)
    expect(results.find((r) => r.name === 'bad')?.reason).toBe(
      FailReason.INVALID_SELECTOR,
    )
  })
})

describe('diagnoseSelectors', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = `
      <div class="bar-top">Toolbar</div>
      <div class="art-table">Table</div>
    `
    document.body.appendChild(container)
  })

  test('已匹配选择器包含建议为空', () => {
    const diagnostics = diagnoseSelectors(
      { toolbar: '.bar-top' },
      { root: container },
    )
    expect(diagnostics[0].matched).toBe(true)
    expect(diagnostics[0].suggestion).toBe('')
  })

  test('未匹配选择器包含排障建议', () => {
    const diagnostics = diagnoseSelectors(
      { missing: '.nonexistent' },
      { root: container },
    )
    expect(diagnostics[0].suggestion).toContain('missing')
    expect(diagnostics[0].suggestion.length).toBeGreaterThan(0)
  })

  test('非法选择器建议包含语法检查提示', () => {
    const diagnostics = diagnoseSelectors(
      { bad: '[invalid' },
      { root: container },
    )
    expect(diagnostics[0].suggestion).toContain('语法非法')
  })

  test('未匹配字符串选择器包含诊断上下文', () => {
    const diagnostics = diagnoseSelectors(
      { missing: '.nonexistent' },
      { root: container },
    )
    const d = diagnostics[0]
    expect(d.context).toBeDefined()
    expect(d.context?.parentTag).toBeDefined()
  })

  test('非法选择器不包含诊断上下文', () => {
    const diagnostics = diagnoseSelectors(
      { bad: '[invalid' },
      { root: container },
    )
    expect(diagnostics[0].context).toBeUndefined()
  })
})

describe('formatDiagnostics', () => {
  test('格式化输出包含匹配摘要', () => {
    const container = document.createElement('div')
    container.innerHTML = '<div class="bar-top">Toolbar</div>'
    document.body.appendChild(container)

    const diagnostics = diagnoseSelectors(
      { toolbar: '.bar-top', missing: '.gone' },
      { root: container },
    )
    const text = formatDiagnostics(diagnostics)

    expect(text).toContain('1/2')
    expect(text).toContain('toolbar')
    expect(text).toContain('missing')
    expect(text).toContain('✓')
    expect(text).toContain('✗')

    document.body.removeChild(container)
  })
})

describe('DomDebugger', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = `
      <div class="bar-top">Toolbar</div>
      <div class="art-table">Table</div>
    `
    document.body.appendChild(container)
  })

  test('check() 返回检测结果', () => {
    const dbg = new DomDebugger(
      { toolbar: '.bar-top', missing: '.gone' },
      { root: container },
    )
    const results = dbg.check()

    expect(results).toHaveLength(2)
    expect(results.find((r) => r.name === 'toolbar')?.matched).toBe(true)
    expect(results.find((r) => r.name === 'missing')?.matched).toBe(false)
  })

  test('diagnose() 返回诊断报告', () => {
    const dbg = new DomDebugger({ toolbar: '.bar-top' }, { root: container })
    const diagnostics = dbg.diagnose()

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0].matched).toBe(true)
  })

  test('diagnoseText() 返回格式化文本', () => {
    const dbg = new DomDebugger({ toolbar: '.bar-top' }, { root: container })
    const text = dbg.diagnoseText()

    expect(typeof text).toBe('string')
    expect(text).toContain('toolbar')
  })

  test('addSelectors 添加新选择器', () => {
    const dbg = new DomDebugger({ toolbar: '.bar-top' }, { root: container })
    dbg.addSelectors({ table: '.art-table' })

    expect(dbg.getSelectorNames()).toEqual(['toolbar', 'table'])
  })

  test('removeSelectors 移除选择器', () => {
    const dbg = new DomDebugger(
      { toolbar: '.bar-top', table: '.art-table' },
      { root: container },
    )
    dbg.removeSelectors('toolbar')

    expect(dbg.getSelectorNames()).toEqual(['table'])
  })

  test('getLastResults 返回最后一次检测的结果', () => {
    const dbg = new DomDebugger({ toolbar: '.bar-top' }, { root: container })

    expect(dbg.getLastResults()).toHaveLength(0)
    dbg.check()
    expect(dbg.getLastResults()).toHaveLength(1)
  })

  test('waitFor 立即匹配到已存在的元素', async () => {
    const dbg = new DomDebugger({ toolbar: '.bar-top' }, { root: container })
    const result = await dbg.waitFor('toolbar', { timeout: 100 })

    expect(result.matched).toBe(true)
    expect(result.element).not.toBeNull()
    expect(result.elapsed).toBeLessThan(100)
  })

  test('waitFor 不存在的名称返回未匹配', async () => {
    const dbg = new DomDebugger({}, { root: container })
    const result = await dbg.waitFor('nonexistent', { timeout: 50 })

    expect(result.matched).toBe(false)
    expect(result.element).toBeNull()
  })

  test('waitFor 超时返回未匹配', async () => {
    const dbg = new DomDebugger({ missing: '.never-here' }, { root: container })
    const result = await dbg.waitFor('missing', { timeout: 200, interval: 50 })

    expect(result.matched).toBe(false)
    expect(result.elapsed).toBeGreaterThanOrEqual(150)
  })

  test('waitFor 在 DOM 变化后匹配成功', async () => {
    const dbg = new DomDebugger({ dynamic: '.dynamic-el' }, { root: container })

    // 延迟添加元素
    setTimeout(() => {
      const el = document.createElement('div')
      el.className = 'dynamic-el'
      container.appendChild(el)
    }, 100)

    const result = await dbg.waitFor('dynamic', { timeout: 2000 })

    expect(result.matched).toBe(true)
    expect(result.element).not.toBeNull()
  })
})
