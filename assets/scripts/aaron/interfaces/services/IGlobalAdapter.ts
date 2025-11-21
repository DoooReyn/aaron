import { IService } from "../../core";

/**
 * 全局对象适配接口
 */
export interface IGlobalAdapter extends IService {
  /** 
   * 获取全局对象
   * @param key 键
   * @returns 值
   */
  get<T>(key: string): T | undefined;
  /**
   * 设置全局对象
   * @param key 键
   * @param value 值
   */
  set<T>(key: string, value: T): void;
  /**
   * 是否存在全局对学校
   * @param key 键
   */
  has(key: string): boolean;
  /**
   * 删除全局对象
   * @param key 键
   * @warning 此操作不可逆，请谨慎使用
   */
  unset(key: string): void;
}
