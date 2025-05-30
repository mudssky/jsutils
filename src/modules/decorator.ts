import type { AnyFunction } from '../types'
import { debounce } from './function'

/**
 * 创建一个防抖的类方法装饰器。
 *
 * @param wait - 等待时间（毫秒），默认为 200。
 * @param options - 可选参数。
 * @param options.leading - 是否在等待开始前调用函数，默认为 false。
 * @param options.trailing - 是否在等待结束后调用函数，默认为 true。
 * @returns 返回一个方法装饰器。
 *
 * @example
 * ```typescript
 * class MyClass {
 *   @debounceMethod(300, { leading: true })
 *   logMessage(message: string) {
 *     console.log(message);
 *   }
 * }
 *
 * const instance = new MyClass();
 * instance.logMessage("Hello"); // 会立即执行
 * instance.logMessage("World"); // 会在300ms后执行，如果期间没有新的调用
 * ```
 */
export function debounceMethod(
  wait = 200,
  options: {
    leading?: boolean
    trailing?: boolean
  } = {
    leading: false,
    trailing: true,
  },
) {
  return function (
    originalMethod: AnyFunction,
    context: ClassMethodDecoratorContext,
  ) {
    if (context.kind !== 'method') {
      throw new TypeError('Only methods can be decorated with @debounceMethod.')
    }

    if (typeof originalMethod !== 'function') {
      // This check might be redundant if TypeScript enforces originalMethod to be a function type
      // based on ClassMethodDecoratorContext, but it's good for robustness.
      throw new TypeError('The decorated member must be a method.')
    }

    const debouncedFn = debounce(originalMethod, wait, options)

    return function (this: unknown, ...args: unknown[]) {
      return debouncedFn.apply(this, args)
    } as AnyFunction
  }
}
