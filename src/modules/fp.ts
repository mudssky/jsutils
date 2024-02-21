/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArgumentError } from '..'

type AnyFunction = (...args: any[]) => any

/**
 * pipe方法，用于串联函数的，实现流水线管道，需要传入的函数入参和出参都是一个(一元函数)。
 * 执行从左到右的函数组合。第一个参数可以有任意数量；其余参数必须是一元的。
 * @param functions
 * @returns
 */
function pipe<OUT = any>(...functions: AnyFunction[]) {
  if (functions.length === 0) {
    throw new ArgumentError('pipe requires at least one argument')
  }
  return functions.reduce(
    (f, g) =>
      (...args: any[]) =>
        g(f(...args)),
  ) as (...args: any) => OUT
}

/**
 * 组合函数
 * 和pipe类似，但是先执行的函数放在最后，更接近数学的函数。
 * 最后一个参数可以有任意数量,其余参数必须是一元的。
 * @param functions
 * @returns
 */
function compose<OUT = any>(...functions: AnyFunction[]) {
  if (functions.length === 0) {
    throw new ArgumentError('pipe requires at least one argument')
  }
  return functions.reduceRight(
    (f, g) =>
      (...args: any[]) =>
        g(f(...args)),
  ) as (...args: any) => OUT
}

/**
 * 通用柯里化，将任意参数的函数，转化为嵌套调用
 * @param func
 * @param arity
 * @returns
 */
// TODO 暂时能力不足，curry的ts类型留到以后补上。
function curry(func: (...args: any) => any, arity = func.length) {
  // 定义一个递归式 generateCurried
  function generateCurried(...prevArgs: any[]) {
    // generateCurried 函数必定返回一层嵌套
    return function curried(...nextArg: any[]) {
      // 统计目前“已记忆”+“未记忆”的参数
      const args = [...prevArgs, ...nextArg]
      // 若 “已记忆”+“未记忆”的参数数量 >= 回调函数元数，则认为已经记忆了所有的参数
      if (args.length >= arity) {
        // 触碰递归边界，传入所有参数，调用回调函数
        return func(...args)
      } else {
        // 未触碰递归边界，则递归调用 generateCurried 自身，创造新一层的嵌套
        return generateCurried(...args)
      }
    }
  }
  // 调用 generateCurried，起始传参为空，表示“目前还没有记住任何参数”
  return generateCurried()
}

function identity<T>(x: T) {
  return x
}

abstract class AbstractFunctor<T = any> {
  abstract map<R = any>(f: (val: T) => R): AbstractFunctor<R>
  // abstract valueOf(): T
}

abstract class AbstractMonad<T = any> extends AbstractFunctor<T> {
  abstract flatMap<R = any>(f: (arg: T) => R): AbstractMonad<R>
}
/**
 *
 *Monad是带有flatMap方法的Functor
 * @class Monad
 * @template T
 */
class Monad<T = any> extends AbstractMonad<T> {
  private val: T
  constructor(x: T) {
    super()
    this.val = x
  }

  static of<U = any>(val: U) {
    return new Monad<U>(val)
  }

  map(f: (arg: T) => any) {
    return Monad.of(f(this.val))
  }
  /**
   * Monda使用flatMap函数可以解决Functor嵌套的问题
   * @param f
   * @returns
   */
  flatMap(f: (arg0: T) => any) {
    return this.map(f).valueOf()
  }

  valueOf() {
    return this.val
  }
  /**
   * 展示内部数据
   * @returns
   */
  inspect() {
    return `Monad {${this.val}}`
  }
}

// class MayBe<T = any> extends AbstractFunctor<T> {
//   private val: T
//   constructor(x: T) {
//     super()
//     this.val = x
//   }
//   map<R = any>(f: (val: T) => R): AbstractFunctor<R> {
//    return f(this.val)
//   }
//   valueOf(): T {
//     throw new Error('Method not implemented.')
//   }
// }

export { Monad, compose, curry, identity, pipe }
