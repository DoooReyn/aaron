import { Node, Prefab } from 'cc';
import { Service } from '../core';
import { INodePoolContainer, IRecyclableNode, IRecyclableOptions } from '../interfaces';
import { Constructor } from '../types';
import { NodePool } from '../foundation';

/**
 * 节点池容器服务
 */
export class NodePoolContainer extends Service implements INodePoolContainer {
  /** 节点池容器 */
  private _container: Map<string, NodePool> = new Map();

  registerByConstructor(template: Constructor<IRecyclableNode>, options: IRecyclableOptions): void {
    const token = options.token;
    if (this._container.has(token)) {
      throw new Error(`节点池: 注册失败，节点池已存在 ${token}`);
    }

    const pool = new NodePool(new template(), options);
    this._container.set(token, pool);
  }

  registerByInstance(template: Node | Prefab, options: IRecyclableOptions): void {
    const token = options.token;
    if (this._container.has(token)) {
      throw new Error(`节点池: 注册失败，节点池已存在 ${token}`);
    }

    if (template instanceof Node) {
      const node = template as Node & { createdAt?: Number; recycledAt?: Number; token?: string };
      if (node.token === undefined || (typeof node.token === 'string' && !this.has(node.token!))) {
        node.createdAt = 0;
        node.recycledAt = 0;
        node.token = token;
        const pool = new NodePool(node as IRecyclableNode, options);
        this._container.set(token, pool);
      } else {
        throw new Error(`节点池: 注册失败，节点实例不符合条件 ${token}`);
      }
    } else {
      const pool = new NodePool(template, options);
      this._container.set(token, pool);
    }
  }

  unregister(token: string): void {
    if (this._container.has(token)) {
      this._container.delete(token);
    }
  }

  has(token: string): boolean {
    return this._container.has(token);
  }

  templateOf(token: string): Prefab | IRecyclableNode | undefined {
    if (!this._container.has(token)) {
      throw new Error(`节点池: 查询失败，节点池不存在 ${token}`);
    }

    const pool = this._container.get(token)!;
    return pool.template;
  }

  acquire<N extends IRecyclableNode>(token: string): N | undefined {
    if (!this._container.has(token)) {
      throw new Error(`节点池: 查询失败，节点池不存在 ${token}`);
    }

    const pool = this._container.get(token)!;
    return pool.acquire() as N;
  }

  recycle(inst: IRecyclableNode): void {
    if (inst && inst.isValid && inst.token !== undefined && inst.recycledAt === 0) {
      if (!this._container.has(inst.token)) {
        throw new Error(`节点池: 查询失败，节点池不存在 ${inst.token}`);
      }
      this._container.get(inst.token)!.recycle(inst);
    }
  }

  sizeOf(token: string): number {
    if (this._container.has(token)) {
      return this._container.get(token)!.size;
    }
    return 0;
  }

  clearUnused(): void {
    this._container.forEach((v) => v.clearUnused());
  }

  clear(): void {
    this._container.forEach((pool) => pool.clear());
  }
}
