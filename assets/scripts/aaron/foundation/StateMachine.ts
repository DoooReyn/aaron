import { FSMCallbacks, FSMConfig, FSMKey, FSMStateLocalCallbacks, IFSM, TransitionTable } from '../interfaces';
import { dict, time } from '../utils';

/**
 * 状态机装饰器
 * @param config 状态机配置
 */
export function mockStateMachine<TState extends FSMKey, TEvent extends FSMKey, TContext = any>(
  config: FSMConfig<TState, TEvent, TContext>
) {
  return function <T extends new (...args: any[]) => {}>(Ctor: T) {
    return class extends (Ctor as any) {
      public fsm!: IFSM<TState, TEvent, TContext>;
      constructor(...args: any[]) {
        super(...args);
        this.fsm = new FiniteStateMachine<TState, TEvent, TContext>(config);
      }
    } as unknown as T;
  };
}

/**
 * 有限状态机
 */
export class FiniteStateMachine<TState extends FSMKey, TEvent extends FSMKey, TContext = any>
  implements IFSM<TState, TEvent, TContext>
{
  /** 状态转换表 */
  private readonly _transitions: TransitionTable<TState, TEvent>;
  /** 回调函数 */
  private readonly _callbacks: FSMCallbacks<TState, TEvent, TContext>;
  /** 本地状态回调表 */
  private readonly _stateCallbacks?: Readonly<
    Partial<Record<TState, FSMStateLocalCallbacks<TState, TEvent, TContext>>>
  >;
  /** 当前状态 */
  private _state: TState;
  public get state(): TState {
    return this._state;
  }
  /** 进入当前状态的时间 */
  private _enteredAt: number;
  public get enteredAt(): number {
    return this._enteredAt;
  }

  constructor(config: FSMConfig<TState, TEvent, TContext>) {
    // 对 transitions 深冻结，运行期不可更改
    this._transitions = dict.deepFreeze({ ...config.transitions }) as TransitionTable<TState, TEvent>;
    this._callbacks = {
      onBeforeTransition: config.onBeforeTransition,
      onAfterTransition: config.onAfterTransition,
    };
    if (config.stateCallbacks) {
      this._stateCallbacks = dict.deepFreeze({ ...(config.stateCallbacks as any) }) as Readonly<
        Partial<Record<TState, FSMStateLocalCallbacks<TState, TEvent, TContext>>>
      >;
    }
    this._state = config.initial;
    this._enteredAt = time.now();
  }

  /** 获取状态转换表 */
  public getTransitions(): TransitionTable<TState, TEvent> {
    return this._transitions;
  }

  /** 检查是否可以触发某个事件 */
  public can(event: TEvent): boolean {
    const mapFrom = this._transitions[this.state] as Partial<Record<TEvent, TState>> | undefined;
    return !!(mapFrom && mapFrom[event] !== undefined);
  }

  /** 触发某个事件 */
  public async transition(event: TEvent, context?: TContext): Promise<boolean> {
    const mapFrom = this._transitions[this.state] as Partial<Record<TEvent, TState>> | undefined;
    if (!mapFrom) return false;
    const next = mapFrom[event];
    if (next === undefined) return false;

    const from = this.state;
    const to = next as TState;

    // 全局 onBeforeTransition
    if (this._callbacks.onBeforeTransition) {
      const res = await this._callbacks.onBeforeTransition(from, to, event, context);
      if (res === false) return false;
    }

    // 本地 fromState.onExit
    const exitCb = this._stateCallbacks?.[from]?.onExit;
    if (exitCb) {
      await exitCb(from, to, event, context);
    }

    // 状态切换与时间戳更新
    this._state = to;
    this._enteredAt = time.now();

    // 本地 toState.onEnter
    const enterCb = this._stateCallbacks?.[to]?.onEnter;
    if (enterCb) {
      await enterCb(to, from, event, context);
    }

    // 全局 onAfterTransition
    if (this._callbacks.onAfterTransition) {
      await this._callbacks.onAfterTransition(from, to, event, context);
    }

    return true;
  }

  /** 获取当前状态的持续时间 */
  public getStateDuration(): number {
    return time.now() - this._enteredAt;
  }
}

const configuration = 1