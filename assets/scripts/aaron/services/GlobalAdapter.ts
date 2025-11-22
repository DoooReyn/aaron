import { Service } from "../core";
import { IGlobalAdapter } from "../interfaces";
import { Global } from "../types";

/**
 * 全局对象适配服务
 */
export class GlobalAdapter extends Service implements IGlobalAdapter {
  /** 全局对象 */
  // @ts-ignore
  private _env: Global = globalThis ?? window ?? self ?? frames ?? GameGlobal ?? {};;

  get<T>(key: string): T | undefined {
    return this._env[key] as T | undefined;
  }

  set<T>(key: string, value: T): void {
    this._env[key] = value;
  }

  has(key: string): boolean {
    return this._env[key] !== undefined;
  }

  unset(key: string): void {
    delete this._env[key];
  }
}
