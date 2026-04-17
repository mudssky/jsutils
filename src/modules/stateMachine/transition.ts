import type {
  MachineConfig,
  MachineSnapshot,
  MachineTransitionArgs,
  MachineTransitionResult,
} from './types'

/**
 * 计算一次事件触发后的状态机快照变化。
 *
 * @typeParam TState - 状态字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @typeParam TEvent - 事件联合类型
 * @param config - 状态机配置
 * @param snapshot - 当前快照
 * @param event - 触发转移的事件
 * @returns 返回本次转移的匹配状态与新快照
 * @public
 */
export function transition<
  TState extends string,
  TContext,
  TEvent extends { type: string },
>(
  config: MachineConfig<TState, TContext, TEvent>,
  snapshot: MachineSnapshot<TState, TContext>,
  event: TEvent,
): MachineTransitionResult<TState, TContext> {
  const stateConfig = config.states[snapshot.state]
  const transitionConfig = stateConfig?.on?.[event.type]

  if (!transitionConfig) {
    return {
      status: 'ignored',
      changed: false,
      stateChanged: false,
      snapshot,
    }
  }

  const args: MachineTransitionArgs<TState, TContext, TEvent> = {
    state: snapshot.state,
    context: snapshot.context,
    event,
  }

  if (transitionConfig.guard && !transitionConfig.guard(args as never)) {
    return {
      status: 'blocked',
      changed: false,
      stateChanged: false,
      snapshot,
    }
  }

  const nextContext = transitionConfig.reduce
    ? transitionConfig.reduce(args as never)
    : snapshot.context
  const nextState = transitionConfig.target

  return {
    status: 'matched',
    changed: nextState !== snapshot.state || nextContext !== snapshot.context,
    stateChanged: nextState !== snapshot.state,
    snapshot: {
      state: nextState,
      context: nextContext,
    },
  }
}
