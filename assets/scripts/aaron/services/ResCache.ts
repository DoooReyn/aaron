import { Asset } from 'cc';

import { Service } from '../core';
import { CacheSource, ICacheEntry, ICacheOptions, ICacheStats, IResCache } from '../interfaces';
import { MESSAGES } from '../macro';
import { time } from '../utils';

/**
 * 资源缓存容器服务
 * @description 统一管理本地和远程资源的缓存
 */
export class ResCache extends Service implements IResCache {
  readonly token: string = MESSAGES.RES_CACHE.CATEGORY;
  /** 缓存容器 */
  private _container: Map<string, ICacheEntry> = new Map();

  /**
   * 设置缓存
   * @param options 缓存配置
   */
  set(options: ICacheOptions): void {
    const { key, asset, source, expires = 0, refCount = 0 } = options;

    if (!asset || !asset.isValid) {
      this.logger.wf(MESSAGES.RES_CACHE.CACHE_BAD, key);
      return;
    }

    const now = time.now();
    const entry: ICacheEntry = {
      key,
      asset,
      source,
      expires,
      expiresAt: expires > 0 ? now + expires : 0,
      refCount: refCount,
      lastAccessTime: now,
      createdAt: now,
    };

    this._container.set(key, entry);
    this.logger.df(MESSAGES.RES_CACHE.CACHE_OK, key, expires / 1000);
  }

  /**
   * 获取缓存
   * @param key 资源键值
   * @returns 资源实例或 null
   */
  get<T extends Asset>(key: string): T | null {
    const entry = this._container.get(key);

    if (!entry) {
      this.logger.wf(MESSAGES.RES_CACHE.ACQUIRE_BAD_NOT_CACHED, key);
      return null;
    }

    // 检查资源是否有效
    if (!entry.asset.isValid) {
      this.logger.wf(MESSAGES.RES_CACHE.ACQUIRE_BAD_INVALID, key);
      this._container.delete(key);
      return null;
    }

    // 检查是否未使用且已过期
    if (entry.refCount <= 0 && entry.expiresAt > 0 && entry.expiresAt < time.now()) {
      this.logger.wf(MESSAGES.RES_CACHE.ACQUIRE_BAD_HAS_EXPIRED, key);
      this.delete(key);
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
    if (!this._container.has(key)) return false;

    // 检查资源是否有效
    const entry = this._container.get(key);
    if (!entry.asset.isValid) {
      this._container.delete(key);
      return false;
    }

    // 检查是否未使用且已过期
    if (entry.refCount <= 0 && entry.expiresAt > 0 && entry.expiresAt < time.now()) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 删除缓存
   * @param key 资源键值
   * @returns 是否删除成功
   */
  delete(key: string): boolean {
    const entry = this._container.get(key);

    if (entry) {
      if (!entry.asset.isValid) {
        this._container.delete(key);
        this.logger.df(MESSAGES.RES_CACHE.DELETE, key);
        return true;
      }

      if (entry.refCount <= 0) {
        entry.asset.destroy();
        this._container.delete(key);
        this.logger.df(MESSAGES.RES_CACHE.DELETE, key);
        return true;
      }
    }

    return false;
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
    // entry.asset.addRef(); // 注释掉的原因是想用新的计数接管原生计数,否则原生计数为0时资源会被自动释放,不符合缓存设计
    entry.expiresAt = entry.expires > 0 ? time.now() + entry.expires : 0;
    this.logger.df(MESSAGES.RES_CACHE.ADD_REF, key, entry.refCount);

    return entry.refCount;
  }

  /**
   * 减少引用计数
   * @param key 资源键值
   * @param autoRelease 引用计数为 0 时是否自动释放
   * @returns 当前引用计数
   */
  decRef(key: string, autoRelease: boolean = false): number {
    const entry = this._container.get(key);
    if (!entry) return 0;
    if (entry.refCount <= 0) return entry.refCount;

    entry.refCount = Math.max(0, entry.refCount - 1);
    // entry.asset.decRef(); // 注释掉的原因是想用新的计数接管原生计数,否则原生计数为0时资源会被自动释放,不符合缓存设计
    this.logger.df(MESSAGES.RES_CACHE.DEC_REF, key, entry.refCount);

    // 自动释放
    if (autoRelease && entry.refCount === 0) {
      this.delete(key);
    }

    return entry.refCount;
  }

  /**
   * 清理过期缓存
   * @returns 清理的数量
   */
  clearUnused(): number {
    const now = time.now();
    let count = 0;
    let deleted: string[] = [];

    for (const [key, entry] of this._container) {
      if (!entry.asset.isValid) {
        // 清理无效资源
        this._container.delete(key);
        deleted.push(key);
        count++;
      } else if (entry.expiresAt > 0 && entry.expiresAt < now && entry.refCount <= 0) {
        // 清理过期资源
        entry.asset.decRef(true);
        this._container.delete(key);
        deleted.push(key);
        count++;
      }
    }

    if (count > 0) {
      this.logger.df(MESSAGES.RES_CACHE.CLEAN_UNUSED, count, deleted.join());
    }

    return count;
  }

  /**
   * 清空所有缓存
   * @note 清空容器并释放引用为0的资源
   */
  clear(): void {
    for (const [_, entry] of this._container) {
      if (entry.asset.isValid && entry.refCount <= 0) {
        entry.asset.destroy();
      }
    }

    const count = this._container.size;
    this._container.clear();

    if (count > 0) {
      this.logger.df(MESSAGES.RES_CACHE.CLEAN_CACHE, count);
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
   * @note 清理指定来源的缓存并释放引用为0的资源
   * @param source 资源来源
   * @returns 清理的数量
   */
  clearBySource(source: CacheSource): number {
    let count = 0;

    for (const [key, entry] of this._container) {
      if (entry.source === source) {
        if (entry.asset.isValid && entry.refCount <= 0) {
          entry.asset.destroy();
        }
        this._container.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.logger.df('🗑️ 缓存: 清理 {0} 资源 {1} 个', source, count);
    }

    return count;
  }
}
