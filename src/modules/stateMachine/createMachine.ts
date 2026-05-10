import { transition } from './transition'
import type {
  MachineConfig,
  MachineHookArgs,
  MachineInstance,
  MachineListener,
  MachineSnapshot,
} from './types'

/**
 * 根据配置创建一个带内部快照和订阅能力的状态机实例。
 *
 * @typeParam TValue - 状态值字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @typeParam TEvent - 事件联合类型
 * @param config - 状态机配置
 * @returns 返回可发送事件和读取快照的状态机实例
 * @public
 */
export function createMachine<
  TValue extends string,
  TContext,
  TEvent extends { type: string },
>(
  config: MachineConfig<TValue, TContext, TEvent>,
): MachineInstance<TValue, TContext, TEvent> {
  let snapshot: MachineSnapshot<TValue, TContext> = {
    value: config.initial,
    context: config.context,
  }
  const listeners = new Set<MachineListener<TValue, TContext>>()

  /**
   * 构建钩子执行时需要的参数对象，保证退出和进入钩子拿到的是对应阶段的快照。
   *
   * @param current - 当前需要传入钩子的快照
   * @param event - 触发本次变化的事件
   * @returns 返回钩子参数对象
   */
  const createHookArgs = (
    current: MachineSnapshot<TValue, TContext>,
    event: TEvent,
  ): MachineHookArgs<TValue, TContext, TEvent> => ({
    value: current.value,
    context: current.context,
    event,
  })

  /**
   * 用已提交的新快照通知订阅者，保证监听器观察到的是稳定状态。
   *
   * @returns 无返回值
   */
  const notify = (): void => {
    listeners.forEach((listener) => listener(snapshot))
  }

  return {
    getValue: () => snapshot.value,
    getContext: () => snapshot.context,
    getSnapshot: () => snapshot,
    send: (event) => {
      const currentSnapshot = snapshot
      const result = transition(config, snapshot, event)

      if (result.status !== 'matched') {
        return snapshot
      }

      if (result.stateChanged) {
        config.states[currentSnapshot.value]?.exit?.(
          createHookArgs(currentSnapshot, event),
        )
      }

      snapshot = result.snapshot

      if (result.stateChanged) {
        config.states[snapshot.value]?.entry?.(createHookArgs(snapshot, event))
      }

      notify()
      return snapshot
    },
    can: (event) => transition(config, snapshot, event).status === 'matched',
    matches: (value) => snapshot.value === value,
    subscribe: (listener) => {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }
}
