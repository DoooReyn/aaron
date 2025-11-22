import { Service } from '../../core';

/**
 * 递增ID生成器
 */
export class AscendingId extends Service {
  /** 递增ID容器 */
  private __container: Map<string, number> = new Map();

  create(tag: string, initial: number = 0) {
    if (!this.has(tag)) {
      this.__container.set(tag, initial);
    }
    return this.__container.get(tag)!;
  }

  has(tag: string) {
    return this.__container.has(tag);
  }

  current(tag: string) {
    return this.create(tag)!;
  }

  next(tag: string) {
    const current = this.current(tag);
    const next = current + 1;
    this.__container.set(tag, next);
    return next;
  }

  reset(tag: string, initial: number = 0) {
    this.__container.set(tag, initial);
  }
}
