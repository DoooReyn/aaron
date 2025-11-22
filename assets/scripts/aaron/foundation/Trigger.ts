import { aaron } from '../core';
import { ObjectEntry } from './ObjectEntry';

/**
 * 触发器
 */
export class Trigger extends ObjectEntry {
  /** 回调方法 */
  private _handle: ((...args: any[]) => unknown) | null = null;
  /** 回调上下文 */
  private _ctx: any = null;
  /** 是否一次性 */
  private _once: boolean = false;
  /** 回调入参 */
  private _args: any[] = [];

  onInitialize(handle: (...args: any[]) => unknown, context: any, once: boolean = false, args: any[]) {
    super.onInitialize();
    this._handle = handle;
    this._ctx = context;
    this._once = once;
    this._args = args;
  }

  onRecycled() {
    super.onRecycled();
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
   * @param fn 回调方法
   * @param context 回调上下文
   * @returns
   */
  public equalsWith(fn: Function, context: any) {
    return this._handle === fn && this._ctx === context;
  }

  /**
   * 运行触发器
   */
  public run() {
    if (this.isValid) {
      const [, err] = aaron.catcher.sync(this._handle!, this._ctx!, this._args);
      if (err) {
        aaron.logger.e('触发器: 运行时错误', err);
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
      const [, err] = aaron.catcher.sync(this._handle!, this._ctx!, args.concat(this._args));
      if (err) {
        aaron.logger.e('触发器: 运行时错误', err);
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
export class Triggers {
  /** 触发器列表 */
  private __container: Trigger[] = [];

  /**
   * 清空触发器
   */
  public clear() {
    const objectPool = aaron.objectPool;
    this.__container.forEach((trigger) => objectPool.recycle(trigger));
    this.__container.length = 0;
  }

  /**
   * 添加触发器
   * @param fn 回调方法
   * @param context 回调上下文
   * @param once 是否一次性
   * @param args 回调入参
   */
  public add(fn: Function, context: any, once: boolean = false, ...args: any[]) {
    const trigger = aaron.objectPool.acquire(Trigger, fn, context, once, args);
    if (trigger) this.__container.push(trigger);
  }

  /**
   * 移除触发器
   * @param fn 回调方法
   * @param context 回调上下文
   */
  public delWith(fn: Function, context: any) {
    const at = this.__container.findIndex((tr) => tr.equalsWith(fn, context));
    if (at > -1) {
      const trigger = this.__container[at];
      this.__container.splice(at, 1);
      aaron.objectPool.recycle(trigger);
    }
  }

  /**
   * 移除触发器
   * @param trigger 触发器
   */
  public del(trigger: Trigger) {
    const at = this.__container.findIndex((tr) => tr.equals(trigger));
    if (at > -1) {
      const trigger = this.__container[at];
      this.__container.splice(at, 1);
      aaron.objectPool.recycle(trigger);
    }
  }

  /**
   * 运行触发器
   */
  public run() {
    for (let i = this.__container.length - 1; i >= 0; i--) {
      const trigger = this.__container[i];
      trigger.run();
      if (trigger.destroyed) {
        this.__container.splice(i, 1);
      }
    }
  }

  /**
   * 运行触发器
   * @param args 额外入参（插入到原始入参之前）
   */
  public runWith(...args: any[]) {
    for (let i = this.__container.length - 1; i >= 0; i--) {
      const trigger = this.__container[i];
      trigger.runWith(...args);
      if (trigger.destroyed) {
        this.__container.splice(i, 1);
      }
    }
  }
}
