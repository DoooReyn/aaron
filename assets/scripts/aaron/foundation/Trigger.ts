import { aaron } from '../core';
import { ITrigger, ITriggers } from '../interfaces';
import { MESSAGES } from '../macro';
import { might, misc } from '../utils';
import { ObjectEntry } from './ObjectEntry';

/**
 * 触发器
 */
export class Trigger extends ObjectEntry implements ITrigger {
  /** 回调方法 */
  private _handle: ((...args: any[]) => unknown) | null = null;
  /** 回调上下文 */
  private _ctx: any = null;
  /** 是否一次性 */
  private _once: boolean = false;
  /** 回调入参 */
  private _args: any[] = [];

  onInitialize(handle: (...args: any[]) => unknown, context: any, once: boolean = false, args: any[]) {
    this._handle = handle;
    this._ctx = context ?? misc.CTX;
    this._once = once;
    this._args = args;
  }

  onRecycled() {
    this._handle = null;
    this._ctx = null;
    this._once = false;
    this._args = [];
  }

  /**
   * 是否有效
   */
  public get isValid() {
    return !!(this._handle && this._ctx);
  }

  /**
   * 比较触发器是否一致
   * @param trigger 触发器
   * @returns
   */
  public equals(trigger: Trigger) {
    return this._handle === trigger._handle && this._ctx === trigger._ctx;
  }

  /**
   * 比较触发器是否一致
   * @param handle 回调方法
   * @param context 回调上下文
   * @returns
   */
  public equalsWith(handle: Function, context: any) {
    return this._handle === handle && this._ctx === context;
  }

  /**
   * 运行触发器
   */
  public run() {
    if (this.isValid) {
      const [, err] = might.runSync(this._handle!, this._ctx!, this._args);
      if (err) {
        aaron.logger.ef(MESSAGES.TRIGGER.RUNTIME_ERROR, err);
      }
      if (this._once) {
        aaron.objectPool.recycle(this);
      }
    }
  }

  /**
   * 运行触发器
   * @param args 额外入参（插入到原始入参之前）
   */
  public runWith(...args: any[]) {
    if (this.isValid) {
      const [, err] = might.runSync(this._handle!, this._ctx!, args.concat(this._args));
      if (err) {
        aaron.logger.ef(MESSAGES.TRIGGER.RUNTIME_ERROR, err);
      }
      if (this._once) {
        aaron.objectPool.recycle(this);
      }
    }
  }
}

/**
 * 触发器容器
 */
export class Triggers implements ITriggers {
  /** 触发器列表 */
  private _container: Trigger[] = [];

  /**
   * 清空触发器
   */
  public clear() {
    const objectPool = aaron.objectPool;
    this._container.forEach((trigger) => objectPool.recycle(trigger));
    this._container.length = 0;
  }

  /**
   * 添加触发器
   * @param handle 回调方法
   * @param context 回调上下文
   * @param once 是否一次性
   * @param args 回调入参
   */
  public add(handle: Function, context: any, once: boolean = false, ...args: any[]) {
    const trigger = aaron.objectPool.acquire(Trigger, handle, context, once, args);
    if (trigger) this._container.push(trigger);
  }

  /**
   * 移除触发器
   * @param handle 回调方法
   * @param context 回调上下文
   */
  public delWith(handle: Function, context: any) {
    const at = this._container.findIndex((tr) => tr.equalsWith(handle, context));
    if (at > -1) {
      const trigger = this._container[at];
      this._container.splice(at, 1);
      aaron.objectPool.recycle(trigger);
    }
  }

  /**
   * 移除触发器
   * @param trigger 触发器
   */
  public del(trigger: Trigger) {
    const at = this._container.findIndex((tr) => tr.equals(trigger));
    if (at > -1) {
      const trigger = this._container[at];
      this._container.splice(at, 1);
      aaron.objectPool.recycle(trigger);
    }
  }

  /**
   * 运行触发器
   */
  public run() {
    for (let i = this._container.length - 1; i >= 0; i--) {
      const trigger = this._container[i];
      trigger.run();
      if (trigger.destroyed) {
        this._container.splice(i, 1);
      }
    }
  }

  /**
   * 运行触发器
   * @param args 额外入参（插入到原始入参之前）
   */
  public runWith(...args: any[]) {
    for (let i = this._container.length - 1; i >= 0; i--) {
      const trigger = this._container[i];
      trigger.runWith(...args);
      if (trigger.destroyed) {
        this._container.splice(i, 1);
      }
    }
  }
}
