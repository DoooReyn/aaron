import { Service } from '../core';
import { IEventBus, IEventChannel, IEventListener } from '../interfaces';
import { list } from '../utils';

/**
 * 事件渠道
 * - 用于发布和订阅事件
 * - 每个渠道可以有多个事件监听器
 */
class EventChannel implements IEventChannel {
  /** 事件监听器容器 */
  private _listeners: Map<string, IEventListener[]> = new Map();

  /**
   * 构造函数
   * @param _channel 渠道名称
   */
  constructor(private readonly _channel: string) {}

  get channel(): string {
    return this._channel;
  }

  emit(event: string, ...data: any[]): void {
    if (this._listeners.has(event)) {
      const listeners = this._listeners.get(event)!;
      list.each(
        listeners,
        (v, i) => {
          v.handle.apply(v.context, ...data);
          if (v.once) {
            listeners.splice(i, 1);
          }
        },
        true,
      );
    }
  }

  has(event: string): boolean {
    return this._listeners.has(event) && this._listeners.get(event)!.length > 0;
  }

  on(
    listener: IEventListener | string,
    handle?: (...args: any[]) => void | Promise<void>,
    context?: any,
    once?: boolean,
  ): void {
    if (typeof listener === 'string') {
      if (!handle) {
        return;
      }
      once ??= false;
      listener = {
        event: listener,
        handle,
        once,
        context,
      };
    }
    if (!this._listeners.has(listener.event)) {
      this._listeners.set(listener.event, [listener]);
    } else {
      this._listeners.get(listener.event)!.push(listener);
    }
  }

  off(event?: string, ctx?: any): void {
    if (event !== undefined && ctx !== undefined) {
      // 同时指定事件名称和上下文时，取消特定监听器的订阅
      if (this._listeners.has(event)) {
        const listeners = this._listeners.get(event)!;
        for (let i = listeners.length - 1; i >= 0; i--) {
          if (listeners[i].context === ctx) {
            listeners.splice(i, 1);
          }
        }
        if (listeners.length === 0) {
          this._listeners.delete(event);
        }
      }
    } else if (event != undefined && ctx == undefined) {
      // 仅指定事件名称时，取消所有该事件的订阅
      if (this._listeners.has(event)) {
        this._listeners.delete(event);
      }
    } else if (event == undefined && ctx != undefined) {
      // 仅指定上下文时，取消所有该上下文的订阅
      for (let [evt, listeners] of this._listeners) {
        for (let i = listeners.length - 1; i >= 0; i--) {
          if (listeners[i].context === ctx) {
            listeners.splice(i, 1);
          }
        }
        if (listeners.length === 0) {
          this._listeners.delete(evt);
        }
      }
    } else {
      // 未指定事件名称和上下文时，取消所有订阅
      this._listeners.clear();
    }
  }

  clear(): void {
    this._listeners.clear();
  }
}

/**
 * 事件总线
 * - 用于管理事件渠道，实现事件的发布和订阅。
 */
export class EventBus extends Service implements IEventBus {
  /** 事件渠道容器 */
  private _channels: Map<string, IEventChannel> = new Map();

  get shared() {
    return this.acquire('shared');
  }

  get app() {
    return this.acquire('app');
  }

  get gui() {
    return this.acquire('gui');
  }

  get red() {
    return this.acquire('red');
  }

  acquire(channel: string): IEventChannel {
    if (!this._channels.has(channel)) {
      this._channels.set(channel, new EventChannel(channel));
    }
    return this._channels.get(channel)!;
  }

  has(channel: string): boolean {
    return this._channels.has(channel);
  }

  remove(channel: string): void {
    this._channels.delete(channel);
  }

  clear(): void {
    this._channels.clear();
  }
}
