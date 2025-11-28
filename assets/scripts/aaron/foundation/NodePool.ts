import { Prefab, instantiate } from 'cc';
import { INodePool, IRecyclableNode, IRecyclableOptions } from '../interfaces';
import { time } from '../utils';

/**
 * 节点池
 */
export class NodePool implements INodePool {
  /** 节点列表 */
  private _items: IRecyclableNode[] = [];

  public constructor(public readonly template: Prefab | IRecyclableNode, public readonly options: IRecyclableOptions) {}

  get token() {
    return this.options.token;
  }

  get expires() {
    return this.options.expires;
  }

  get expands() {
    return this.options.expands;
  }

  get capacity() {
    return this.options.capacity;
  }

  get size(): number {
    return this._items.length;
  }

  fill(n: number): void {
    if (n == undefined || n <= 0 || this.size >= n) return;

    const need = n - this.size;
    for (let i = 0; i < need; i++) {
      this._items.push(instantiate(this.template) as IRecyclableNode);
    }
  }

  acquire(...args: any[]): IRecyclableNode | undefined {
    const node: IRecyclableNode =
      this.size > 0 ? this._items.shift()! : (instantiate(this.template) as IRecyclableNode);
    node.token = this.options.token;
    node.createdAt = 0;
    node.recycledAt = 0;
    node.onInitialize(...args);

    if (this.size == 0 && this.options.expands > 0) {
      setTimeout(() => this.fill(this.options.expands), 0);
    }

    return node;
  }

  recycle(inst: IRecyclableNode): void {
    if (inst && inst.isValid && inst.recycledAt === 0) {
      const capacity = this.capacity;
      const size = this.size;
      inst.createdAt = 0;
      inst.recycledAt = time.now();
      inst.onRecycled();
      if (capacity <= 0 || size < capacity) {
        inst.removeFromParent();
        // 延迟回收，防止同一时间被回收又被取出使用可能引起不必要的麻烦
        setTimeout(() => this._items.push(inst), 0);
      } else {
        inst.destroy();
      }
    }
  }

  clearUnused(): void {
    const expires = this.expires;
    if (expires <= 0) return;

    const expands = this.options.expands;
    if (this.size <= expands) return;

    for (let i = this.size - 1 - expands; i >= 0; i--) {
      this._items[i].destroy();
      this._items.splice(i, 1);
    }
  }

  clear(): void {
    for (let i = this.size - 1; i >= 0; i--) {
      this._items[i].destroy();
      this._items.splice(i, 1);
    }
  }
}
