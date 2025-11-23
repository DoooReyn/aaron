import { Constructor } from "../types";

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

  registerFactory<T extends IService>(token: string, factory: Constructor<T>): void {
    if (this._factories.has(token)) {
      console.warn(`⚠ 服务 '${token}' 已存在，将被覆盖`);
    }
    this._factories.set(token, factory);
    console.log(`✅ 注册服务工厂: ${token}`);
  }

  registerInstance<T extends IService>(token: string, instance: T): void {
    if (this._instances.has(token)) {
      console.warn(`⚠ 服务实例 '${token}' 已存在，将被覆盖`);
    }
    this._instances.set(token, instance);
    console.log(`✅ 注册服务实例: ${token}`);
  }

  get<T extends IService>(token: string): T {
    // 首先检查是否有预注册的实例
    if (this._instances.has(token)) {
      return this._instances.get(token) as T;
    }

    // 检查是否有工厂函数
    const factory = this._factories.get(token);
    if (!factory) {
      throw new Error(`服务 '${token}' 未注册`);
    }

    // 创建实例
    const instance = new factory();
    this._instances.set(token, instance);
    console.log(`🔧 创建服务实例: ${token}`);
    return instance as T;
  }

  has(token: string): boolean {
    return this._factories.has(token) || this._instances.has(token);
  }

  clear(): void {
    this._factories.clear();
    this._instances.clear();
    console.log(`🧹 清除所有服务`);
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

/** 服务基类接口 */
export interface IService {
  /**
   * 解析服务
   * @param token 服务标识符
   */
  resolve<T extends IService>(token: string): T | undefined;
}

/**
 * 服务基类
 */
export class Service {
  resolve<T extends IService>(token: string): T | undefined {
    return ServiceContainer.Shared.get<T>(token) as T | undefined;
  }
}
