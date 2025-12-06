import { Logger } from '../core';
import { Constructor } from '../types';

/**
 * 服务接口
 */
export interface IService {
  /** 初始化 */
  initialize(...args: any[]): void | Promise<void>;
  /**
   * 解析服务
   * @param token 服务标识符
   */
  resolve<T extends IService>(token: string): T | undefined;

  /** 日志 */
  get logger(): Logger;
}

/**
 * 服务容器接口
 */
export interface IServiceContainer {
  /**
   * 注册服务工厂方法
   * @param token 服务标识符
   * @param factory 服务工厂方法
   */
  registerFactory<T extends IService>(token: string, factory: Constructor<T>): void;
  /**
   * 注册服务实例对象
   * @param token 服务标识符
   * @param instance 服务实例对象
   */
  registerInstance<T extends IService>(token: string, instance: T): void;
  /**
   * 获取服务实例
   * @param token
   */
  get<T extends IService>(token: string): T;
  /**
   * 服务是否已注册
   * @param token 服务标识符
   * @returns 服务是否已注册
   */
  has(token: string): boolean;
  /**
   * 清除所有注册的服务
   */
  clear(): void;
  /**
   * 获取服务统计信息
   */
  get stats(): {
    /** 工厂方法数量 */
    factories: number;
    /** 实例对象数量 */
    instances: number;
    /** 已注册的服务 */
    services: string[];
  };
}
