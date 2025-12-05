import { IService, IServiceContainer } from '../interfaces';
import { MESSAGES } from '../macro';
import { Constructor } from '../types';
import { literal } from '../utils';
import { Logger } from './Logger';

/**
 * 服务容器
 */
export class ServiceContainer implements IServiceContainer {
  /** 服务容器共享单例 */
  static get Shared(): ServiceContainer {
    // @ts-ignore
    return (ServiceContainer._instance ??= new ServiceContainer());
  }

  /** 工厂方法容器 */
  private _factories: Map<string, Constructor<IService>> = new Map();
  /** 实例方法容器 */
  private _instances: Map<string, IService> = new Map();
  /** 日志容器 */
  private _logger: Logger = new Logger(MESSAGES.SERVICE.CATEGORY);

  registerFactory<T extends IService>(token: string, factory: Constructor<T>): void {
    if (this._factories.has(token)) {
      this._logger.wf(MESSAGES.SERVICE.FACTORY_EXISTED, token);
    }
    this._factories.set(token, factory);
    this._logger.df(MESSAGES.SERVICE.FACTORY_REGISTERED, token);
  }

  registerInstance<T extends IService>(token: string, instance: T): void {
    if (this._instances.has(token)) {
      this._logger.wf(MESSAGES.SERVICE.INSTANCE_EXISTED, token);
    }
    this._instances.set(token, instance);
    this._logger.df(MESSAGES.SERVICE.INSTANCE_REGISTERED, token);
  }

  get<T extends IService>(token: string): T {
    // 首先检查是否有预注册的实例
    if (this._instances.has(token)) {
      // 如果有实例，则直接取实例
      return this._instances.get(token) as T;
    }

    // 检查是否有工厂方法
    const factory = this._factories.get(token);
    if (factory) {
      // 如果有工厂方法，则使用工厂方法创建实例，并添加到实例容器中
      const instance = new factory();
      this._instances.set(token, instance);
      this._logger.df(MESSAGES.SERVICE.CREATE_INSTANCE, token);
      return instance as T;
    }

    // 报错
    throw new Error(literal.fmt(MESSAGES.SERVICE.NOT_REGISTERED, token));
  }

  has(token: string): boolean {
    return this._factories.has(token) || this._instances.has(token);
  }

  clear(): void {
    this._factories.clear();
    this._instances.clear();
  }

  /**
   * 获取服务统计信息
   */
  get stats() {
    return {
      factories: this._factories.size,
      instances: this._instances.size,
      services: [...Array.from(this._factories.keys()), ...Array.from(this._instances.keys())],
    };
  }
}

/**
 * 服务基类
 */
export abstract class Service implements IService {
  /** 服务标识 */
  public abstract readonly token: string;

  /** 日志 */
  public get logger(): Logger {
    return (this[Symbol.for('logger')] ??= new Logger(this.token));
  }

  /** 初始化 */
  public initialize(...args: any[]): void {}

  /** 获取服务 */
  public resolve<T extends IService>(token: string): T | undefined {
    return (this[Symbol.for('_service#' + token)] ??= ServiceContainer.Shared.get<T>(token) as T | undefined);
  }
}
