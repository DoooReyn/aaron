import { Aaron } from './core';
import { SERVICES } from './macro';
import { IGlobalAdapter, ILogger, LogLevel, IArgParser, ICatcher, IPlatform } from './interfaces';
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
export async function init(config?: { logLevel?: LogLevel }): Promise<void> {
  console.log(`🚀 初始化 ${FRAMEWORK_INFO.name} v${VERSION}`);
  console.log(`📋 架构模式: ${FRAMEWORK_INFO.architecture}`);

  // 构建配置
  config ??= {};
  config.logLevel ??= LogLevel.INFO;

  // 1. 获取框架入口单例
  const aaron = Aaron.Shared;

  // 2. 注册内置服务

  // 注册递增ID生成器服务
  const ascendingId = new AscendingId();
  aaron.registerServiceInstance(SERVICES.ASCENDING_ID, ascendingId);

  // 注册日志服务
  const logger = new Logger('Aaron');
  aaron.registerServiceInstance<ILogger>(SERVICES.LOGGER, logger);
  config?.logLevel && logger.setLevel(config.logLevel);

  // 注册全局对象服务（必须在使用前注册）
  const globalAdapter = new GlobalAdapter();
  aaron.registerServiceInstance<IGlobalAdapter>(SERVICES.GLOBAL_ADAPTER, globalAdapter);
  globalAdapter.set('aaron', aaron);

  // 注册异常捕获服务
  const catcher = new Catcher();
  aaron.registerServiceInstance<ICatcher>(SERVICES.CATCHER, catcher);

  // 注册参数解析服务
  const argParser = new ArgParser();
  aaron.registerServiceInstance<IArgParser>(SERVICES.ARG_PARSER, argParser);
  argParser.parse(config);

  // 注册平台鉴定服务
  const platform = new Platform();
  aaron.registerServiceInstance<IPlatform>(SERVICES.PLATFORM, platform);

  // 注册事件总线服务
  const eventBus = new EventBus();
  aaron.registerServiceInstance(SERVICES.EVENT_BUS, eventBus);

  // 注册对象池容器服务
  const ObjectPool = new ObjectPoolContainer();
  aaron.registerServiceInstance(SERVICES.OBJECT_POOL, ObjectPool);

  // 注册节点池容器服务
  const nodePool = new NodePoolContainer();
  aaron.registerServiceInstance(SERVICES.NODE_POOL, nodePool);

  logger.i('✅ Aaron Framework 初始化完成');
  logger.i(`🚀 版本: ${VERSION}`);
  logger.i(`📋 架构: ${FRAMEWORK_INFO.architecture}`);

  return Promise.resolve();
}
