
/**
 * FSMKey 类型用于表示有效的状态和事件的类型。
 * 它可以是字符串、数字或符号。
 */
export type FSMKey = string | number | symbol;

/**
 * TransitionTable 类型用于表示状态转换表。
 * 它是一个只读对象，其中每个状态都映射到一个只读的、部分的、记录类型。
 */
export type TransitionTable<TState extends FSMKey, TEvent extends FSMKey> = Readonly<{
  readonly [S in TState]: Readonly<Partial<Record<TEvent, TState>>>;
}>;

/**
 * FSMCallbacks 接口定义了有限状态机的回调函数。
 * 它包含两个可选的回调函数：onBeforeTransition 和 onAfterTransition。
 */
export interface FSMCallbacks<TState extends FSMKey, TEvent extends FSMKey, TContext = any> {
  /**
   * onBeforeTransition 回调函数在状态转换之前被调用。
   * 它接收四个参数：from（当前状态）、to（目标状态）、by（触发事件）和 context（上下文）。
   * 如果返回 false，状态转换将被取消。
   */
  onBeforeTransition?: (
    from: TState,
    to: TState,
    by: TEvent,
    context?: TContext
  ) => boolean | void | Promise<boolean | void>;
  /**
   * onAfterTransition 回调函数在状态转换之后被调用。
   * 它接收四个参数：from（当前状态）、to（目标状态）、by（触发事件）和 context（上下文）。
   */
  onAfterTransition?: (from: TState, to: TState, by: TEvent, context?: TContext) => void | Promise<void>;
}

/**
 * 每个状态的本地回调定义
 */
export interface FSMStateLocalCallbacks<TState extends FSMKey, TEvent extends FSMKey, TContext = any> {
  /** 某状态即将退出时触发（在全局 onBeforeTransition 允许通过后、实际状态切换前执行） */
  onExit?: (from: TState, to: TState, by: TEvent, context?: TContext) => void | Promise<void>;
  /** 某状态刚进入时触发（状态已切换后执行） */
  onEnter?: (to: TState, from: TState, by: TEvent, context?: TContext) => void | Promise<void>;
}

/**
 * FSMConfig 接口定义了有限状态机的配置。
 * 它继承了 FSMCallbacks 接口，并添加了 initial 和 transitions 属性。
 */
export interface FSMConfig<TState extends FSMKey, TEvent extends FSMKey, TContext = any>
  extends FSMCallbacks<TState, TEvent, TContext> {
  /**
   * initial 表示有限状态机的初始状态。
   * 它必须是 TState 类型之一。
   */
  initial: TState;
  /**
   * transitions 表示有限状态机的状态转换表。
   * 它是一个只读对象，其中每个状态都映射到一个只读的、部分的、记录类型。
   */
  transitions: TransitionTable<TState, TEvent>;
  /**
   * 每个状态的本地回调（onEnter/onExit），可选。
   */
  stateCallbacks?: Readonly<Partial<Record<TState, FSMStateLocalCallbacks<TState, TEvent, TContext>>>>;
}

/**
 * IFSM 接口定义了有限状态机的接口。
 * 它包含了一些基本属性和方法，如 state、enteredAt、can、transition、getStateDuration 和 getTransitions。
 */
export interface IFSM<TState extends FSMKey, TEvent extends FSMKey, TContext = any> {
  /**
   * state 表示有限状态机的当前状态。
   * 它必须是 TState 类型之一。
   */
  get state(): TState;
  /**
   * enteredAt 表示有限状态机进入当前状态的时间。
   * 它是一个数字，表示自 Unix 纪元以来的毫秒数。
   */
  get enteredAt(): number;
  /**
   * can 方法用于检查是否可以触发某个事件。
   * 它接收一个事件参数，并返回一个 boolean 值。
   */
  can(event: TEvent): boolean;
  /**
   * transition 方法用于触发状态转换。
   * 它接收一个事件参数和一个可选的上下文参数，并返回一个 Promise<boolean>。
   */
  transition(event: TEvent, context?: TContext): Promise<boolean>;
  /**
   * getStateDuration 方法用于获取有限状态机进入当前状态的时间。
   * 它返回一个数字，表示自进入当前状态以来的毫秒数。
   */
  getStateDuration(): number;
  /**
   * getTransitions 方法用于获取有限状态机的状态转换表。
   * 它返回一个 TransitionTable<TState, TEvent>。
   */
  getTransitions(): TransitionTable<TState, TEvent>;
}

/**
 * FSMHolder 接口定义了有限状态机的持有者接口。
 * 它包含一个 fsm 属性，用于存储有限状态机的实例。
 */
export interface FSMHolder<TState extends FSMKey, TEvent extends FSMKey> {
  /**
   * fsm 属性存储有限状态机的实例。
   */
  fsm: IFSM<TState, TEvent>;
}
