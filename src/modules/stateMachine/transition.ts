import type {
  MachineConfig,
  MachineSnapshot,
  MachineTransitionArgs,
  MachineTransitionResult,
  MachineTransitions,
} from './types'

/**
 * 计算一次事件触发后的状态机快照变化。
 *
 * @typeParam TValue - 状态值字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @typeParam TEvent - 事件联合类型
 * @param config - 状态机配置
 * @param snapshot - 当前快照
 * @param event - 触发转移的事件
 * @returns 返回本次转移的匹配状态与新快照
 * @public
 */
export function transition<
  TValue extends string,
  TContext,
  TEvent extends { type: string },
>(
  config: MachineConfig<TValue, TContext, TEvent>,
  snapshot: MachineSnapshot<TValue, TContext>,
  event: TEvent,
): MachineTransitionResult<TValue, TContext> {
  const stateConfig = config.states[snapshot.value]
  const transitionConfig =
    stateConfig?.on?.[
      event.type as keyof MachineTransitions<TValue, TContext, TEvent>
    ]

  if (!transitionConfig) {
    return {
      status: 'ignored',
      changed: false,
      stateChanged: false,
      snapshot,
    }
  }

  const args: MachineTransitionArgs<TValue, TContext, TEvent> = {
    value: snapshot.value,
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

  const assignedContext = transitionConfig.assign
    ? transitionConfig.assign(args as never)
    : ({} as Partial<TContext>)
  const nextContext = transitionConfig.assign
    ? ({
        ...snapshot.context,
        ...assignedContext,
      } as TContext)
    : snapshot.context
  const nextValue = transitionConfig.target

  return {
    status: 'matched',
    changed: nextValue !== snapshot.value || nextContext !== snapshot.context,
    stateChanged: nextValue !== snapshot.value,
    snapshot: {
      value: nextValue,
      context: nextContext,
    },
  }
}
