/**
 * Aaron 框架
 *
 * 基于依赖倒置原则的应用程序核心，负责服务装配和管理
 */
import {
  IArgParser,
  ICatcher,
  IGlobalAdapter,
  ILogger,
  INodePoolContainer,
  IObjectPoolContainer,
  IPlatform,
  IStoreContainer,
} from '../interfaces';
import { SERVICES } from '../macro';
import { ServiceContainer } from './ServiceContainer';

/**
 * Aaron 框架
 */
export class Aaron {
  /** 共享单例 */
  public static get Shared(): Aaron {
    // @ts-ignore
    return (Aaron._instance ??= new Aaron());
  }

  /**
   * 获取服务
   * @param token 服务标识符
   * @returns 服务实例
   */
  serviceOf<T>(token: string): T {
    return ServiceContainer.Shared.get<T>(token);
  }

  /**
   * 注册服务
   * @param token 服务标识符
   * @param factory 服务工厂方法
   */
  registerServiceFactory<T>(token: string, factory: () => T): void {
    ServiceContainer.Shared.registerFactory(token, factory);
  }

  /**
   * 注册服务实例
   * @param token 服务标识符
   * @param instance 服务实例对象
   */
  registerServiceInstance<T>(token: string, instance: T): void {
    ServiceContainer.Shared.registerInstance(token, instance);
  }

  /** 日志服务 */
  get logger() {
    return this.serviceOf<ILogger>(SERVICES.LOGGER);
  }

  /** 全局对象适配服务 */
  get globalAdapter() {
    return this.serviceOf<IGlobalAdapter>(SERVICES.GLOBAL_ADAPTER);
  }

  /** 参数解析服务 */
  get argParser() {
    return this.serviceOf<IArgParser>(SERVICES.ARG_PARSER);
  }

  /** 平台鉴定服务 */
  get platform() {
    return this.serviceOf<IPlatform>(SERVICES.PLATFORM);
  }

  /** 异常捕获服务 */
  get catcher() {
    return this.serviceOf<ICatcher>(SERVICES.CATCHER);
  }

  /** 对象池容器服务 */
  get objectPool() {
    return this.serviceOf<IObjectPoolContainer>(SERVICES.OBJECT_POOL);
  }

  /** 节点池容器服务 */
  get nodePool() {
    return this.serviceOf<INodePoolContainer>(SERVICES.NODE_POOL);
  }

  /** 本地存储容器服务 */
  get store() {
    return this.serviceOf<IStoreContainer>(SERVICES.STORE);
  }
}

export const aaron = Aaron.Shared;