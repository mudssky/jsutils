import { $, DOMHelper } from '@mudssky/jsutils'
import { beforeEach, describe, expect, test } from 'vitest'

/**
 * @vitest-environment happy-dom
 */
describe('DOMHelper', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = `
      <div id="test" class="box" data-id="123">Test Content</div>
      <input id="input" value="initial">
      <div class="parent">
        <div class="child">Child 1</div>
        <div class="child">Child 2</div>
      </div>
    `
    document.body.appendChild(container)
  })

  test('constructor with selector string', () => {
    const helper = new DOMHelper('#test')
    expect(helper.exists()).toBe(true)
  })

  test('constructor with HTMLElement', () => {
    const el = document.getElementById('test')!
    const helper = new DOMHelper(el)
    expect(helper.exists()).toBe(true)
  })

  test('get() returns element', () => {
    const helper = new DOMHelper('#test')
    expect(helper.get()).toBeInstanceOf(HTMLElement)
  })

  test('text() gets text content', () => {
    const helper = new DOMHelper('#test')
    expect(helper.text()).toBe('Test Content')
    expect(helper.text('default')).toBe('Test Content')
  })

  test('attr() gets attribute', () => {
    const helper = new DOMHelper('#test')
    expect(helper.attr('data-id')).toBe('123')
    expect(helper.attr('nonexistent', 'default')).toBe('default')
  })

  test('val() gets input value', () => {
    const helper = new DOMHelper('#input')
    expect(helper.val('default')).toBe('initial')
    expect(helper.val<string>('default')).toBe('initial')
    expect(helper.val<number>(0)).toBe(0) // 测试数字类型
  })

  test('setText() updates text content', () => {
    const helper = new DOMHelper('#test')
    helper.setText('New Content')
    expect(helper.text()).toBe('New Content')
  })

  test('setAttr() updates attribute', () => {
    const helper = new DOMHelper('#test')
    helper.setAttr('data-id', '456')
    expect(helper.attr('data-id')).toBe('456')
  })

  test('class operations', () => {
    const helper = new DOMHelper('#test')
    helper.addClass('active')
    expect(helper.get()?.classList.contains('active')).toBe(true)

    helper.removeClass('box')
    expect(helper.get()?.classList.contains('box')).toBe(false)

    helper.toggleClass('toggle')
    expect(helper.get()?.classList.contains('toggle')).toBe(true)
  })

  test('event handling', () => {
    const helper = new DOMHelper('#test')
    let clicked = false
    const handler = () => (clicked = true)

    helper.on('click', handler)
    helper.get()?.click()
    expect(clicked).toBe(true)

    clicked = false
    helper.off('click')
    helper.get()?.click()
    expect(clicked).toBe(false)
  })

  test('parent() returns parent helper', () => {
    const helper = new DOMHelper('.child')
    expect(helper.parent()?.get()?.classList.contains('parent')).toBe(true)
  })

  test('children() returns child helpers', () => {
    const helper = new DOMHelper('.parent')
    expect(helper.children().length).toBe(2)
    expect(helper.children('.child').length).toBe(2)
  })

  test('$ static method', () => {
    const helper = $('#test')
    helper.setText('Test Content')
    expect(helper.text()).toBe('Test Content')
  })

  test('setStyle() with single property', () => {
    const helper = $('#test')
    helper.setStyle('color', 'red')
    expect(helper.get()?.style.color).toBe('red')
  })

  test('setStyle() with camelCase property', () => {
    const helper = $('#test')
    helper.setStyle('backgroundColor', 'blue')
    expect(helper.get()?.style.backgroundColor).toBe('blue')
  })

  test('setStyle() with style object', () => {
    const helper = $('#test')
    helper.setStyle({
      color: 'green',
      fontSize: '16px',
      marginTop: '10px',
    })
    const style = helper.get()!.style
    expect(style.color).toBe('green')
    expect(style.fontSize).toBe('16px')
    expect(style.marginTop).toBe('10px')
  })

  test('createElement() basic element', () => {
    const div = DOMHelper.createElement('div')
    expect(div.get()).toBeInstanceOf(HTMLDivElement)
  })

  test('createElement() with attributes', () => {
    const div = DOMHelper.createElement('div', { id: 'test', class: 'box' })
    expect(div.attr('id')).toBe('test')
    expect(div.attr('class')).toBe('box')
  })

  test('createElement() with children', () => {
    const child1 = DOMHelper.createElement('span')
    const child2 = document.createElement('span')
    const parent = DOMHelper.createElement('div', {}, [child1, child2])
    expect(parent.children().length).toBe(2)
  })

  test('appendChild() adds child element', () => {
    const parent = new DOMHelper('.parent')
    const newChild = document.createElement('div')
    newChild.className = 'new-child'

    expect(parent.children().length).toBe(2)
    parent.appendChild(newChild)
    expect(parent.children().length).toBe(3)
    expect(parent.children()[2].get()?.className).toBe('new-child')
  })

  test('removeChild() removes child element', () => {
    const parent = new DOMHelper('.parent')
    const child = new DOMHelper('.child')

    expect(parent.children().length).toBe(3)
    parent.removeChild(child)
    expect(parent.children().length).toBe(2)
  })

  test('chainable appendChild and removeChild', () => {
    const parent = new DOMHelper('.parent')
    const newChild = document.createElement('div')

    parent.appendChild(newChild).removeChild(newChild)

    expect(parent.children().length).toBe(2)
  })

  test('prependChild() adds child at first position', () => {
    const parent = new DOMHelper('.parent')
    const newChild = document.createElement('div')
    newChild.className = 'new-child'

    expect(parent.children().length).toBe(2)
    parent.prependChild(newChild)
    expect(parent.children().length).toBe(3)
    expect(parent.children()[0].get()?.className).toBe('new-child')
  })

  test('chainable prependChild', () => {
    const parent = new DOMHelper('.parent')
    const newChild = document.createElement('div')

    parent.prependChild(newChild).removeChild(newChild)
    expect(parent.children().length).toBe(3)
  })

  test('hide() and show() methods', () => {
    const helper = new DOMHelper('#test')

    // 初始状态检查
    expect(helper.get()?.style.display).toBe('')

    // 隐藏元素
    helper.hide()
    expect(helper.get()?.style.display).toBe('none')

    // 显示元素
    helper.show()
    expect(helper.get()?.style.display).toBe('')
  })
})
