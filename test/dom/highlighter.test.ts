import {
  Highlighter,
  type HighlightCallbacks,
  type HighlighterConfig,
} from '@mudssky/jsutils'
import { beforeEach, describe, expect, test, vi } from 'vitest'
/**
 * @vitest-environment happy-dom
 */
describe('Highlighter', () => {
  let container: HTMLElement
  let highlighter: Highlighter

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = `
      <div class="content">
        <p>This is a JavaScript tutorial about JavaScript programming.</p>
        <p>Learn JavaScript basics and advanced JavaScript concepts.</p>
        <div class="nested">
          <span>JavaScript is powerful</span>
          <script>console.log('script content')</script>
          <style>.test { color: red; }</style>
        </div>
      </div>
    `
    document.body.appendChild(container)
    highlighter = new Highlighter(container)
  })

  test('constructor with default parameters', () => {
    const defaultHighlighter = new Highlighter(container)
    expect(defaultHighlighter).toBeInstanceOf(Highlighter)
    expect(defaultHighlighter.getMatchCount()).toBe(0)
    expect(defaultHighlighter.getCurrentIndex()).toBe(-1)
  })

  test('constructor with custom config', () => {
    const config: HighlighterConfig = {
      highlightTag: 'span',
      highlightClass: 'custom-highlight',
      activeClass: 'custom-active',
      skipTags: ['SCRIPT', 'STYLE', 'CODE'],
      scrollOptions: { behavior: 'auto', block: 'nearest' },
      enablePerformanceOptimization: false,
    }
    const customHighlighter = new Highlighter(container, config)
    expect(customHighlighter).toBeInstanceOf(Highlighter)
  })

  test('constructor with callbacks', () => {
    const callbacks: HighlightCallbacks = {
      onHighlightApplied: vi.fn(),
      onHighlightRemoved: vi.fn(),
      onNavigate: vi.fn(),
    }
    const callbackHighlighter = new Highlighter(container, {}, callbacks)
    expect(callbackHighlighter).toBeInstanceOf(Highlighter)
  })

  test('constructor throws error for invalid targetNode', () => {
    expect(() => new Highlighter(null as unknown as HTMLElement)).toThrow(
      'targetNode must be a valid HTMLElement',
    )
    expect(
      () =>
        new Highlighter(
          document.createTextNode('text') as unknown as HTMLElement,
        ),
    ).toThrow('targetNode must be a valid HTMLElement')
  })

  test('apply() highlights basic keyword', async () => {
    const count = await highlighter.apply('JavaScript')
    const highlights = container.querySelectorAll('.highlight')
    expect(highlights.length).toBeGreaterThan(0)
    expect(count).toBeGreaterThan(0)
    expect(highlighter.getMatchCount()).toBeGreaterThan(0)
    expect(highlighter.getCurrentIndex()).toBe(0)
  })

  test('applySync() highlights basic keyword', () => {
    const count = highlighter.applySync('JavaScript')
    const highlights = container.querySelectorAll('.highlight')
    expect(highlights.length).toBeGreaterThan(0)
    expect(count).toBeGreaterThan(0)
    expect(highlighter.getMatchCount()).toBeGreaterThan(0)
    expect(highlighter.getCurrentIndex()).toBe(0)
  })

  test('apply() with case sensitive option', async () => {
    const count = await highlighter.apply('javascript', { caseSensitive: true })
    const highlights = container.querySelectorAll('.highlight')
    expect(highlights.length).toBe(0) // 应该没有匹配，因为原文是 'JavaScript'
    expect(count).toBe(0)
    expect(highlighter.getMatchCount()).toBe(0)
  })

  test('applySync() with case sensitive option', () => {
    const count = highlighter.applySync('javascript', { caseSensitive: true })
    const highlights = container.querySelectorAll('.highlight')
    expect(highlights.length).toBe(0) // 应该没有匹配，因为原文是 'JavaScript'
    expect(count).toBe(0)
    expect(highlighter.getMatchCount()).toBe(0)
  })

  test('apply() with case insensitive option (default)', async () => {
    const count = await highlighter.apply('javascript')
    const highlights = container.querySelectorAll('.highlight')
    expect(highlights.length).toBeGreaterThan(0)
    expect(count).toBeGreaterThan(0)
    expect(highlighter.getMatchCount()).toBeGreaterThan(0)
  })

  test('applySync() with case insensitive option (default)', () => {
    const count = highlighter.applySync('javascript')
    const highlights = container.querySelectorAll('.highlight')
    expect(highlights.length).toBeGreaterThan(0)
    expect(count).toBeGreaterThan(0)
    expect(highlighter.getMatchCount()).toBeGreaterThan(0)
  })

  test('apply() with whole word option', async () => {
    const count1 = await highlighter.apply('Script', { wholeWord: true })
    const highlights = container.querySelectorAll('.highlight')
    expect(highlights.length).toBe(0) // 'Script' 不是完整单词
    expect(count1).toBe(0)

    const count2 = await highlighter.apply('JavaScript', { wholeWord: true })
    const highlightsWhole = container.querySelectorAll('.highlight')
    expect(highlightsWhole.length).toBeGreaterThan(0)
    expect(count2).toBeGreaterThan(0)
  })

  test('applySync() with whole word option', () => {
    const count1 = highlighter.applySync('Script', { wholeWord: true })
    const highlights = container.querySelectorAll('.highlight')
    expect(highlights.length).toBe(0) // 'Script' 不是完整单词
    expect(count1).toBe(0)

    const count2 = highlighter.applySync('JavaScript', { wholeWord: true })
    const highlightsWhole = container.querySelectorAll('.highlight')
    expect(highlightsWhole.length).toBeGreaterThan(0)
    expect(count2).toBeGreaterThan(0)
  })

  test('apply() ignores empty or whitespace-only keywords', async () => {
    const count1 = await highlighter.apply('')
    expect(count1).toBe(0)
    expect(highlighter.getMatchCount()).toBe(0)

    const count2 = await highlighter.apply('   ')
    expect(count2).toBe(0)
    expect(highlighter.getMatchCount()).toBe(0)
  })

  test('applySync() ignores empty or whitespace-only keywords', () => {
    const count1 = highlighter.applySync('')
    expect(count1).toBe(0)
    expect(highlighter.getMatchCount()).toBe(0)

    const count2 = highlighter.applySync('   ')
    expect(count2).toBe(0)
    expect(highlighter.getMatchCount()).toBe(0)
  })

  test('apply() escapes regex special characters', async () => {
    container.innerHTML = '<p>Price: $100.50 and [special] characters</p>'
    const count = await highlighter.apply('$100.50')
    const highlights = container.querySelectorAll('.highlight')
    expect(highlights.length).toBe(1)
    expect(count).toBe(1)
    expect(highlights[0].textContent).toBe('$100.50')
  })

  test('applySync() escapes regex special characters', () => {
    container.innerHTML = '<p>Price: $100.50 and [special] characters</p>'
    const count = highlighter.applySync('$100.50')
    const highlights = container.querySelectorAll('.highlight')
    expect(highlights.length).toBe(1)
    expect(count).toBe(1)
    expect(highlights[0].textContent).toBe('$100.50')
  })

  test('apply() skips SCRIPT and STYLE tags', async () => {
    const count1 = await highlighter.apply('console')
    const highlights = container.querySelectorAll('.highlight')
    expect(highlights.length).toBe(0) // script 标签内容应该被跳过
    expect(count1).toBe(0)

    const count2 = await highlighter.apply('color')
    const styleHighlights = container.querySelectorAll('.highlight')
    expect(styleHighlights.length).toBe(0) // style 标签内容应该被跳过
    expect(count2).toBe(0)
  })

  test('applySync() skips SCRIPT and STYLE tags', () => {
    const count1 = highlighter.applySync('console')
    const highlights = container.querySelectorAll('.highlight')
    expect(highlights.length).toBe(0) // script 标签内容应该被跳过
    expect(count1).toBe(0)

    const count2 = highlighter.applySync('color')
    const styleHighlights = container.querySelectorAll('.highlight')
    expect(styleHighlights.length).toBe(0) // style 标签内容应该被跳过
    expect(count2).toBe(0)
  })

  test('apply() does not create nested highlights', async () => {
    await highlighter.apply('JavaScript')
    const firstCount = highlighter.getMatchCount()

    // 再次应用相同关键词，应该先清理旧的高亮
    const secondCount = await highlighter.apply('JavaScript')
    const finalCount = highlighter.getMatchCount()

    expect(finalCount).toBe(firstCount)
    expect(secondCount).toBe(firstCount)
  })

  test('applySync() does not create nested highlights', () => {
    highlighter.applySync('JavaScript')
    const firstCount = highlighter.getMatchCount()

    // 再次应用相同关键词，应该先清理旧的高亮
    const secondCount = highlighter.applySync('JavaScript')
    const finalCount = highlighter.getMatchCount()

    expect(finalCount).toBe(firstCount)
    expect(secondCount).toBe(firstCount)
  })

  test('remove() clears all highlights', async () => {
    await highlighter.apply('JavaScript')
    expect(highlighter.getMatchCount()).toBeGreaterThan(0)

    highlighter.remove()
    expect(highlighter.getMatchCount()).toBe(0)
    expect(highlighter.getCurrentIndex()).toBe(-1)
    expect(container.querySelectorAll('.highlight').length).toBe(0)
  })

  test('next() navigates to next highlight', async () => {
    await highlighter.apply('JavaScript')
    const initialIndex = highlighter.getCurrentIndex()

    const success = highlighter.next()
    expect(success).toBe(true)
    expect(highlighter.getCurrentIndex()).toBe(
      (initialIndex + 1) % highlighter.getMatchCount(),
    )
  })

  test('next() cycles to first when at last', async () => {
    await highlighter.apply('JavaScript')
    const matchCount = highlighter.getMatchCount()

    // 跳转到最后一个
    for (let i = 0; i < matchCount - 1; i++) {
      highlighter.next()
    }
    expect(highlighter.getCurrentIndex()).toBe(matchCount - 1)

    // 再次next应该回到第一个
    const success = highlighter.next()
    expect(success).toBe(true)
    expect(highlighter.getCurrentIndex()).toBe(0)
  })

  test('previous() navigates to previous highlight', async () => {
    await highlighter.apply('JavaScript')
    highlighter.next() // 先移动到下一个
    const currentIndex = highlighter.getCurrentIndex()

    const success = highlighter.previous()
    expect(success).toBe(true)
    expect(highlighter.getCurrentIndex()).toBe(currentIndex - 1)
  })

  test('previous() cycles to last when at first', async () => {
    await highlighter.apply('JavaScript')
    const matchCount = highlighter.getMatchCount()
    expect(highlighter.getCurrentIndex()).toBe(0)

    const success = highlighter.previous()
    expect(success).toBe(true)
    expect(highlighter.getCurrentIndex()).toBe(matchCount - 1)
  })

  test('next() and previous() do nothing when no highlights', () => {
    expect(highlighter.getMatchCount()).toBe(0)

    const nextSuccess = highlighter.next()
    expect(nextSuccess).toBe(false)
    expect(highlighter.getCurrentIndex()).toBe(-1)

    const prevSuccess = highlighter.previous()
    expect(prevSuccess).toBe(false)
    expect(highlighter.getCurrentIndex()).toBe(-1)
  })

  test('getMatchCount() returns correct count', async () => {
    expect(highlighter.getMatchCount()).toBe(0)

    const count = await highlighter.apply('JavaScript')
    expect(highlighter.getMatchCount()).toBeGreaterThan(0)
    expect(count).toBe(highlighter.getMatchCount())

    const actualHighlights = container.querySelectorAll('.highlight').length
    expect(count).toBe(actualHighlights)
  })

  test('getCurrentIndex() returns correct index', async () => {
    expect(highlighter.getCurrentIndex()).toBe(-1)

    await highlighter.apply('JavaScript')
    expect(highlighter.getCurrentIndex()).toBe(0)

    highlighter.next()
    expect(highlighter.getCurrentIndex()).toBe(1)
  })

  test('active class is applied correctly', async () => {
    await highlighter.apply('JavaScript')

    const highlights = container.querySelectorAll('.highlight')
    const activeHighlights = container.querySelectorAll('.highlight-active')

    expect(highlights.length).toBeGreaterThan(0)
    expect(activeHighlights.length).toBe(1)
    expect(highlights[0]).toBe(activeHighlights[0])
  })

  test('active class moves with navigation', async () => {
    await highlighter.apply('JavaScript')

    const highlights = container.querySelectorAll('.highlight')
    if (highlights.length > 1) {
      expect(highlights[0].classList.contains('highlight-active')).toBe(true)
      expect(highlights[1].classList.contains('highlight-active')).toBe(false)

      highlighter.next()
      expect(highlights[0].classList.contains('highlight-active')).toBe(false)
      expect(highlights[1].classList.contains('highlight-active')).toBe(true)
    }
  })

  test('custom highlight tag and classes work', async () => {
    const customHighlighter = new Highlighter(container, {
      highlightTag: 'span',
      highlightClass: 'custom-highlight',
      activeClass: 'custom-active',
    })

    await customHighlighter.apply('JavaScript')

    const highlights = container.querySelectorAll('span.custom-highlight')
    const activeHighlights = container.querySelectorAll('.custom-active')

    expect(highlights.length).toBeGreaterThan(0)
    expect(activeHighlights.length).toBe(1)
  })

  test('text content is preserved after highlighting', async () => {
    const originalText = container.textContent

    await highlighter.apply('JavaScript')

    // 移除高亮后文本应该保持不变
    highlighter.remove()
    expect(container.textContent).toBe(originalText)
  })

  test('complex regex patterns are handled correctly', async () => {
    container.innerHTML =
      '<p>Test [brackets] and (parentheses) and {braces}</p>'

    await highlighter.apply('[brackets]')
    let highlights = container.querySelectorAll('.highlight')
    expect(highlights.length).toBe(1)
    expect(highlights[0].textContent).toBe('[brackets]')

    await highlighter.apply('(parentheses)')
    highlights = container.querySelectorAll('.highlight')
    expect(highlights.length).toBe(1)
    expect(highlights[0].textContent).toBe('(parentheses)')
  })

  test('multiple apply() calls clean up previous highlights', async () => {
    await highlighter.apply('JavaScript')
    container.querySelectorAll('.highlight').length

    await highlighter.apply('tutorial')
    const secondCount = container.querySelectorAll('.highlight').length

    // 应该只有新的高亮，旧的应该被清理
    expect(container.querySelectorAll('.highlight')[0].textContent).toBe(
      'tutorial',
    )
    expect(secondCount).toBeGreaterThan(0)
  })

  test('multiple applySync() calls clean up previous highlights', () => {
    highlighter.applySync('JavaScript')
    container.querySelectorAll('.highlight').length

    highlighter.applySync('tutorial')
    const secondCount = container.querySelectorAll('.highlight').length

    // 应该只有新的高亮，旧的应该被清理
    expect(container.querySelectorAll('.highlight')[0].textContent).toBe(
      'tutorial',
    )
    expect(secondCount).toBeGreaterThan(0)
  })

  test('async and sync methods can be used interchangeably', async () => {
    // 先使用异步方法
    const asyncCount = await highlighter.apply('JavaScript')
    expect(asyncCount).toBeGreaterThan(0)
    expect(highlighter.getMatchCount()).toBe(asyncCount)

    // 然后使用同步方法，应该清理之前的高亮
    const syncCount = highlighter.applySync('tutorial')
    expect(syncCount).toBeGreaterThan(0)
    expect(highlighter.getMatchCount()).toBe(syncCount)
    expect(container.querySelectorAll('.highlight')[0].textContent).toBe(
      'tutorial',
    )

    // 再次使用异步方法
    const asyncCount2 = await highlighter.apply('programming')
    expect(asyncCount2).toBeGreaterThan(0)
    expect(highlighter.getMatchCount()).toBe(asyncCount2)
    expect(container.querySelectorAll('.highlight')[0].textContent).toBe(
      'programming',
    )
  })

  test('applySync() with performance optimization disabled works correctly', () => {
    const customHighlighter = new Highlighter(container, {
      enablePerformanceOptimization: false,
    })

    const count = customHighlighter.applySync('JavaScript')
    expect(count).toBeGreaterThan(0)
    expect(customHighlighter.getMatchCount()).toBe(count)

    const highlights = container.querySelectorAll('.highlight')
    expect(highlights.length).toBe(count)
  })

  test('applySync() returns same results as apply() for same input', async () => {
    // 测试同步和异步方法的结果一致性
    const asyncCount = await highlighter.apply('JavaScript')
    const asyncHighlights = Array.from(
      container.querySelectorAll('.highlight'),
    ).map((el) => el.textContent)

    highlighter.remove()

    const syncCount = highlighter.applySync('JavaScript')
    const syncHighlights = Array.from(
      container.querySelectorAll('.highlight'),
    ).map((el) => el.textContent)

    expect(syncCount).toBe(asyncCount)
    expect(syncHighlights).toEqual(asyncHighlights)
  })

  test('destroy() cleans up all internal state and DOM', async () => {
    // 设置一些高亮和回调
    const callbacks: HighlightCallbacks = {
      onHighlightApplied: vi.fn(),
      onHighlightRemoved: vi.fn(),
      onNavigate: vi.fn(),
    }
    highlighter.updateCallbacks(callbacks)

    // 应用高亮
    await highlighter.apply('JavaScript')
    expect(highlighter.getMatchCount()).toBeGreaterThan(0)
    expect(highlighter.getCurrentIndex()).toBe(0)
    expect(highlighter.getCurrentKeyword()).toBe('JavaScript')
    expect(container.querySelectorAll('.highlight').length).toBeGreaterThan(0)

    // 记录destroy前的回调调用次数
    const callCountBeforeDestroy = (
      callbacks.onHighlightApplied as ReturnType<typeof vi.fn>
    ).mock.calls.length

    // 调用destroy
    highlighter.destroy()

    // 验证DOM被清理
    expect(container.querySelectorAll('.highlight').length).toBe(0)

    // 验证内部状态被重置
    expect(highlighter.getMatchCount()).toBe(0)
    expect(highlighter.getCurrentIndex()).toBe(-1)
    expect(highlighter.getCurrentKeyword()).toBe('')
    expect(highlighter.getCurrentElement()).toBeNull()
    expect(highlighter.getAllHighlights()).toEqual([])

    // 验证回调被清理（通过检查后续操作不会触发原来的回调）
    await highlighter.apply('test')
    const callCountAfterDestroy = (
      callbacks.onHighlightApplied as ReturnType<typeof vi.fn>
    ).mock.calls.length
    expect(callCountAfterDestroy).toBe(callCountBeforeDestroy) // 调用次数不应该增加
  })

  test('destroy() can be called multiple times safely', async () => {
    await highlighter.apply('JavaScript')
    expect(highlighter.getMatchCount()).toBeGreaterThan(0)

    // 第一次调用destroy
    highlighter.destroy()
    expect(highlighter.getMatchCount()).toBe(0)

    // 第二次调用destroy应该不会出错
    expect(() => highlighter.destroy()).not.toThrow()
    expect(highlighter.getMatchCount()).toBe(0)
  })

  test('destroy() prevents memory leaks by clearing callbacks', async () => {
    const callbacks: HighlightCallbacks = {
      onHighlightApplied: vi.fn(),
      onHighlightRemoved: vi.fn(),
      onNavigate: vi.fn(),
    }
    highlighter.updateCallbacks(callbacks)

    await highlighter.apply('JavaScript')
    expect(callbacks.onHighlightApplied).toHaveBeenCalledTimes(1)

    highlighter.destroy()

    // 销毁后，新的操作不应该触发旧的回调
    await highlighter.apply('test')
    expect(callbacks.onHighlightApplied).toHaveBeenCalledTimes(1) // 仍然是1次，没有增加
  })
})
