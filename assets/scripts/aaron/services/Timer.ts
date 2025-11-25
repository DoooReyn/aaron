import { Service } from '../core';
import { Tick } from '../foundation';
import { ITimer } from '../interfaces';

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
