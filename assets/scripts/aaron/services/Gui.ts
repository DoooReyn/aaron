import { instantiate, Constructor, Node, Prefab, UITransform, Widget } from 'cc';

import { aaron, Service } from '../core';
import {
  GuiAlert,
  GuiDrawer,
  GuiGuide,
  GuiMarquee,
  GuiPage,
  GuiPopup,
  GuiScreen,
  GuiToast,
  GuiTop
} from '../foundation';
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
  IGuiScreen,
  IGuiToast,
  IGuiTop,
  IResCache,
  IResLoader
} from '../interfaces';
import { MESSAGES, SERVICES } from '../macro';
import { be, time } from '../utils';

/**
 * 视图服务
 */
export class Gui extends Service implements IGui {
  readonly token: string = MESSAGES.GUI.CATEGORY;

  screen: IGuiScreen;
  page: IGuiPage;
  popup: IGuiPopup;
  alert: IGuiAlert;
  toast: IGuiToast;
  drawer: IGuiDrawer;
  marquee: IGuiMarquee;
  guide: IGuiGuide;
  top: IGuiTop;

  /** 缓存的服务引用 */
  private _resLoader!: IResLoader;
  private _resCache!: IResCache;

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

  initialize() {
    // 缓存常用服务引用
    this._resLoader = this.resolve<IResLoader>(SERVICES.RES_LOADER);
    this._resCache = this.resolve<IResCache>(SERVICES.RES_CACHE);

    // 场景根节点
    const root = this.resolve<IAppLauncher>(SERVICES.APP_LAUNCHER).root;

    // 创建并添加 GUI 根节点
    const gui = new Node('gui');
    this.createLayer(gui);
    root.addChild(gui);

    // 创建并添加 GUI 分层
    this.screen = new GuiScreen('screen');
    this.page = new GuiPage('page');
    this.popup = new GuiPopup('popup');
    this.alert = new GuiAlert('alert');
    this.toast = new GuiToast('toast');
    this.drawer = new GuiDrawer('drawer');
    this.marquee = new GuiMarquee('marquee');
    this.guide = new GuiGuide('guide');
    this.top = new GuiTop('top');
    gui.addChild(this.screen);
    gui.addChild(this.page);
    gui.addChild(this.popup);
    gui.addChild(this.alert);
    gui.addChild(this.toast);
    gui.addChild(this.drawer);
    gui.addChild(this.marquee);
    gui.addChild(this.guide);
    gui.addChild(this.top);
  }

  register(config: GuiConfig): void {
    if (this._registry.has(config.token)) {
      if (this._registry.get(config.token) === config) {
        this.logViewRegister('duplicate', config.token);
      } else {
        this.logViewRegister('replaced', config.token);
        this._registry.set(config.token, config);
      }
    } else {
      this.logViewRegister('new', config.token);
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
    // 参数验证
    if (keyOrClass === null || keyOrClass === undefined) {
      this.logger.w(MESSAGES.GUI.FETCH_CONFIG_INVALID);
      return undefined;
    } else if (be.isString(keyOrClass)) {
      return this._registry.get(keyOrClass as string);
    } else if (be.isFunction(keyOrClass)) {
      for (const [_, cfg] of this._registry) {
        if (cfg.controller === keyOrClass) {
          return cfg;
        }
      }
      return undefined;
    } else {
      this.logger.wf(MESSAGES.GUI.FETCH_CONFIG_TYPE_UNSUPPORTED, typeof keyOrClass);
    }
  }

  async createInstance(parent: Node, config: GuiConfig): Promise<IGuiInstance | undefined> {
    // 使用验证方法
    if (!this.validateParentNode(parent, config.token)) {
      return undefined;
    }

    if (!this.validateConfig(config)) {
      return undefined;
    }

    // 先从已关闭的视图实例中获取
    if (this._closedInstances.has(config.token)) {
      const instance = this._closedInstances.get(config.token);
      instance.closeAt = 0;
      this._closedInstances.delete(config.token);
      parent.addChild(instance.node);
      this.logViewOperation('cached', config.token);
      return instance;
    }

    // 如果未找到,则加载视图的预制体资源
    const prefab = await this._resLoader.load(Prefab, config);
    if (!prefab) {
      this.logger.ef(MESSAGES.GUI.CREATE_PREFAB_INVALID, config.token, config.path);
      return undefined;
    }

    // 实例化预制体
    const node = instantiate(prefab);
    parent.addChild(node);

    // 立即减持预制体资源引用，让预制体资源进入未使用资源队列
    this._resCache.addRef(config.path);

    // 获取控制器组件
    const controller = node.acquire(config.controller);
    this.logViewOperation('created', config.token);

    return { config, node, controller, closeAt: 0 } as IGuiInstance;
  }

  closeInstance(inst: IGuiInstance): void {
    inst.node.removeFromParent();
    inst.closeAt = time.now();
    this.logViewOperation('closed', inst.config.token);

    if (inst.config.cachePolicy === 'DestroyImmediately') {
      // 立即销毁
      inst.controller.onViewDisposed();
      inst.node.destroy();
      this._resCache.decRef(inst.config.path, true);
    } else {
      // 走缓存方式
      this._closedInstances.set(inst.config.token, inst);
    }
  }

  clearUnused() {
    const unused: IGuiInstance[] = [];
    const lru: IGuiInstance[] = [];
    const now = time.now();

    // 分类提取需要清理的实例
    this._closedInstances.forEach((inst) => {
      switch (inst.config.cachePolicy) {
        case 'Expires':
          // 已经过期的需要清理
          if (this.isInstanceExpires(inst, now)) {
            unused.push(inst);
          }
          break;
        case 'Persistence':
          // 持久保留的不需要清理
          break;
        case 'LRU':
          // 遵循 LRU 规则的加入到 lru 列表
          lru.push(inst);
          break;
        case 'DestroyImmediately':
          // 有立即销毁标记的需要清理
          unused.push(inst);
          break;
      }
    });

    // 验证 LRU 规则
    if (lru.length > this._lruReserves) {
      // 最老的排在前面，然后取前几个超出的加入删除队列
      const excessLruInstances = lru.sort((a, b) => b.closeAt - a.closeAt).splice(lru.length - this._lruReserves);
      unused.push(...excessLruInstances);
    }

    // 销毁视图实例
    unused.forEach((inst) => {
      inst.controller.onViewDisposed();
      inst.node.destroy();
      this._resCache.decRef(inst.config.path, true);
      this._closedInstances.delete(inst.config.token);
    });
  }

  inspect(config: GuiConfig | string): GuiConfig | undefined {
    if (be.isString(config)) {
      // 字符串模式：直接使用 token
      const token = config as string;
      if (!this.has(token)) {
        this.logViewOperation('unregistered', token);
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
      this.logger.df(MESSAGES.GUI.ANIMATION_ENTER, config.token, lib);
      await aaron.tweener.play(node, lib, args ?? { duration: 0.3 });
    }
  }

  async playExit(config: GuiConfig, node: Node) {
    if (config.exitTweenLib) {
      const [lib, args] = config.exitTweenLib;
      this.logger.df(MESSAGES.GUI.ANIMATION_EXIT, config.token, lib);
      await aaron.tweener.play(node, lib, args ?? { duration: 0.3 });
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
        // throw new Error('Overlay not implemented');
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

  debugStacks(tag?: string): void {
    const s1 = this.screen.stack;
    const s2 = this.page.stack;
    const s3 = this.popup.stack;
    const s4 = this.alert.stack;
    const output = [
      `<${tag ?? 'Gui'}>视图栈： `,
      ` screen (${s1.length}) -> ${s1.join(',')}`,
      ` page   (${s2.length}) -> ${s2.join(',')}`,
      ` popup  (${s3.length}) -> ${s3.join(',')}`,
      ` alert  (${s4.length}) -> ${s4.join(',')}`,
    ].join('\n');
    aaron.gui.logger.d(output);
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

  // === 私有辅助方法 ===

  /**
   * 视图实例是否已过期
   * @param inst 视图实例
   * @param now 当前时间戳
   * @returns
   */
  private isInstanceExpires(inst: IGuiInstance, now?: number): boolean {
    now ??= time.now();
    return (inst.config.cacheExpires ??= 60_000) > 0 && inst.config.cacheExpires + inst.closeAt! < now;
  }

  /**
   * 验证父节点有效性
   * @param parent 父节点
   * @param token 视图标识
   * @returns 是否有效
   */
  private validateParentNode(parent: Node, token: string): boolean {
    if (!parent || !parent.isValid) {
      this.logger.ef(MESSAGES.GUI.CREATE_PARENT_INVALID, token);
      return false;
    }
    return true;
  }

  /**
   * 验证配置有效性
   * @param config 配置对象
   * @returns 是否有效
   */
  private validateConfig(config: GuiConfig): boolean {
    if (!config || !config.token || !config.controller) {
      this.logger.ef(MESSAGES.GUI.CREATE_CONFIG_INVALID, config?.token || 'unknown');
      return false;
    }
    return true;
  }

  /**
   * 记录视图操作日志
   * @param operation 操作类型
   * @param token 视图标识
   */
  private logViewOperation(
    operation: 'cached' | 'created' | 'closed' | 'registered' | 'unregistered',
    token: string
  ): void {
    const messages = {
      cached: MESSAGES.GUI.INSTANCE_FROM_CACHE,
      created: MESSAGES.GUI.INSTANCE_FROM_PREFAB,
      closed: MESSAGES.GUI.INSTANCE_CLOSED,
      registered: MESSAGES.GUI.REGISTERED,
      unregistered: MESSAGES.GUI.UNREGISTERED,
    };
    this.logger.df(messages[operation], token);
  }

  /**
   * 记录视图注册相关日志
   * @param type 注册类型
   * @param token 视图标识
   */
  private logViewRegister(type: 'duplicate' | 'replaced' | 'new', token: string): void {
    const messages = {
      duplicate: MESSAGES.GUI.REGISTER_DUPLICATE,
      replaced: MESSAGES.GUI.REGISTER_REPLACED,
      new: MESSAGES.GUI.REGISTERED,
    };
    if (type === 'duplicate') {
      this.logger.wf(messages[type], token);
    } else {
      this.logger.df(messages[type], token);
    }
  }
}
