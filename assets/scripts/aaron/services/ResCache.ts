import { Asset } from 'cc';
import { Service } from '../core';
import { IResCache, ICacheEntry, ICacheOptions, ICacheStats, CacheSource, ILogger } from '../interfaces';
import { time } from '../utils';
import { SERVICES } from '../macro';

/**
 * 资源缓存容器服务
 * @description 统一管理本地和远程资源的缓存
 */
export class ResCache extends Service implements IResCache {
  /** 缓存容器 */
  private _container: Map<string, ICacheEntry> = new Map();

  /**
   * 设置缓存
   * @param options 缓存配置
   */
  set(options: ICacheOptions): void {
    const { key, asset, source, expires = 0, refCount = 0 } = options;

    if (!asset || !asset.isValid) {
      this.resolve<ILogger>(SERVICES.LOGGER).wf('缓存: 资源无效，无法缓存 {0}', key);
      return;
    }

    const now = time.now();
    const entry: ICacheEntry = {
      key,
      asset,
      source,
      expiresAt: expires > 0 ? now + expires : 0,
      refCount: refCount,
      lastAccessTime: now,
      createdAt: now,
    };

    this._container.set(key, entry);
    this.resolve<ILogger>(SERVICES.LOGGER).df('缓存: 资源{0}已缓存，{1}s后过期', key, expires / 1000);
  }

  /**
   * 获取缓存
   * @param key 资源键值
   * @returns 资源实例或 null
   */
  get<T extends Asset>(key: string): T | null {
    const entry = this._container.get(key);

    if (!entry) {
      return null;
    }

    // 检查资源是否有效
    if (!entry.asset.isValid) {
      this.resolve<ILogger>(SERVICES.LOGGER).wf('缓存: 资源已失效 {0}', key);
      this._container.delete(key);
      return null;
    }

    // 检查是否过期
    if (entry.expiresAt > 0 && entry.expiresAt < time.now()) {
      this.resolve<ILogger>(SERVICES.LOGGER).df('缓存: 资源已过期 {0}', key);
      this._container.delete(key);
      return null;
    }

    // 更新最后访问时间
    entry.lastAccessTime = time.now();

    return entry.asset as T;
  }

  /**
   * 检查缓存是否存在
   * @param key 资源键值
   * @returns 是否存在
   */
  has(key: string): boolean {
    const entry = this._container.get(key);
    if (!entry) return false;

    // 检查资源是否有效
    if (!entry.asset.isValid) {
      this._container.delete(key);
      return false;
    }

    // 检查是否过期
    if (entry.expiresAt > 0 && entry.expiresAt < time.now()) {
      this._container.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 删除缓存
   * @param key 资源键值
   * @param release 是否释放资源
   * @returns 是否删除成功
   */
  delete(key: string, release: boolean = false): boolean {
    const entry = this._container.get(key);
    if (!entry) return false;

    if (release && entry.asset.isValid) {
      entry.asset.decRef();
      this.resolve<ILogger>(SERVICES.LOGGER).df('缓存: 释放资源 {0}', key);
    }

    this._container.delete(key);
    this.resolve<ILogger>(SERVICES.LOGGER).df('缓存: 删除资源 {0}', key);

    return true;
  }

  /**
   * 增加引用计数
   * @param key 资源键值
   * @returns 当前引用计数
   */
  addRef(key: string): number {
    const entry = this._container.get(key);
    if (!entry) return 0;

    entry.refCount++;
    entry.asset.addRef();
    this.resolve<ILogger>(SERVICES.LOGGER).df('缓存: 增加引用 {0} 计数:{1}', key, entry.refCount);

    return entry.refCount;
  }

  /**
   * 减少引用计数
   * @param key 资源键值
   * @param autoRelease 引用计数为 0 时是否自动释放
   * @returns 当前引用计数
   */
  decRef(key: string, autoRelease: boolean = true): number {
    const entry = this._container.get(key);
    if (!entry) return 0;

    entry.refCount = Math.max(0, entry.refCount - 1);
    entry.asset.decRef();
    this.resolve<ILogger>(SERVICES.LOGGER).df('缓存: 减少引用 {0} 计数:{1}', key, entry.refCount);

    // 自动释放
    if (autoRelease && entry.refCount === 0) {
      this.delete(key, true);
      this.resolve<ILogger>(SERVICES.LOGGER).df('缓存: 自动释放 {0}', key);
    }

    return entry.refCount;
  }

  /**
   * 清理过期缓存
   * @returns 清理的数量
   */
  cleanup(): number {
    const now = time.now();
    let count = 0;

    for (const [key, entry] of this._container) {
      // 清理无效资源
      if (!entry.asset.isValid) {
        this._container.delete(key);
        count++;
        continue;
      }

      // 清理过期资源
      if (entry.expiresAt > 0 && entry.expiresAt < now && entry.refCount <= 0) {
        if (entry.asset.isValid) {
          entry.asset.decRef();
        }
        this._container.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.resolve<ILogger>(SERVICES.LOGGER).df('缓存: 清理过期资源 {0} 个', count);
    }

    return count;
  }

  /**
   * 清空所有缓存
   * @param release 是否释放资源
   */
  clear(release: boolean = false): void {
    if (release) {
      for (const [_, entry] of this._container) {
        if (entry.asset.isValid) {
          entry.asset.decRef();
        }
      }
    }

    const count = this._container.size;
    this._container.clear();

    if (count > 0) {
      this.resolve<ILogger>(SERVICES.LOGGER).df('缓存: 清空所有缓存 {0} 个', count);
    }
  }

  /**
   * 获取缓存统计信息
   * @returns 统计信息
   */
  getStats(): ICacheStats {
    let local = 0;
    let remote = 0;
    let permanent = 0;
    let temporary = 0;

    for (const [_, entry] of this._container) {
      if (entry.source === CacheSource.Local) {
        local++;
      } else {
        remote++;
      }

      if (entry.expiresAt === 0) {
        permanent++;
      } else {
        temporary++;
      }
    }

    return {
      total: this._container.size,
      local,
      remote,
      permanent,
      temporary,
    };
  }

  /**
   * 获取所有缓存键值
   * @param source 可选的资源来源筛选
   * @returns 键值数组
   */
  keys(source?: CacheSource): string[] {
    if (source === undefined) {
      return Array.from(this._container.keys());
    }

    const keys: string[] = [];
    for (const [key, entry] of this._container) {
      if (entry.source === source) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * 清理指定来源的缓存
   * @param source 资源来源
   * @param release 是否释放资源
   * @returns 清理的数量
   */
  clearBySource(source: CacheSource, release: boolean = false): number {
    let count = 0;

    for (const [key, entry] of this._container) {
      if (entry.source === source) {
        if (release && entry.asset.isValid) {
          entry.asset.decRef();
        }
        this._container.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.resolve<ILogger>(SERVICES.LOGGER).df('缓存: 清理 {0} 资源 {1} 个', source, count);
    }

    return count;
  }
}
