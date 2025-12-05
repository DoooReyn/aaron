import { Node, Prefab } from 'cc';

import { Service } from '../core';
import { NodePool } from '../foundation';
import { INodePoolContainer, IRecyclableNode, IRecyclableOptions } from '../interfaces';
import { MESSAGES } from '../macro';
import { Constructor } from '../types';
import { literal } from '../utils';

/**
 * 节点池容器服务
 */
export class NodePoolContainer extends Service implements INodePoolContainer {
  readonly token: string = MESSAGES.NODE_POOL.CATEGORY;
  /** 节点池容器 */
  private _container: Map<string, NodePool> = new Map();

  poolOf(token: string): NodePool | undefined {
    return this._container.get(token);
  }

  registerByConstructor(template: Constructor<IRecyclableNode>, options: IRecyclableOptions): void {
    const token = options.token;
    if (this._container.has(token)) {
      throw new Error(literal.fmt(MESSAGES.NODE_POOL.REGISTER_BAD_EXISTED, token));
    }

    const pool = new NodePool(new template(), options);
    this._container.set(token, pool);
    pool.fill(options.expands);
  }

  registerByInstance(template: Node | Prefab, options: IRecyclableOptions): void {
    const token = options.token;
    if (this._container.has(token)) {
      throw new Error(literal.fmt(MESSAGES.NODE_POOL.REGISTER_BAD_EXISTED, token));
    }

    if (template instanceof Node) {
      const node = template as Node & { createdAt?: Number; recycledAt?: Number; token?: string };
      if (node.token === undefined || (typeof node.token === 'string' && !this.has(node.token!))) {
        node.createdAt = 0;
        node.recycledAt = 0;
        node.token = token;
        const pool = new NodePool(node as IRecyclableNode, options);
        this._container.set(token, pool);
        pool.fill(options.expands);
      } else {
        throw new Error(literal.fmt(MESSAGES.NODE_POOL.REGISTER_BAD_DISMATCHED, token));
      }
    } else {
      const pool = new NodePool(template, options);
      this._container.set(token, pool);
      pool.fill(options.expands);
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
      throw new Error(literal.fmt(MESSAGES.NODE_POOL.QUERY_BAD_NOT_FOUND, token));
    }

    const pool = this._container.get(token)!;
    return pool.template;
  }

  acquire<N extends IRecyclableNode>(token: string, ...args: any[]): N | undefined {
    if (!this._container.has(token)) {
      throw new Error(literal.fmt(MESSAGES.NODE_POOL.QUERY_BAD_NOT_FOUND, token));
    }

    const pool = this._container.get(token)!;
    return pool.acquire(...args) as N;
  }

  recycle(inst: IRecyclableNode): void {
    if (inst && inst.isValid && inst.token !== undefined && inst.recycledAt === 0) {
      if (!this._container.has(inst.token)) {
        throw new Error(literal.fmt(MESSAGES.NODE_POOL.QUERY_BAD_NOT_FOUND, inst.token));
      }
      this._container.get(inst.token)!.recycle(inst);
      this.logger.df(MESSAGES.NODE_POOL.RECYCLE_OK, inst.token);
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
