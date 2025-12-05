import { Constructor } from '../../../types';
import { IService } from '../../IService';
import { IRecyclableObject, IRecyclableOptions } from './IRecyclable';

/**
 * 对象池条目接口
 */
export interface IObjectEntry extends IRecyclableObject {
  /** 是否已初始化 */
  get initialized(): boolean;
  /** 是否已销毁 */
  get destroyed(): boolean;
  /**
   * 自动初始化
   * @warn 请勿手动调用
   * @param args 入参
   */
  initialize(...args: any[]): void;
  /**
   * 自动回收
   * @warn 请勿手动调用
   * @returns 回收结果
   */
  recycle(): boolean;
  /** 重置 */
  reset(): void;
  /**
   * 初始化回调
   * 
   * 可以在此处执行自定义操作
   * @param args 入参
   */
  onInitialize(...args: any[]): void;
  /**
   * 回收回调
   * 
   * 可以在此处执行自定义操作
   */
  onRecycled(): void;
}

/**
 * 对象池接口
 */
export interface IObjectPool<T extends IObjectEntry> {
  /** 对象池条目构造 */
  readonly construct: Constructor<T>;
  /** 对象池条目配置 */
  readonly options: IRecyclableOptions;
  /** 对象池标识 */
  get token(): string;
  /** 对象池容量 */
  get capacity(): number;
  /** 对象过期时间 */
  get expires(): number;
  /** 当前条目数量 */
  get size(): number;
  /**
   * 填充条目
   * @param n 目标数量
   * @returns
   */
  fill(n: number): void;
  /**
   * 取出条目
   * @param args 入参
   * @returns 实例条目
   */
  acquire(...args: any[]): T;
  /**
   * 回收条目
   * @param instance 条目实例
   */
  recycle(instance: T): void;
  /** 检测过期条目并删除 */
  clearUnused(): void;
  /** 清空条目 */
  clear(): void;
}

/**
 * 对象池容器服务接口
 */
export interface IObjectPoolContainer extends IService {
  /**
   * 注册对象池
   * @param cls 对象池条目构造
   * @param options 回收配置
   * @returns
   */
  register(cls: Constructor<IObjectEntry>, options: IRecyclableOptions): void;
  /**
   * 注销对象池
   * @param cls 对象池条目构造
   * @returns
   */
  unregister(cls: Constructor<IObjectEntry> | string): void;
  /**
   * 检查对象池是否存在
   * @param cls 对象池条目构造
   * @returns
   */
  has(cls: Constructor<IObjectEntry> | string): boolean;
  /**
   * 获取对象池
   * @param cls 对象池条目构造
   * @returns
   */
  poolOf<T extends IObjectEntry>(cls: Constructor<T> | string): IObjectPool<T>;
  /**
   * 获取对象池条目实例
   * @param cls 对象池条目构造
   * @param args 实例化参数
   * @returns
   */
  acquire<T extends IObjectEntry>(cls: Constructor<T> | string, ...args: any[]): T | null;
  /**
   * 回收对象池条目实例
   * @param instance 对象池条目实例
   */
  recycle<T extends IObjectEntry>(instance: T): void;
  /**
   * 清理未使用对象
   */
  clearUnused(): void;
  /**
   * 清空所有对象池
   */
  clear(): void;
}