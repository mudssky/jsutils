/**
 * 状态机快照，保存当前状态和值得持久化的上下文。
 *
 * @typeParam TState - 状态字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @public
 */
export interface MachineSnapshot<TState extends string, TContext> {
  state: TState
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
 * guard 和 reduce 共用的转移上下文参数。
 *
 * @typeParam TState - 状态字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @typeParam TEvent - 当前参与转移的事件类型
 * @public
 */
export interface MachineTransitionArgs<
  TState extends string,
  TContext,
  TEvent extends { type: string },
> extends MachineSnapshot<TState, TContext> {
  event: TEvent
}

/**
 * 进入或离开状态钩子拿到的参数。
 *
 * @typeParam TState - 状态字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @typeParam TEvent - 触发本次变化的事件类型
 * @public
 */
export interface MachineHookArgs<
  TState extends string,
  TContext,
  TEvent extends { type: string },
> extends MachineSnapshot<TState, TContext> {
  event: TEvent
}

/**
 * 单条事件转移配置。
 *
 * @typeParam TState - 状态字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @typeParam TEvent - 事件联合类型
 * @typeParam TType - 当前配置对应的事件类型字面量
 * @public
 */
export interface MachineTransitionConfig<
  TState extends string,
  TContext,
  TEvent extends { type: string },
  TType extends TEvent['type'] = TEvent['type'],
> {
  target: TState
  guard?: (
    args: MachineTransitionArgs<
      TState,
      TContext,
      ExtractMachineEvent<TEvent, TType>
    >,
  ) => boolean
  reduce?: (
    args: MachineTransitionArgs<
      TState,
      TContext,
      ExtractMachineEvent<TEvent, TType>
    >,
  ) => TContext
}

/**
 * 单个状态下允许触发的事件转移映射。
 *
 * @typeParam TState - 状态字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @typeParam TEvent - 事件联合类型
 * @public
 */
export type MachineTransitions<
  TState extends string,
  TContext,
  TEvent extends { type: string },
> = Partial<{
  [TType in TEvent['type']]: MachineTransitionConfig<
    TState,
    TContext,
    TEvent,
    TType
  >
}>

/**
 * 单个状态节点配置。
 *
 * @typeParam TState - 状态字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @typeParam TEvent - 事件联合类型
 * @public
 */
export interface MachineStateConfig<
  TState extends string,
  TContext,
  TEvent extends { type: string },
> {
  on?: MachineTransitions<TState, TContext, TEvent>
  onEnter?: (args: MachineHookArgs<TState, TContext, TEvent>) => void
  onExit?: (args: MachineHookArgs<TState, TContext, TEvent>) => void
}

/**
 * 状态机配置对象。
 *
 * @typeParam TState - 状态字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @typeParam TEvent - 事件联合类型
 * @public
 */
export interface MachineConfig<
  TState extends string,
  TContext,
  TEvent extends { type: string },
> {
  initial: TState
  context: TContext
  states: Record<TState, MachineStateConfig<TState, TContext, TEvent>>
}

/**
 * 单次状态转移的计算结果。
 *
 * @typeParam TState - 状态字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @public
 */
export interface MachineTransitionResult<TState extends string, TContext> {
  status: 'ignored' | 'blocked' | 'matched'
  changed: boolean
  stateChanged: boolean
  snapshot: MachineSnapshot<TState, TContext>
}

/**
 * 状态机快照变更监听器。
 *
 * @typeParam TState - 状态字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @public
 */
export type MachineListener<TState extends string, TContext> = (
  snapshot: MachineSnapshot<TState, TContext>,
) => void

/**
 * 状态机实例公开接口。
 *
 * @typeParam TState - 状态字面量联合类型
 * @typeParam TContext - 上下文对象类型
 * @typeParam TEvent - 事件联合类型
 * @public
 */
export interface MachineInstance<
  TState extends string,
  TContext,
  TEvent extends { type: string },
> {
  getState: () => TState
  getContext: () => TContext
  getSnapshot: () => MachineSnapshot<TState, TContext>
  send: (event: TEvent) => MachineSnapshot<TState, TContext>
  can: (event: TEvent) => boolean
  matches: (state: TState) => boolean
  subscribe: (listener: MachineListener<TState, TContext>) => () => void
}
