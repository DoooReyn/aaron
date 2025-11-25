import { IObjectEntry } from "./services";

/**
 * 触发器接口
 */
export interface ITrigger extends IObjectEntry {
  /**
   * 是否有效
   */
  get isValid(): boolean;
  /**
   * 比较触发器是否一致
   * @param trigger 触发器
   * @returns
   */
  equals(trigger: ITrigger): boolean;
  /**
   * 比较触发器是否一致
   * @param fn 回调方法
   * @param context 回调上下文
   * @returns
   */
  equalsWith(fn: Function, context: any): boolean;
  /**
   * 运行触发器
   */
  run(): void;
  /**
   * 运行触发器
   * @param args 额外入参（插入到原始入参之前）
   */
  runWith(...args: any[]): void;
}

/**
 * 触发器容器接口
 */
export interface ITriggers {
  /**
   * 清空触发器
   */
  clear(): void;
  /**
   * 添加触发器
   * @param fn 回调方法
   * @param context 回调上下文
   * @param once 是否一次性
   * @param args 回调入参
   */
  add(fn: Function, context?: any, once?: boolean, ...args: any[]): void;
  /**
   * 移除触发器
   * @param fn 回调方法
   * @param context 回调上下文
   */
  delWith(fn: Function, context?: any): void;
  /**
   * 移除触发器
   * @param trigger 触发器
   */
  del(trigger: ITrigger): void;
  /**
   * 运行触发器
   */
  run(): void;
  /**
   * 运行触发器
   * @param args 额外入参（插入到原始入参之前）
   */
  runWith(...args: any[]): void;
}
