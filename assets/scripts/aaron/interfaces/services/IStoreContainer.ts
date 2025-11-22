import { IService } from '../../core';
import { StoreEntry } from '../../foundation';
import { Dict } from '../../types';

/**
 * 本地存储容器服务接口
 */
export interface IStoreContainer extends IService {
  /**
   * 注册数据模板
   * @param alias 别名
   * @param template 模板
   */
  register<T extends Dict>(alias: string, template: T): void;

  /**
   * 注销数据模板
   * @param alias 别名
   */
  unregister(alias: string): void;

  /**
   * 保存存储项数据
   * @param alias 别名
   * @description 不传入 alias 时，保存所有存储项数据
   */
  save(alias?: string): void;

  /**
   * 加载存储项数据
   * @param alias 别名
   * @description 不传入 alias 时，加载所有存储项数据
   */
  load(alias?: string): void;

  /**
   * 获取存储项
   * @param alias 别名
   */
  itemOf<T extends Dict>(alias: string): StoreEntry<T> | undefined;
}
