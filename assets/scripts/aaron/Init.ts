/**
 * Init
 * @description Init 作为 Aaron 框架的初始化入口，负责内置服务的装配。
 */
import { aaron } from './core';
import { FRAMEWORK, OBJECT_POOL, SERVICES, TIME_SEC, VERSION } from './macro';
import {
  IGlobalAdapter,
  ILogger,
  IArgParser,
  ICatcher,
  IPlatform,
  IPartialLaunchOptions,
  IEventBus,
  IObjectPoolContainer,
  INodePoolContainer,
  IStoreContainer,
  ILocalization,
  IProfiler,
  IRichTextAtlas,
  IAscendingId,
  ITimer,
  ISensitives,
  IResCache,
  IResLoader,
  IAstc,
  IRedDotContainer,
  ITableQuery,
} from './interfaces';
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
  Localization,
  Timer,
  Sensitives,
  ResCache,
  ResLoader,
  Astc,
  RedDotContainer,
  TableQuery,
} from './services';
import { Option, Trigger, Counter, Model } from './foundation';

/**
 * 框架初始化函数
 * 基于新的依赖倒置架构
 * @param args 启动参数
 */
export async function init(args: IPartialLaunchOptions): Promise<void> {
  console.log(`🚀 初始化 ${FRAMEWORK.name} v${VERSION}`);
  console.log(`📋 架构模式: ${FRAMEWORK.architecture}`);

  // 注册递增ID生成器服务
  aaron.registerServiceFactory<IAscendingId>(SERVICES.ASCENDING_ID, AscendingId);

  // 注册日志服务
  aaron.registerServiceFactory<ILogger>(SERVICES.LOGGER, Logger);
  aaron.logger.setLevel(args.logLevel);

  // 注册全局对象服务
  aaron.registerServiceFactory<IGlobalAdapter>(SERVICES.GLOBAL_ADAPTER, GlobalAdapter);
  aaron.globalAdapter.set('aaron', aaron);

  // 注册异常捕获服务
  aaron.registerServiceInstance<ICatcher>(SERVICES.CATCHER, new Catcher());

  // 注册参数解析服务
  aaron.registerServiceFactory<IArgParser>(SERVICES.ARG_PARSER, ArgParser);

  // 注册平台鉴定服务
  aaron.registerServiceFactory<IPlatform>(SERVICES.PLATFORM, Platform);

  // 注册事件总线服务
  aaron.registerServiceFactory<IEventBus>(SERVICES.EVENT_BUS, EventBus);

  // 注册对象池容器服务
  aaron.registerServiceFactory<IObjectPoolContainer>(SERVICES.OBJECT_POOL, ObjectPoolContainer);

  // 注册节点池容器服务
  aaron.registerServiceFactory<INodePoolContainer>(SERVICES.NODE_POOL, NodePoolContainer);

  // 注册本地存储容器服务
  aaron.registerServiceFactory<IStoreContainer>(SERVICES.STORE, StoreContainer);

  // 注册敏感词过滤服务
  aaron.registerServiceFactory<ISensitives>(SERVICES.SENSITIVES, Sensitives);

  // 注册本地化服务
  aaron.registerServiceFactory<ILocalization>(SERVICES.LOCALIZATION, Localization);

  // 注册性能监视器服务
  aaron.registerServiceFactory<IProfiler>(SERVICES.PROFILER, Profiler);

  // 注册定时器服务
  aaron.registerServiceFactory<ITimer>(SERVICES.TIMER, Timer);

  // 注册富文本图集服务
  aaron.registerServiceFactory<IRichTextAtlas>(SERVICES.RICHTEXT_ATLAS, RichTextAtlas);

  // 注册 ASTC 解析服务
  aaron.registerServiceFactory<IAstc>(SERVICES.ASTC, Astc);

  // 注册资源缓存容器服务
  aaron.registerServiceFactory<IResCache>(SERVICES.RES_CACHE, ResCache);

  // 注册资源加载服务
  aaron.registerServiceFactory<IResLoader>(SERVICES.RES_LOADER, ResLoader);

  // 注册红点服务
  aaron.registerServiceFactory<IRedDotContainer>(SERVICES.RED_DOT, RedDotContainer);

  // 注册配置表服务
  aaron.registerServiceFactory<ITableQuery>(SERVICES.TABLE_QUERY, TableQuery);

  // 注册对象池可回收配置
  aaron.objectPool.register(Model, OBJECT_POOL.MODEL);
  aaron.objectPool.register(Option, OBJECT_POOL.OPTION);
  aaron.objectPool.register(Trigger, OBJECT_POOL.TRIGGER);
  aaron.objectPool.register(Counter, OBJECT_POOL.COUNTER);

  // 解析启动参数
  aaron.argParser.parse(args);

  // 最后注册应用启动器服务
  aaron.registerServiceInstance(SERVICES.APP_LAUNCHER, new AppLauncher());

  // 按需初始化
  await aaron.appLauncher.initialize();
  aaron.astc.initialize();
  aaron.localization.initialize(
    args.languages && args.languages.length > 0 ? { language: args.languages[0], supported: args.languages } : {}
  );
  aaron.richTextAtlas.initialize();

  // 启动回收定时器
  aaron.timer.recycle.loop(
    TIME_SEC.MINUTE,
    function () {
      aaron.resCache.clearUnused();
      aaron.objectPool.clearUnused();
      aaron.nodePool.clearUnused();
      aaron.richTextAtlas.clearUnused();
    },
    this
  );

  aaron.logger.i('✅ Aaron Framework 初始化完成');
  aaron.logger.i(`🚀 版本: ${VERSION}`);
  aaron.logger.i(`📋 架构: ${FRAMEWORK.architecture}`);

  return Promise.resolve();
}
