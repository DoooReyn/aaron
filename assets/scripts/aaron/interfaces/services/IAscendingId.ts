import { IService } from '../IService';

/**
 * 递增ID生成器接口
 */
export interface IAscendingId extends IService {
  /**
   * 检查是否存在指定标签的递增ID生成器
   * @param tag 生成器标签
   * @returns 是否存在
   */
  has(tag: string): boolean;
  /**
   * 创建一个新的递增ID生成器
   * @param tag 生成器标签
   * @param initial 初始值
   * @returns 递增ID
   */
  create(tag: string, initial?: number): number;
  /**
   * 获取指定标签的当前递增ID
   * @param tag 生成器标签
   * @returns 当前递增ID
   */
  current(tag: string): number;
  /**
   * 获取指定标签的下一个递增ID
   * @param tag 生成器标签
   * @returns 下一个递增ID
   */
  next(tag: string): number;
  /**
   * 重置指定标签的递增ID生成器
   * @param tag 生成器标签
   * @param initial 重置值
   */
  reset(tag: string, initial?: number): void;
}
