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

  public acquire(key: string) {
    let tick = this._container.get(key);
    if (!tick) {
      tick = new Tick();
      this._container.set(key, tick);
    }
    return tick;
  }

  public get shared() {
    return this.acquire('shared');
  }

  public get system() {
    return this.acquire('system');
  }

  public get recycle() {
    return this.acquire('recycle');
  }

  public pause() {
    this._container.forEach((tick) => tick.pause());
  }

  public resume() {
    this._container.forEach((tick) => tick.run());
  }

  public stop() {
    this.pause();
    this._container.forEach((tick) => tick.stop());
    this._container.clear();
  }

  public update(dt: number) {
    this._container.forEach((tick) => tick.update(dt));
  }
}
