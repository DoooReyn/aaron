import { aaron, Service } from '../core';
import { IGlobalAdapter } from '../interfaces';
import { Global } from '../types';

/**
 * 全局对象适配服务
 */
export class GlobalAdapter extends Service implements IGlobalAdapter {
  /** 全局对象 */
  // @ts-ignore
  private _env: Global = globalThis ?? window ?? self ?? frames ?? GameGlobal ?? {};

  get<T>(key: string): T | undefined {
    return this._env[key] as T | undefined;
  }

  set<T>(key: string, value: T): void {
    if (this.has(key)) {
      aaron.logger.w(`⚠ 替换全局属性: ${key}，请注意影响`);
      this._env[key] = value;
    } else {
      this._env[key] = value;
      aaron.logger.d(`➕ 添加全局属性: ${key}`);
    }
  }

  has(key: string): boolean {
    return this._env[key] !== undefined;
  }

  unset(key: string): void {
    delete this._env[key];
    aaron.logger.d(`➖ 删除全局属性: ${key}`);
  }
}
