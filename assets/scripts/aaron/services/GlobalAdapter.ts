import { Service } from '../core';
import { IGlobalAdapter } from '../interfaces';
import { MESSAGES } from '../macro';
import { Global } from '../types';

/**
 * 全局对象适配服务
 */
export class GlobalAdapter extends Service implements IGlobalAdapter {
  public readonly token: string = MESSAGES.GLOBAL_ADAPTER.CATEGORY;
  /** 全局对象 */
  // @ts-ignore
  private _env: Global = globalThis ?? window ?? self ?? frames ?? GameGlobal ?? {};

  get<T>(key: string): T | undefined {
    return this._env[key] as T | undefined;
  }

  set<T>(key: string, value: T): void {
    if (this.has(key)) {
      this.logger.wf(MESSAGES.GLOBAL_ADAPTER.REPLACE, key);
    } else {
      this.logger.df(MESSAGES.GLOBAL_ADAPTER.ADD, key);
    }
    this._env[key] = value;
  }

  has(key: string): boolean {
    return this._env[key] !== undefined;
  }

  unset(key: string): void {
    if (delete this._env[key]) {
      this.logger.df(MESSAGES.GLOBAL_ADAPTER.DELETE, key);
    }
  }
}
