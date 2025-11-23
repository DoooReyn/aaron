/**
 * Init
 * @description Init 作为 Aaron 框架的初始化入口，负责内置服务的装配。
 */
import { aaron } from './core';
import { SERVICES } from './macro';
import { IGlobalAdapter, ILogger, IArgParser, ICatcher, IPlatform, ILaunchOptions } from './interfaces';
import {
  Logger,
  GlobalAdapter,
  ArgParser,
  Catcher,
  Platform,
  EventBus,
  AscendingId,
  ObjectPoolContainer,
  NodePoolContainer,
} from './services';
import { StoreContainer } from './services/StoreContainer';

/** 版本信息 */
export const VERSION = '1.1.0' as const;

/** 框架信息 */
export const FRAMEWORK_INFO = {
  name: 'Aaron Framework',
  version: VERSION,
  description: '基于 Cocos Creator 3.8 的轻量级 2D 游戏框架（依赖倒置架构）',
  author: 'Aaron Team',
  homepage: 'https://github.com/aaron-framework/aaron',
  architecture: 'Dependency Inversion Principle',
} as const;

/**
 * 框架初始化函数
 * 基于新的依赖倒置架构
 * @param config 初始化配置
 */
export async function init(config: ILaunchOptions): Promise<void> {
  console.log(`🚀 初始化 ${FRAMEWORK_INFO.name} v${VERSION}`);
  console.log(`📋 架构模式: ${FRAMEWORK_INFO.architecture}`);

  // 注册递增ID生成器服务
  aaron.registerServiceFactory(SERVICES.ASCENDING_ID, AscendingId);

  // 注册日志服务
  aaron.registerServiceFactory<ILogger>(SERVICES.LOGGER, Logger);
  config?.logLevel && aaron.logger.setLevel(config.logLevel);

  // 注册全局对象服务
  aaron.registerServiceFactory<IGlobalAdapter>(SERVICES.GLOBAL_ADAPTER, GlobalAdapter);
  aaron.globalAdapter.set('aaron', aaron);

  // 注册异常捕获服务
  const catcher = new Catcher();
  aaron.registerServiceInstance<ICatcher>(SERVICES.CATCHER, catcher);

  // 注册参数解析服务
  aaron.registerServiceFactory<IArgParser>(SERVICES.ARG_PARSER, ArgParser);
  aaron.argParser.parse(config);

  // 注册平台鉴定服务
  aaron.registerServiceFactory<IPlatform>(SERVICES.PLATFORM, Platform);

  // 注册事件总线服务
  aaron.registerServiceFactory(SERVICES.EVENT_BUS, EventBus);

  // 注册对象池容器服务
  aaron.registerServiceFactory(SERVICES.OBJECT_POOL, ObjectPoolContainer);

  // 注册节点池容器服务
  aaron.registerServiceFactory(SERVICES.NODE_POOL, NodePoolContainer);

  // 注册本地存储容器服务
  aaron.registerServiceFactory(SERVICES.STORE, StoreContainer);

  aaron.logger.i('✅ Aaron Framework 初始化完成');
  aaron.logger.i(`🚀 版本: ${VERSION}`);
  aaron.logger.i(`📋 架构: ${FRAMEWORK_INFO.architecture}`);

  return Promise.resolve();
}
