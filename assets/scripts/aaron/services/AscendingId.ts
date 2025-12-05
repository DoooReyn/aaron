import { Service } from '../core';
import { MESSAGES } from '../macro';

/**
 * 递增ID生成器
 */
export class AscendingId extends Service {
  readonly token: string = MESSAGES.ASCENDING_ID.CATEGORY;

  /** 递增ID容器 */
  private _container: Map<string, number> = new Map();

  create(tag: string, initial: number = 0) {
    if (!this.has(tag)) {
      this._container.set(tag, initial);
      this.logger.df(MESSAGES.ASCENDING_ID.CREATED, );
    }
    return this._container.get(tag)!;
  }

  has(tag: string) {
    return this._container.has(tag);
  }

  current(tag: string) {
    return this.create(tag)!;
  }

  next(tag: string) {
    const current = this.current(tag);
    const next = current + 1;
    this._container.set(tag, next);
    return next;
  }

  reset(tag: string, initial: number = 0) {
    this._container.set(tag, initial);
  }
}
