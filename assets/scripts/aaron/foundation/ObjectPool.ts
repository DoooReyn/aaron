import { Constructor } from 'cc';

import { IObjectPool, IRecyclableOptions } from '../interfaces';
import { ObjectEntry } from './ObjectEntry';

/**
 * 对象池
 */
export class ObjectPool<T extends ObjectEntry> implements IObjectPool<T> {
  /** 条目列表 */
  private readonly _items: T[];

  /**
   * 构造函数
   * @param construct 对象池条目构造
   * @param options 对象池条目配置
   */
  constructor(public readonly construct: Constructor<T>, public readonly options: IRecyclableOptions) {
    this._items = [];
    this.fill(this.options.expands);
  }

  get token() {
    return this.options.token;
  }

  get capacity() {
    return this.options.capacity;
  }

  get expires() {
    return this.options.expires;
  }

  get size(): number {
    return this._items.length;
  }

  fill(n: number): void {
    if (n == undefined || n <= 0 || this.size >= n) return;

    const need = n - this.size;
    for (let i = 0; i < need; i++) {
      this._items.push(new this.construct());
    }
  }

  acquire(...args: any[]): T {
    const instance = this._items.shift() ?? new this.construct();
    instance.token = this.token;
    instance.initialize(...args);

    if (this.size == 0 && this.options.expands > 0) {
      setTimeout(() => this.fill(this.options.expands), 0);
    }

    return instance;
  }

  recycle(instance: T): void {
    if (instance && instance.recycle()) {
      const capacity = this.capacity;
      const size = this.size;
      if (capacity <= 0 || size < capacity) {
        // 延迟回收，防止同一时间被回收又被取出使用可能引起不必要的麻烦
        setTimeout(() => this._items.push(instance), 0);
      }
    }
  }

  clearUnused(): void {
    const expires = this.expires;
    if (expires <= 0) return;

    const expands = this.options.expands;
    if (this.size <= expands) return;

    for (let i = this.size - 1 - expands; i >= 0; i--) {
      this._items.splice(i, 1);
    }
  }

  clear(): void {
    for (let i = this.size - 1; i >= 0; i--) {
      this._items[i].recycle();
      this._items.splice(i, 1);
    }
  }
}
