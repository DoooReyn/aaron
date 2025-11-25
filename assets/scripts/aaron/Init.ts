/**
 * Init
 * @description Init 作为 Aaron 框架的初始化入口，负责内置服务的装配。
 */
import { aaron } from './core';
import { FRAMEWORK, SERVICES, VERSION } from './macro';
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
  Profiler,
  RichTextAtlas,
  AppLauncher,
  StoreContainer,
} from './services';

/**
 * 框架初始化函数
 * 基于新的依赖倒置架构
 * @param config 初始化配置
 */
export async function init(config: ILaunchOptions): Promise<void> {
  console.log(`🚀 初始化 ${FRAMEWORK.name} v${VERSION}`);
  console.log(`📋 架构模式: ${FRAMEWORK.architecture}`);

  // 注册递增ID生成器服务
  aaron.registerServiceFactory(SERVICES.ASCENDING_ID, AscendingId);

  // 注册日志服务
  aaron.registerServiceFactory<ILogger>(SERVICES.LOGGER, Logger);
  aaron.logger.setLevel(config.logLevel);

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

  // 注册性能监视器服务
  aaron.registerServiceFactory(SERVICES.PROFILER, Profiler);
  
  // 注册富文本图集服务
  aaron.registerServiceFactory(SERVICES.RICHTEXT_ATLAS, RichTextAtlas);
  
  // 最后注册应用启动器服务
  aaron.registerServiceInstance(SERVICES.APP_LAUNCHER, new AppLauncher());
  await aaron.appLauncher.initialize();
  aaron.richTextAtlas.initialize();

  aaron.logger.i('✅ Aaron Framework 初始化完成');
  aaron.logger.i(`🚀 版本: ${VERSION}`);
  aaron.logger.i(`📋 架构: ${FRAMEWORK.architecture}`);

  return Promise.resolve();
}
