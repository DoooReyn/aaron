import { IService } from '../IService';
import { StoreEntry } from '../../foundation';
import { Dict } from '../../types';

/**
 * 本地存储条目调制解调器
 */
export interface IStoreModem {
  /**
   * 包装存储条目标识
   * @param token 存储条目标识
   * @returns 包装完成的存储条目标识
   */
  makeKey(token: string): string;
  /**
   * 压制存储条目数据
   * @param data 存储条目数据（对象）
   * @returns 压制完成的存储条目数据（字符串）
   */
  encode<T extends Dict>(data: T): string;
  /**
   * 解析存储条目数据
   * @param data 存储条目数据（字符串）
   * @returns 解析完成的存储条目数据（对象）
   */
  decode<T extends Dict>(data: string): T | undefined;
}

/**
 * 本地存储容器服务接口
 */
export interface IStoreContainer extends IService {
  /** 存储条目调制解调器 */
  readonly modem: IStoreModem;
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
