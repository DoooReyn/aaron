import { Service } from '../core';
import { StoreEntry } from '../foundation';
import { IStoreContainer } from '../interfaces';
import { Dict } from '../types';

/**
 * 本地存储容器服务
 */
export class StoreContainer extends Service implements IStoreContainer {
  /** 存储项目容器 */
  private readonly __container: Map<string, StoreEntry<Dict>> = new Map();

  public register<T extends object>(alias: string, template: T) {
    if (!this.__container.has(alias)) {
      this.__container.set(alias, new StoreEntry(alias, template));
    }
  }

  public unregister(alias: string) {
    this.__container.delete(alias);
  }

  public save(alias?: string) {
    if (alias === undefined) {
      this.__container.forEach((v) => v.save());
    } else {
      this.__container.get(alias)?.save();
    }
  }

  public load(alias?: string) {
    if (alias === undefined) {
      this.__container.forEach((v) => v.load());
    } else {
      this.__container.get(alias)?.load();
    }
  }

  public itemOf<T extends object>(alias: string): StoreEntry<T> | undefined {
    return this.__container.get(alias) as StoreEntry<T> | undefined;
  }
}
