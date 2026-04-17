/**
 * 状态机快照，保存当前状态值和值得持久化的上下文。
 *
 * @typeParam TValue - 状态值字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @public
 */
export interface MachineSnapshot<TValue extends string, TContext> {
  value: TValue
  context: TContext
}

/**
 * 从事件联合类型中提取指定 `type` 对应的事件对象。
 *
 * @typeParam TEvent - 事件联合类型
 * @typeParam TType - 事件类型字面量
 * @public
 */
export type ExtractMachineEvent<
  TEvent extends { type: string },
  TType extends TEvent['type'],
> = TEvent extends { type: TType } ? TEvent : never

/**
 * guard 和 assign 共用的转移上下文参数。
 *
 * @typeParam TValue - 状态值字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @typeParam TEvent - 当前参与转移的事件类型
 * @public
 */
export interface MachineTransitionArgs<
  TValue extends string,
  TContext,
  TEvent extends { type: string },
> extends MachineSnapshot<TValue, TContext> {
  event: TEvent
}

/**
 * 进入或离开状态钩子拿到的参数。
 *
 * @typeParam TValue - 状态值字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @typeParam TEvent - 触发本次变化的事件类型
 * @public
 */
export interface MachineHookArgs<
  TValue extends string,
  TContext,
  TEvent extends { type: string },
> extends MachineSnapshot<TValue, TContext> {
  event: TEvent
}

/**
 * 单条事件转移配置。
 *
 * @typeParam TValue - 状态值字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @typeParam TEvent - 事件联合类型
 * @typeParam TType - 当前配置对应的事件类型字面量
 * @public
 */
export interface MachineTransitionConfig<
  TValue extends string,
  TContext,
  TEvent extends { type: string },
  TType extends TEvent['type'] = TEvent['type'],
> {
  target: TValue
  guard?: (
    args: MachineTransitionArgs<
      TValue,
      TContext,
      ExtractMachineEvent<TEvent, TType>
    >,
  ) => boolean
  assign?: (
    args: MachineTransitionArgs<
      TValue,
      TContext,
      ExtractMachineEvent<TEvent, TType>
    >,
  ) => Partial<TContext> | TContext
}

/**
 * 单个状态值下允许触发的事件转移映射。
 *
 * @typeParam TValue - 状态值字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @typeParam TEvent - 事件联合类型
 * @public
 */
export type MachineTransitions<
  TValue extends string,
  TContext,
  TEvent extends { type: string },
> = Partial<{
  [TType in TEvent['type']]: MachineTransitionConfig<
    TValue,
    TContext,
    TEvent,
    TType
  >
}>

/**
 * 单个状态节点配置。
 *
 * @typeParam TValue - 状态值字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @typeParam TEvent - 事件联合类型
 * @public
 */
export interface MachineStateConfig<
  TValue extends string,
  TContext,
  TEvent extends { type: string },
> {
  on?: MachineTransitions<TValue, TContext, TEvent>
  entry?: (args: MachineHookArgs<TValue, TContext, TEvent>) => void
  exit?: (args: MachineHookArgs<TValue, TContext, TEvent>) => void
}

/**
 * 状态机配置对象。
 *
 * @typeParam TValue - 状态值字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @typeParam TEvent - 事件联合类型
 * @public
 */
export interface MachineConfig<
  TValue extends string,
  TContext,
  TEvent extends { type: string },
> {
  initial: TValue
  context: TContext
  states: Record<TValue, MachineStateConfig<TValue, TContext, TEvent>>
}

/**
 * 单次状态转移的计算结果。
 *
 * @typeParam TValue - 状态值字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @public
 */
export interface MachineTransitionResult<TValue extends string, TContext> {
  status: 'ignored' | 'blocked' | 'matched'
  changed: boolean
  stateChanged: boolean
  snapshot: MachineSnapshot<TValue, TContext>
}

/**
 * 状态机快照变更监听器。
 *
 * @typeParam TValue - 状态值字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @public
 */
export type MachineListener<TValue extends string, TContext> = (
  snapshot: MachineSnapshot<TValue, TContext>,
) => void

/**
 * 状态机实例公开接口。
 *
 * @typeParam TValue - 状态值字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @typeParam TEvent - 事件联合类型
 * @public
 */
export interface MachineInstance<
  TValue extends string,
  TContext,
  TEvent extends { type: string },
> {
  getValue: () => TValue
  getContext: () => TContext
  getSnapshot: () => MachineSnapshot<TValue, TContext>
  send: (event: TEvent) => MachineSnapshot<TValue, TContext>
  can: (event: TEvent) => boolean
  matches: (value: TValue) => boolean
  subscribe: (listener: MachineListener<TValue, TContext>) => () => void
}
