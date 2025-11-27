import { Asset } from 'cc';
import { IService } from '../IService';

/**
 * 缓存资源来源
 */
export enum CacheSource {
  /** 未知来源 */
  Unknown = 'unknown',
  /** 本地资源 */
  Local = 'local',
  /** 远程资源 */
  Remote = 'remote',
}

/**
 * 缓存项配置
 */
export interface ICacheOptions {
  /** 资源键值 */
  key: string;
  /** 资源实例 */
  asset: Asset;
  /** 资源来源 */
  source: CacheSource;
  /** 过期时间（毫秒），0 表示永不过期 */
  expires?: number;
  /** 引用计数 */
  refCount?: number;
}

/**
 * 缓存项
 */
export interface ICacheEntry {
  /** 资源键值 */
  key: string;
  /** 资源实例 */
  asset: Asset;
  /** 资源来源 */
  source: CacheSource;
  /** 过期时间戳（毫秒） */
  expiresAt: number;
  /** 引用计数 */
  refCount: number;
  /** 最后访问时间 */
  lastAccessTime: number;
  /** 创建时间 */
  createdAt: number;
}

/**
 * 缓存统计信息
 */
export interface ICacheStats {
  /** 总缓存数量 */
  total: number;
  /** 本地资源数量 */
  local: number;
  /** 远程资源数量 */
  remote: number;
  /** 永久缓存数量 */
  permanent: number;
  /** 临时缓存数量 */
  temporary: number;
}

/**
 * 资源缓存容器服务接口
 */
export interface IResCache extends IService {
  /**
   * 设置缓存
   * @param options 缓存配置
   */
  set(options: ICacheOptions): void;

  /**
   * 获取缓存
   * @param key 资源键值
   * @returns 资源实例或 null
   */
  get<T extends Asset>(key: string): T | null;

  /**
   * 检查缓存是否存在
   * @param key 资源键值
   * @returns 是否存在
   */
  has(key: string): boolean;

  /**
   * 删除缓存
   * @param key 资源键值
   * @param release 是否释放资源
   * @returns 是否删除成功
   */
  delete(key: string, release?: boolean): boolean;

  /**
   * 增加引用计数
   * @param key 资源键值
   * @returns 当前引用计数
   */
  addRef(key: string): number;

  /**
   * 减少引用计数
   * @param key 资源键值
   * @param autoRelease 引用计数为 0 时是否自动释放
   * @returns 当前引用计数
   */
  decRef(key: string, autoRelease?: boolean): number;

  /**
   * 清理过期缓存
   * @returns 清理的数量
   */
  clearUnused(): number;

  /**
   * 清空所有缓存
   * @param release 是否释放资源
   */
  clear(release?: boolean): void;

  /**
   * 获取缓存统计信息
   * @returns 统计信息
   */
  getStats(): ICacheStats;

  /**
   * 获取所有缓存键值
   * @param source 可选的资源来源筛选
   * @returns 键值数组
   */
  keys(source?: CacheSource): string[];

  /**
   * 清理指定来源的缓存
   * @param source 资源来源
   * @param release 是否释放资源
   * @returns 清理的数量
   */
  clearBySource(source: CacheSource, release?: boolean): number;
}
