import { Service } from '../core';
import { IGlobalAdapter, ILogger } from '../interfaces';
import { SERVICES } from '../macro';
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
      this.resolve<ILogger>(SERVICES.LOGGER).w(`⚠ 替换全局属性: ${key}，请注意影响`);
      this._env[key] = value;
    } else {
      this._env[key] = value;
      this.resolve<ILogger>(SERVICES.LOGGER).d(`➕ 添加全局属性: ${key}`);
    }
  }

  has(key: string): boolean {
    return this._env[key] !== undefined;
  }

  unset(key: string): void {
    delete this._env[key];
    this.resolve<ILogger>(SERVICES.LOGGER).d(`➖ 删除全局属性: ${key}`);
  }
}
