import { isValid, Node } from 'cc';
import { aaron } from '../core';

/**
 * 分组辅助工具
 */
export class Group<T extends object = any> {
  /** 分组标识 */
  public readonly id: string;

  /** 对象列表 */
  protected _list: T[] = [];

  /** 对象过滤器 */
  public filter: undefined | ((d: T) => boolean);

  constructor() {
    this.id = 'group_' + aaron.ascendingId.next('group');
  }

  /**
   * 执行统一动作
   * @param action 动作
   */
  public with(action: (d: T) => void) {
    for (let i = 0; i < this._list.length; i++) {
      if (this.filter && !this.filter(this._list[i])) {
        this._list.splice(i, 1);
        i--;
        continue;
      }
      action(this._list[i]);
    }
  }

  /**
   * 添加成员
   * @param member 成员
   */
  public add(member: T) {
    if (this._list.indexOf(member) == -1) {
      this._list.push(member);
    }
  }

  /**
   * 批量添加成员
   * @param members 成员列表
   */
  public addBatch(...members: T[]) {
    members.forEach(this.add, this);
  }

  /**
   * 移除成员
   * @param member 成员
   */
  public del(member: T) {
    const at = this._list.indexOf(member);
    if (at > -1) this._list.splice(at, 1);
  }

  /**
   * 批量移除成员
   * @param items 成员列表
   */
  public delBatch(items: T[]) {
    items.forEach(this.del, this);
  }

  /**
   * 移除所有成员
   */
  public clear() {
    this._list.length = 0;
  }

  /**
   * 成员数量
   */
  public get size() {
    return this._list.length;
  }
}

/**
 * 节点分组辅助工具
 */
export class NodeGroup extends Group<Node> {
  constructor() {
    super();
    this.filter = isValid;
  }
}
