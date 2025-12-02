import { Constructor, Node, Prefab, UITransform, Widget, instantiate } from 'cc';
import { aaron, Service } from '../core';
import {
  GuiConfig,
  IAppLauncher,
  IGui,
  IGuiAlert,
  IGuiController,
  IGuiDrawer,
  IGuiGuide,
  IGuiInstance,
  IGuiMarquee,
  IGuiPage,
  IGuiPopup,
  IGuiRootLayers,
  IGuiScreen,
  IGuiToast,
  IGuiTop,
  ILogger,
  IResCache,
  IResLoader,
} from '../interfaces';
import {
  GuiScreen,
  GuiPage,
  GuiPopup,
  GuiAlert,
  GuiToast,
  GuiDrawer,
  GuiMarquee,
  GuiGuide,
  GuiTop,
} from '../foundation';
import { SERVICES } from '../macro';
import { be, time } from '../utils';

/**
 * 视图服务
 */
export class Gui extends Service implements IGui {
  screen: IGuiScreen;
  page: IGuiPage;
  popup: IGuiPopup;
  alert: IGuiAlert;
  toast: IGuiToast;
  drawer: IGuiDrawer;
  marquee: IGuiMarquee;
  guide: IGuiGuide;
  top: IGuiTop;

  /** LRU 实例保留数量 */
  private _lruReserves: number = 3;

  /** 已关闭的视图实例 */
  private _closedInstances: Map<string, IGuiInstance> = new Map();

  /** 视图配置容器 */
  private _registry: Map<string, GuiConfig> = new Map();

  get lruReserves() {
    return this._lruReserves;
  }
  set lruReserves(size: number) {
    this._lruReserves = Math.max(1, Math.min(size | 0, 10));
  }

  initialize(): IGuiRootLayers {
    const root = this.resolve<IAppLauncher>(SERVICES.APP_LAUNCHER).root;
    this.screen = new GuiScreen('screen');
    this.page = new GuiPage('page');
    this.popup = new GuiPopup('popup');
    this.alert = new GuiAlert('alert');
    this.toast = new GuiToast('toast');
    this.drawer = new GuiDrawer('drawer');
    this.marquee = new GuiMarquee('marquee');
    this.guide = new GuiGuide('guide');
    this.top = new GuiTop('top');
    const gui = new Node('gui');
    this.createLayer(gui);
    gui.addChild(this.screen);
    gui.addChild(this.page);
    gui.addChild(this.popup);
    gui.addChild(this.alert);
    gui.addChild(this.toast);
    gui.addChild(this.drawer);
    gui.addChild(this.marquee);
    gui.addChild(this.guide);
    gui.addChild(this.top);
    root.addChild(gui);
    return {
      root: gui,
      screen: this.screen,
      page: this.page,
      popup: this.popup,
      alert: this.alert,
      toast: this.toast,
      drawer: this.drawer,
      marquee: this.marquee,
      guide: this.guide,
      top: this.top,
    };
  }

  register(config: GuiConfig): void {
    if (this._registry.has(config.token)) {
      if (this._registry.get(config.token) === config) {
        this.resolve<ILogger>(SERVICES.LOGGER).wf('📷 视图: {0} 重复注册, 已跳过', config.token);
      } else {
        this.resolve<ILogger>(SERVICES.LOGGER).wf('📷 视图: {0} 已经注册, 已替换', config.token);
        this._registry.set(config.token, config);
      }
    } else {
      this.resolve<ILogger>(SERVICES.LOGGER).df('📷 视图: {0} 已经注册', config.token);
      this._registry.set(config.token, config);
    }
  }

  registerBatch(configs: GuiConfig[]): void {
    configs.forEach((cfg) => this.register(cfg));
  }

  has(token: string) {
    return this._registry.has(token);
  }

  fetchConfig(keyOrClass: string | Constructor<IGuiController>): GuiConfig | undefined {
    if (be.isString(keyOrClass)) {
      return this._registry.get(keyOrClass as string);
    } else {
      for (const [_, cfg] of this._registry) {
        if (cfg.controller === keyOrClass) {
          return cfg;
        }
      }
      return undefined;
    }
  }

  async createInstance(parent: Node, config: GuiConfig): Promise<IGuiInstance | undefined> {
    // 先从已关闭的视图实例中获取
    if (this._closedInstances.has(config.token)) {
      const instance = this._closedInstances.get(config.token);
      instance.closeAt = 0;
      this._closedInstances.delete(config.token);
      parent.addChild(instance.node);
      this.resolve<ILogger>(SERVICES.LOGGER).df('📷 视图: {0} 从缓存创建', config.token);
      return instance;
    }

    // 如果未找到,则加载视图的预制体资源
    const prefab = await this.resolve<IResLoader>(SERVICES.RES_LOADER).load(Prefab, config);
    if (!prefab) {
      this.resolve<ILogger>(SERVICES.LOGGER).ef(
        '📷 视图: {0} <{1}> 创建实例失败，未能正确识别预制体',
        config.token,
        config.path,
      );
      return undefined;
    }

    // 实例化预制体
    const node = instantiate(prefab);
    parent.addChild(node);

    // 立即减持预制体资源引用，让预制体资源进入未使用资源队列
    this.resolve<IResCache>(SERVICES.RES_CACHE).addRef(config.path);

    // 获取控制器组件
    const controller = node.acquire(config.controller);
    this.resolve<ILogger>(SERVICES.LOGGER).df('📷 视图: {0} 从实例创建', config.token);

    return { config, node, controller, closeAt: 0 } as IGuiInstance;
  }

  closeInstance(instance: IGuiInstance): void {
    instance.node.removeFromParent();
    instance.closeAt = time.now();
    this._closedInstances.set(instance.config.token, instance);
    this.resolve<ILogger>(SERVICES.LOGGER).df('📷 视图: {0} 关闭', instance.config.token);
  }

  clearUnused() {
    const unused: IGuiInstance[] = [];
    const lru: IGuiInstance[] = [];
    const now = time.now();
    const cache = this.resolve<IResCache>(SERVICES.RES_CACHE);

    this._closedInstances.forEach((instance, token) => {
      switch (instance.config.cachePolicy) {
        case 'Expires':
          // 过期清理
          if ((instance.config.cacheExpires ??= 60_000) > 0 && instance.config.cacheExpires + instance.closeAt! < now) {
            unused.push(instance);
          }
          break;
        case 'Persistence':
          // 谨慎使用 Persistence 模式,它意味着内存不会被清理
          break;
        case 'LRU':
          // LRU
          lru.push(instance);
          break;
      }
    });

    if (lru.length > this._lruReserves) {
      // 最老的排在前面，然后取前几个超出的加入删除队列
      unused.concat(lru.sort((a, b) => b.closeAt - a.closeAt).splice(lru.length - this._lruReserves));
    }

    // 销毁视图实例
    unused.forEach((inst) => {
      inst.controller.onViewDisposed();
      inst.node.destroy();
      cache.decRef(inst.config.path, true);
      this._closedInstances.delete(inst.config.token);
    });
  }

  inspect(config: GuiConfig | string): GuiConfig | undefined {
    if (be.isString(config)) {
      // 字符串模式：直接使用 token
      const token = config as string;
      if (!this.has(token)) {
        this.resolve<ILogger>(SERVICES.LOGGER).wf('📷 视图: {0} 未注册', token);
        return undefined;
      }
      return this._registry.get(token);
    } else {
      // 配置对象模式：完整配置处理
      const cfg = config as GuiConfig;
      const token = cfg.token;
      if (!this.has(token)) {
        // 自动注册未注册的视图（推荐在应用启动时统一注册）
        this.register(cfg);
      }
      return cfg;
    }
  }

  createLayer(layer: Node): void {
    // 确保 UI 变换组件存在
    layer.acquire(UITransform);

    // 配置对齐组件
    const wid = layer.acquire(Widget);
    wid.top = wid.bottom = wid.left = wid.right = 0; // 设置边距
    wid.isAlignTop = wid.isAlignBottom = wid.isAlignLeft = wid.isAlignRight = true; // 启用四边对齐
    wid.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE; // 窗口大小变化时重新对齐
    wid.updateAlignment(); // 立即更新对齐状态
  }

  async playEnter(config: GuiConfig, node: Node) {
    if (config.enterTweenLib) {
      const [lib, args] = config.enterTweenLib;
      aaron.logger.df('📷 视图: {0} 播放进入动画 {1}', config.token, lib);
      // TODO: 集成动画库后启用
      // await aaron.tweenLib.play(node, lib, args ?? { duration: 0.3 });
    }
  }

  async playExit(config: GuiConfig, node: Node) {
    if (config.exitTweenLib) {
      const [lib, args] = config.exitTweenLib;
      aaron.logger.df('📷 视图: {0} 播放退出动画 {1}', config.token, lib);
      // TODO: 集成动画库后启用
      // await aaron.tweenLib.play(node, lib, args ?? { duration: 0.3 });
    }
  }

  async open(config: GuiConfig, params?: any) {
    switch (config.interface) {
      case 'Alert':
        await this.alert.open(config, params);
        break;
      case 'Popup':
        await this.popup.open(config, params);
        break;
      case 'Page':
        await this.page.open(config, params);
        break;
      case 'Screen':
        await this.screen.open(config, params);
        break;
      case 'Overlay':
        throw new Error('Overlay not implemented');
        switch (config.overlay) {
          case 'Drawer':
            break;
          case 'Guide':
            break;
          case 'Toast':
            break;
          case 'Marquee':
            break;
          case 'Top':
            break;
        }
        break;
    }
  }

  async close(token: string) {
    if (this._registry.has(token)) {
      const cfg = this._registry.get(token);
      switch (cfg.interface) {
        case 'Alert':
          await this.alert.close(token);
          break;
        case 'Popup':
          await this.popup.close(token);
          break;
        case 'Page':
          await this.page.close(token);
          break;
        case 'Screen':
          if (this.screen.top === token) {
            await this.screen.close(true);
          }
          break;
      }
    }
  }

  async back(): Promise<void> {
    if (this.alert.depth > 0) {
      return this.alert.back();
    } else if (this.popup.depth > 0) {
      return this.popup.back();
    } else if (this.page.depth > 0) {
      return this.page.back();
    } else {
      return this.screen.back();
    }
  }

  debugStacks(tag: string): void {
    throw new Error('Method not implemented.');
  }

  debugSnapshots(tag: string): void {
    throw new Error('Method not implemented.');
  }

  focus() {
    if (this.alert.depth > 0) {
      this.alert.focus();
    } else if (this.popup.depth > 0) {
      this.popup.focus();
    } else if (this.page.depth > 0) {
      this.page.focus();
    } else {
      this.screen.focus();
    }
  }
}
