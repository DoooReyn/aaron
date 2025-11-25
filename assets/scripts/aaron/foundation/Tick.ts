import { aaron } from '../core';
import { ITick } from '../interfaces';
import { Counter } from './Counter';

/**
 * 定时器
 */
export class Tick implements ITick {
  /** 定时器标识 */
  public readonly name: string = 'tick';
  /** 是否运行中 */
  private _running: boolean = false;
  /** 计数器列表 */
  private _container: Counter[] = [];
  /** 当前速率 */
  private _speed: number = 1;

  /**
   * 定时器构造
   */
  public constructor() {
    this._running = true;
  }

  /** 运行 */
  public run() {
    if (!this._running) {
      this._running = true;
    }
  }

  /** 暂停 */
  public pause() {
    if (this._running) {
      this._running = false;
    }
  }

  /** 停止 */
  public stop() {
    if (this._running) {
      this._running = false;
      this.clear();
    }
  }

  /**
   * 添加计数器
   * @param interval 设定间隔
   * @param total 设定计数
   * @returns
   */
  public add(interval: number = 0, total: number = 1) {
    const counter = aaron.objectPool.acquire(Counter, interval, total);
    this._container.push(counter);
    return counter;
  }

  /**
   * 移除计数器
   * @param counter 计数器(ID)
   */
  public del(counter: Counter | number) {
    if (counter instanceof Counter) {
      const index = this._container.indexOf(counter);
      if (index >= 0) {
        this._container.splice(index, 1);
      }
    } else {
      const index = this._container.findIndex((item) => item.cid === counter);
      if (index >= 0) {
        this._container.splice(index, 1);
      }
    }
  }

  /**
   * 下一帧执行
   * @param handle 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  public nextTick(handle: Function, context: any, ...args: any[]) {
    return this.delay(0, handle, context, ...args);
  }

  /**
   * N 帧后执行
   * @param frames 帧数
   * @param handle 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  public nextTicks(frames: number, handle: Function, context: any, ...args: any[]) {
    const time = Math.max(0, frames) * (1 / 60);
    return this.delay(time, handle, context, ...args);
  }

  /**
   * 延迟执行
   * @param interval 设定间隔
   * @param handle 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  public delay(interval: number, handle: Function, context: any, ...args: any[]) {
    const counter = this.add(interval);
    counter.onDone.add(handle, context, true, ...args);
    return counter;
  }

  /**
   * 计次执行
   * @param interval 设定间隔
   * @param total 设定计数
   * @param handle 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  public repeat(interval: number, total: number, handle: Function, context: any, ...args: any[]) {
    const counter = this.add(interval, total);
    counter.onCount.add(handle, context, false, ...args);
    return counter;
  }

  /**
   * 重复执行
   * @param interval 设定间隔
   * @param handle 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  public loop(interval: number, handle: Function, context: any, ...args: any[]) {
    const counter = this.add(interval, 0);
    counter.onCount.add(handle, context, false, ...args);
    return counter;
  }

  /**
   * 每帧执行
   * @param handle 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  public everyTick(handle: Function, context: any, ...args: any[]) {
    const counter = this.add(0, 0);
    counter.onTick.add(handle, context, false, ...args);
    return counter;
  }

  /**
   * 以固定频率重复执行
   * @param handle 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  public fixedTick(interval: number, handle: Function, context: any, ...args: any[]) {
    const counter = this.add(interval, 0);
    counter.onFixedTick.add(handle, context, false, ...args);
    return counter;
  }

  /**
   * 清空所有计数器
   */
  private clear() {
    this._container.forEach((counter) => aaron.objectPool.recycle(counter));
    this._container.length = 0;
  }

  /**
   * 当前速率
   */
  public get speed() {
    return this._speed;
  }

  public set speed(v: number) {
    this._speed = v;
  }

  /**
   * 累积时间片
   * @param dt 时间片
   */
  public update(dt: number) {
    if (this._running) {
      for (let i = 0, l = this._container.length, counter: Counter; i < l; i++) {
        counter = this._container[i];
        counter.update(dt * this._speed);
        if (counter.done) {
          this._container.splice(i, 1);
          i--;
          l--;
        }
      }
    }
  }
}
