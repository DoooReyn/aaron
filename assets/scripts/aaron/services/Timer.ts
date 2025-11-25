import { aaron, Service } from '../core';
import { Counter, ObjectEntry, Triggers } from '../foundation';
import { ICounter, ITick, ITimer } from '../interfaces';

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

/**
 * 定时器容器
 * @description 提供了时器的安装、卸载和更新功能
 */
export class Timer extends Service implements ITimer {
  /** 定时器容器 */
  private readonly _container: Map<string, Tick> = new Map();

  /**
   * 获取定时器
   * @param key 定时器标识
   */
  public acquire(key: string) {
    let tick = this._container.get(key);
    if (!tick) {
      tick = new Tick();
      this._container.set(key, tick);
    }
    return tick;
  }

  /**
   * 获取共享定时器
   * - 一般的，不应对此定时器调速
   */
  public get shared() {
    return this.acquire('shared');
  }

  /**
   * 暂停所有定时器（不包括 Director）
   */
  public pause() {
    this._container.forEach((tick) => tick.pause());
  }

  /**
   * 恢复所有定时器（不包括 Director）
   */
  public resume() {
    this._container.forEach((tick) => tick.run());
  }

  /**
   * 停止（清除）所有定时器
   */
  public stop() {
    this.pause();
    this._container.forEach((tick) => tick.stop());
    this._container.clear();
  }

  /**
   * 更新所有定时器
   * @param dt 时间片
   */
  public update(dt: number) {
    this._container.forEach((tick) => tick.update(dt));
  }
}
