/**
 * Aaron 框架
 * @description Aaron 框架基于依赖倒置原则，为应用程序提供服务装配和管理。
 * - Aaron 对外提供内置服务的访问。
 * - 开发者可以根据需要替换内置服务。
 */
import {
  IAppLauncher,
  IArgParser,
  IAscendingId,
  IAstc,
  IAudioPlayer,
  ICatcher,
  IEventBus,
  IGlobalAdapter,
  IGui,
  IHttpService,
  ILocalization,
  INodePoolContainer,
  IObjectPoolContainer,
  IPlatform,
  IProfiler,
  IRedDotContainer,
  IResCache,
  IResLoader,
  IRichTextAtlas,
  ISensitives,
  IService,
  IStoreContainer,
  ITableQuery,
  ITimer,
  ITweener,
  IWebsocket
} from '../interfaces';
import { SERVICES } from '../macro';
import { Constructor } from '../types';
import { Logger } from './Logger';
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

  /** 日志容器 */
  public readonly logger: Logger = new Logger('👑 Aaron:');

  /**
   * 服务注册回调
   * @description 只有首次注册会触发
   *
   * 开发者可以实现此方法以监控或替换服务。
   */
  public onServiceRegistered: (token: string) => void;

  /**
   * 获取服务
   * @param token 服务标识符
   * @returns 服务实例
   */
  serviceOf<T extends IService>(token: string): T {
    return ServiceContainer.Shared.get<T>(token);
  }

  /**
   * 注册服务
   * @param token 服务标识符
   * @param factory 服务工厂方法
   */
  registerServiceFactory<T extends IService>(token: string, factory: Constructor<T>): void {
    const container = ServiceContainer.Shared;
    const isRegistered = container.has(token);
    container.registerFactory(token, factory);
    if (!isRegistered) {
      this.onServiceRegistered?.(token);
    }
  }

  /**
   * 注册服务实例
   * @param token 服务标识符
   * @param instance 服务实例对象
   */
  registerServiceInstance<T extends IService>(token: string, instance: T): void {
    ServiceContainer.Shared.registerInstance(token, instance);
  }

  /** 递增ID生成服务 */
  get ascendingId() {
    return this.serviceOf<IAscendingId>(SERVICES.ASCENDING_ID);
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

  /** 应用启动器服务 */
  get appLauncher() {
    return this.serviceOf<IAppLauncher>(SERVICES.APP_LAUNCHER);
  }

  /** 富文本图集服务 */
  get richTextAtlas() {
    return this.serviceOf<IRichTextAtlas>(SERVICES.RICHTEXT_ATLAS);
  }

  /** 性能分析器服务 */
  get profiler() {
    return this.serviceOf<IProfiler>(SERVICES.PROFILER);
  }

  /** 事件总线服务 */
  get eventBus() {
    return this.serviceOf<IEventBus>(SERVICES.EVENT_BUS);
  }

  /** 本地化服务 */
  get localization() {
    return this.serviceOf<ILocalization>(SERVICES.LOCALIZATION);
  }

  /** 定时器服务 */
  get timer() {
    return this.serviceOf<ITimer>(SERVICES.TIMER);
  }

  /** 敏感词过滤服务 */
  get sensitives() {
    return this.serviceOf<ISensitives>(SERVICES.SENSITIVES);
  }

  /** 资源缓存容器服务 */
  get resCache() {
    return this.serviceOf<IResCache>(SERVICES.RES_CACHE);
  }

  /** 资源加载服务 */
  get resLoader() {
    return this.serviceOf<IResLoader>(SERVICES.RES_LOADER);
  }

  /** ASTC 解析服务 */
  get astc() {
    return this.serviceOf<IAstc>(SERVICES.ASTC);
  }

  /** 红点服务 */
  get redDot() {
    return this.serviceOf<IRedDotContainer>(SERVICES.RED_DOT);
  }

  /** 配置表服务 */
  get tableQuery() {
    return this.serviceOf<ITableQuery>(SERVICES.TABLE_QUERY);
  }

  /** GUI 服务 */
  get gui() {
    return this.serviceOf<IGui>(SERVICES.GUI);
  }

  /** 音频播放服务 */
  get audioPlayer() {
    return this.serviceOf<IAudioPlayer>(SERVICES.AUDIO_PLAYER);
  }

  /** 缓动动画服务 */
  get tweener() {
    return this.serviceOf<ITweener>(SERVICES.TWEENER);
  }

  /** HTTP 请求服务 */
  get http() {
    return this.serviceOf<IHttpService>(SERVICES.HTTP_CLIENT);
  }

  /** Websocket 服务 */
  get wsc() {
    return this.serviceOf<IWebsocket>(SERVICES.WEBSOCKET_CLIENT);
  }
}

/** Aaron 唯一单例 */
export const aaron = Aaron.Shared;
