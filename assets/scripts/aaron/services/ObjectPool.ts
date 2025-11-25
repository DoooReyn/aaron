import { Service } from '../core';
import { ObjectPool } from '../foundation';
import { IObjectEntry, IObjectPool, IObjectPoolContainer, IRecyclableOptions } from '../interfaces';
import { Constructor, Pair } from '../types';

/**
 * 对象池容器服务
 */
export class ObjectPoolContainer extends Service implements IObjectPoolContainer {
  /** 池子容器 */
  private _container: Map<string, Pair<IObjectPool<IObjectEntry>, Constructor<IObjectEntry>>> = new Map();

  register(cls: Constructor<IObjectEntry>, options: IRecyclableOptions): void {
    const token = options.token;

    if (this._container.has(token)) {
      throw new Error(`❌ 对象池条目 ${token} 已注册`);
    }

    this._container.set(token, [new ObjectPool(cls, options), cls]);
  }

  unregister(cls: Constructor<IObjectEntry> | string): void {
    if (typeof cls === 'string') {
      if (this._container.has(cls)) {
        this._container.delete(cls);
      }
    } else {
      for (let [token, pair] of this._container) {
        if (cls === pair[1]) {
          this._container.delete(token);
          break;
        }
      }
    }
  }

  has(cls: Constructor<IObjectEntry> | string): boolean {
    if (typeof cls === 'string') {
      return this._container.has(cls);
    } else {
      for (let [, pair] of this._container) {
        if (cls === pair[1]) {
          return true;
        }
      }
      return false;
    }
  }

  poolOf<T extends IObjectEntry>(cls: Constructor<T> | string): IObjectPool<T> {
    let token = '';
    if (typeof cls === 'string') {
      token = cls;
    } else {
      for (let [key, pair] of this._container) {
        if (cls === pair[1]) {
          token = key;
          break;
        }
      }
    }

    if (!this._container.has(token)) return undefined;

    return this._container.get(token)[0] as IObjectPool<T>;
  }

  acquire<T extends IObjectEntry>(cls: Constructor<T>, ...args: any[]): T | undefined {
    const inst = this.poolOf(cls);
    if (inst === undefined) {
      throw new Error(`❌ 对象池条目未注册`);
    }
    return inst.acquire(...args) as T;
  }

  recycle<T extends IObjectEntry>(instance: T): void {
    if (instance && instance.token !== undefined && instance.recycle !== undefined) {
      if (!this._container.has(instance.token)) {
        throw new Error(`❌ 对象池条目 ${instance.token} 未注册`);
      }
      this._container.get(instance.token)![0].recycle(instance);
    }
  }

  clearUnused(): void {
    this._container.forEach((v) => v[0].clearUnused());
  }

  clear(): void {
    this._container.forEach((p) => p[0].clear());
  }
}
