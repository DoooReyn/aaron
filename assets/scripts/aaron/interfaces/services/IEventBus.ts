import { IService } from '../IService';

/**
 * 事件监听器接口
 * @description 事件监听器是用于处理事件的回调函数。
 * 它包含事件名称、事件上下文和事件处理函数。
 */
export interface IEventListener {
  /** 事件名称 */
  readonly event: string;
  /** 事件上下文 */
  readonly context?: any;
  /** 是否只执行一次 */
  readonly once?: boolean;
  /**
   * 事件处理函数
   * @param args 输入参数
   */
  handle(...args: any[]): void | Promise<void>;
}

/**
 * 事件渠道接口
 * @description 事件渠道是事件总线中的一个通道，用于发布和订阅事件。
 * 每个事件渠道都有一个唯一的名称，用于标识该渠道。
 */
export interface IEventChannel {
  /** 渠道名称 */
  readonly channel: string;
  /**
   * 发布事件
   * @param event 事件名称
   * @param data 事件数据
   */
  emit(event: string, ...data: any[]): void;
  /**
   * 查询事件是否已订阅
   * @param event 事件名称
   * @returns 是否已订阅
   */
  has(event: string): boolean;
  /**
   * 订阅事件
   * @param listener 事件监听器
   */
  on(listener: IEventListener): void;
  /**
   * 订阅事件
   * @param listener 事件名称
   * @param handle 事件处理函数
   * @param context 事件上下文 [可选]
   * @param once 是否只执行一次 [可选]
   */
  on(listener: string, handle: (...args: any[]) => void | Promise<void>, context?: any, once?: boolean): void;
  /**
   * 取消订阅事件
   * - 同时指定事件名称和上下文时，取消该监听器的订阅
   * - 仅指定事件名称时，取消所有该事件的订阅
   * - 仅指定上下文时，取消所有该上下文的订阅
   * - 未指定事件名称和上下文时，取消所有订阅
   * @param event 事件名称 [可选]
   * @param ctx 事件上下文 [可选]
   */
  off(event?: string, ctx?: any): void;
  /** 取消所有订阅事件 */
  clear(): void;
}

/**
 * 事件总线接口
 * @description 事件总线是一种用于在应用程序中进行事件通信的机制。
 * 它允许不同的组件之间通过发布和订阅事件来进行通信，实现解耦和灵活的事件处理。
 */
export interface IEventBus extends IService {
  /** 共享事件渠道 */
  get shared(): IEventChannel;
  /** GUI 事件频道 */
  get gui(): IEventChannel;
  /** 应用事件频道 */
  get app(): IEventChannel;
  /** 红点事件频道 */
  get red(): IEventChannel;
  /**
   * 获取事件渠道
   * @param channel 渠道名称
   * @returns 事件渠道
   */
  acquire(channel: string): IEventChannel;
  /**
   * 查询事件渠道是否已存在
   * @param channel 渠道名称
   * @returns 是否已存在
   */
  has(channel: string): boolean;
  /**
   * 移除事件渠道
   * @param channel 渠道名称
   */
  remove(channel: string): void;
  /** 删除所有事件渠道 */
  clear(): void;
}
