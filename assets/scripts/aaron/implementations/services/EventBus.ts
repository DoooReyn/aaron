import { Service } from '../../core';
import { IEventBus, IEventChannel, IEventListener } from '../../interfaces';
import { list } from '../../utils';

/**
 * 事件渠道
 * - 用于发布和订阅事件
 * - 每个渠道可以有多个事件监听器
 */
export class EventChannel implements IEventChannel {
  /** 事件监听器容器 */
  private __listeners: Map<string, IEventListener[]> = new Map();

  /**
   * 构造函数
   * @param __channel 渠道名称
   */
  constructor(private __channel: string) {}

  get channel(): string {
    return this.__channel;
  }

  emit(event: string, ...data: any[]): void {
    if (this.__listeners.has(event)) {
      const listeners = this.__listeners.get(event)!;
      list.each(
        listeners,
        (v, i) => {
          v.handle.apply(v.context, ...data);
          if (v.once) {
            listeners.splice(i, 1);
          }
        },
        true
      );
    }
  }

  has(event: string): boolean {
    return this.__listeners.has(event) && this.__listeners.get(event)!.length > 0;
  }

  on(listener: IEventListener): void {
    if (!this.__listeners.has(listener.event)) {
      this.__listeners.set(listener.event, [listener]);
    } else {
      this.__listeners.get(listener.event)!.push(listener);
    }
  }

  off(event?: string, ctx?: any): void {
    if (event !== undefined && ctx !== undefined) {
      // 同时指定事件名称和上下文时，取消特定监听器的订阅
      if (this.__listeners.has(event)) {
        const listeners = this.__listeners.get(event)!;
        for (let i = listeners.length - 1; i >= 0; i--) {
          if (listeners[i].context === ctx) {
            listeners.splice(i, 1);
          }
        }
        if (listeners.length === 0) {
          this.__listeners.delete(event);
        }
      }
    } else if (event != undefined && ctx == undefined) {
      // 仅指定事件名称时，取消所有该事件的订阅
      if (this.__listeners.has(event)) {
        this.__listeners.delete(event);
      }
    } else if (event == undefined && ctx != undefined) {
      // 仅指定上下文时，取消所有该上下文的订阅
      for (let [evt, listeners] of this.__listeners) {
        for (let i = listeners.length - 1; i >= 0; i--) {
          if (listeners[i].context === ctx) {
            listeners.splice(i, 1);
          }
        }
        if (listeners.length === 0) {
          this.__listeners.delete(evt);
        }
      }
    } else {
      // 未指定事件名称和上下文时，取消所有订阅
      this.__listeners.clear();
    }
  }

  clear(): void {
    this.__listeners.clear();
  }
}

/**
 * 事件总线
 * - 用于管理事件渠道，实现事件的发布和订阅。
 */
export class EventBus extends Service implements IEventBus {
  /** 事件渠道容器 */
  private __channels: Map<string, IEventChannel> = new Map();

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
    if (!this.__channels.has(channel)) {
      this.__channels.set(channel, new EventChannel(channel));
    }
    return this.__channels.get(channel)!;
  }

  has(channel: string): boolean {
    return this.__channels.has(channel);
  }

  remove(channel: string): void {
    this.__channels.delete(channel);
  }

  clear(): void {
    this.__channels.clear();
  }
}