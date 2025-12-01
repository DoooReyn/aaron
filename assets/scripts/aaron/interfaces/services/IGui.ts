import { Constructor, Node } from 'cc';
import { IAtom } from '../IAtom';
import { IService } from '../IService';
import { Component } from 'cc';

/**
 * GUI 界面类型
 * @description 定义了应用程序中不同类型的用户界面（UI）。
 * - Screen: 一级界面，全屏，通常是应用的主界面。
 * - Page: 二级界面，全屏，用于展示应用的不同功能模块。
 * - Popup: 弹出式界面，用于显示临时信息或与用户交互。
 * - Alert: 警告界面，用于显示重要信息或提示用户操作。
 * - Overlay: 叠加层界面，用于在其他界面上显示额外的内容。
 */
export type GuiInterfaceType = 'Screen' | 'Page' | 'Popup' | 'Alert' | 'Overlay';

/**
 * GUI Overlay 类型
 * @description 定义了应用程序中不同类型的叠加层界面（Overlay）。
 * - Toast: 短暂的提示信息，通常用于显示操作结果或重要消息。
 * - Drawer: 抽屉式界面，用于从屏幕顶部滑动显示额外内容。
 * - Marquee: 跑马灯式界面，用于循环显示滚动文本或通知。
 * - Guide: 引导式界面，用于向用户展示应用的功能或操作流程。
 * - Top: 顶部界面，通常用于管理（开启或禁止）触摸传递。
 */
export type GuiOverlayType = 'Toast' | 'Drawer' | 'Marquee' | 'Guide' | 'Top';

/**
 * 视图缓存策略
 * @description 定义了应用程序中不同类型的用户界面（UI）的缓存策略。
 * - DestroyImmediately: 立即销毁界面，不缓存。
 * - LRU: 最近最少使用策略，根据最近使用时间来缓存界面。
 * - Persistent: 持久化缓存策略，界面会被缓存起来，直到手动销毁或应用退出。
 */
export type GuiCachePolicy = 'DestroyImmediately' | 'LRU' | 'Persistent';

/** 同一节点同名缓动的存在策略 */
export type TweenerExistencePolicy = 'replace' | 'skip';

/** 缓动参数 */
export interface ITweenArgs {
  /** 动画时长（单位：秒） */
  duration: number;
  /**
   * 当同一节点上存在相同 lib 的缓动时的处理策略
   * replace: 停掉旧的并替换为新的；skip: 跳过新的，不做任何处理
   */
  existencePolicy?: TweenerExistencePolicy;
  /** 回调函数的 this 上下文；未指定时按照调用处传入 */
  context?: any;
  /** 动画开始 */
  onStart?(target: Node): void;
  /** 动画结束 */
  onEnd?(target: Node): void;
  /** 动画暂停 */
  onPause?(target: Node): void;
  /** 动画恢复 */
  onResume?(target: Node): void;
  /** 动画停止 */
  onStop?(target: Node): void;
  /** 透传的自定义参数，将与注册的默认参数进行浅合并 */
  [k: string]: any;
}

/**
 * 视图配置
 * @description 定义了应用程序中不同类型的用户界面（UI）的配置。
 * - token: 视图唯一标识，用于在应用程序中引用该视图。
 * - interface: 视图类型，指定了视图的显示方式和行为。
 * - overlay: Overlay 类型，指定了叠加层视图的具体类型。
 * - prefab: 视图预制体路径，指定了视图的可视化表示。
 * - controller: 视图控制脚本构造器，用于处理视图的逻辑和交互。
 * - cachePolicy: 视图缓存策略，指定了视图的缓存方式。
 * - enterTweenLib: 进入动画库，指定了视图进入时的动画效果。
 * - exitTweenLib: 退出动画库，指定了视图退出时的动画效果。
 * - modal: 是否模态，指定了视图是否阻塞用户交互(仅对Popup有效)。
 * - closeOnMaskClick: 是否点击遮罩关闭，指定了点击遮罩是否关闭视图(仅对Popup有效)。
 */
export interface GuiConfig {
  /** 视图唯一标识 */
  token: string;
  /** 视图类型 */
  interface: GuiInterfaceType;
  /** Overlay 子类型(仅在 interface 为 Overlay 时有效) */
  overlay?: GuiOverlayType;
  /** 预制体路径 */
  prefab: string;
  /** 视图控制脚本构造器 */
  controller: Constructor<IGuiController<GuiBindingMap>>;
  /** 缓存策略 */
  cachePolicy: GuiCachePolicy;
  /** 进入动画 */
  enterTweenLib?: [string, ITweenArgs?];
  /** 退出动画 */
  exitTweenLib?: [string, ITweenArgs?];
  /** 是否模态(仅对Popup有效,alert都是modal) */
  modal?: boolean;
  /** 是否点击遮罩关闭(仅对Popup有效,alert都是false) */
  closeOnMaskClick?: boolean;
}

/**
 * 绑定类型
 * @description 定义了应用程序中不同类型的绑定（Binding）。
 * - node: 绑定到单个节点。
 * - nodes: 绑定到多个节点。
 * - component: 绑定到单个组件。
 * - components: 绑定到多个组件。
 */
export type GuiBindingType = 'node' | 'nodes' | 'component' | 'components';

/**
 * 绑定配置基类
 * @description 定义了应用程序中不同类型的绑定（Binding）的配置。
 * - path: 相对于根节点的路径，例如 "."、"Header/BtnClose"。
 * - required: 是否必需，默认 true；false 时找不到返回 null/[] 而不是报错。
 */
export interface GuiBindingSpec {
  /** 绑定类型 */
  kind: string;
  /** 相对于根节点的路径，例如 "."、"Header/BtnClose" */
  path: string;
  /** 是否必需，默认 true；false 时找不到返回 null/[] 而不是报错 */
  required?: boolean;

  component?: Constructor<Component>;
}

/**
 * 绑定到单个节点
 * @description 定义了应用程序中绑定到单个节点的配置。
 * - path: 相对于根节点的路径，例如 "."、"Header/BtnClose"。
 * - required: 是否必需，默认 true；false 时找不到返回 null 而不是报错。
 * - kind: 绑定类型，默认 'node'。
 */
export interface GuiNodeBindingSpec extends GuiBindingSpec {
  kind: 'node';
}

/**
 * 绑定到多个节点
 * @description 定义了应用程序中绑定到多个节点的配置。
 * - path: 相对于根节点的路径，例如 "."、"Header/BtnClose"。
 * - required: 是否必需，默认 true；false 时找不到返回 [] 而不是报错。
 * - kind: 绑定类型，默认 'nodes'。
 */
export interface GuiNodesBindingSpec extends GuiBindingSpec {
  kind: 'nodes';
}

/**
 * 绑定到单个组件
 * @description 定义了应用程序中绑定到单个组件的配置。
 * - path: 相对于根节点的路径，例如 "."、"Header/BtnClose"。
 * - required: 是否必需，默认 true；false 时找不到返回 null 而不是报错。
 * - kind: 绑定类型，默认 'component'。
 * - component: 组件构造器，用于指定绑定的组件类型。
 */
export interface GuiComponentBindingSpec<T extends Component> extends GuiBindingSpec {
  kind: 'component';
  component: Constructor<T>;
}

/**
 * 绑定到多个组件
 * @description 定义了应用程序中绑定到多个组件的配置。
 * - path: 相对于根节点的路径，例如 "."、"Header/BtnClose"。
 * - required: 是否必需，默认 true；false 时找不到返回 [] 而不是报错。
 * - kind: 绑定类型，默认 'components'。
 * - component: 组件构造器，用于指定绑定的组件类型。
 */
export interface GuiComponentsBindingSpec<T extends Component> extends GuiBindingSpec {
  kind: 'components';
  component: Constructor<T>;
}

/**
 * 绑定配置
 * @description 定义了应用程序中不同类型的绑定（Binding）的配置。
 * - node: 绑定到单个节点。
 * - nodes: 绑定到多个节点。
 * - component: 绑定到单个组件。
 * - components: 绑定到多个组件。
 */
export type GuiBindingSpecs =
  | GuiNodeBindingSpec
  | GuiNodesBindingSpec
  | GuiComponentBindingSpec<Component>
  | GuiComponentsBindingSpec<Component>;

/**
 * 绑定条目：
 * - 对象形式：{ path, kind, component? }
 * - 元组形式：
 *   - [path] 或 [path, "node"]
 *   - [path, "nodes"]
 *   - [path, "component", ComponentCtor]
 *   - [path, "components", ComponentCtor]
 */
export type GuiBindingEntry =
  | GuiBindingSpecs
  | [path: string]
  | [path: string, kind: 'node']
  | [path: string, kind: 'nodes']
  | [path: string, kind: 'component', component: Constructor<Component>]
  | [path: string, kind: 'components', component: Constructor<Component>];

/** 绑定表：key -> 绑定配置或元组 */
export type GuiBindingMap = Record<string, GuiBindingEntry>;

/** 根据绑定配置推导绑定结果类型（支持对象与元组两种形式） */
export type GuiBindingResult<S extends GuiBindingEntry> =
  // 对象形式：component / components / node
  S extends GuiComponentBindingSpec<infer C>
    ? C | null
    : S extends GuiComponentsBindingSpec<infer C>
      ? C[]
      : S extends GuiNodeBindingSpec
        ? Node | null
        : S extends GuiNodesBindingSpec
          ? Node[]
          : // 元组形式：[path] / [path, 'node']
            S extends [string] | [string, 'node']
            ? Node | null
            : S extends [string, 'nodes']
              ? Node[]
              : // 元组形式：[path, 'component', Ctor]
                S extends [string, 'component', infer Ctor]
                ? Ctor extends new (...args: any[]) => infer I
                  ? I | null
                  : unknown
                : // 元组形式：[path, 'components', Ctor]
                  S extends [string, 'components', infer Ctor]
                  ? Ctor extends new (...args: any[]) => infer I
                    ? I[]
                    : unknown
                  : unknown;

/** 根据绑定表推导最终引用字典类型 */
export type GuiBindingRefs<M extends GuiBindingMap> = {
  [K in keyof M]: GuiBindingResult<M[K]>;
};

/**
 * 视图控制器
 * @description 视图控制器是应用程序中负责管理视图生命周期和交互的组件。
 * - 视图控制器负责处理视图的创建、显示、隐藏和销毁等生命周期事件。
 * - 视图控制器还负责处理视图与用户的交互事件，例如按钮点击、输入框输入等。
 * - 视图控制器可以通过绑定配置自动生成视图引用字典，方便访问和操作视图元素。
 */
export abstract class IGuiController<M extends GuiBindingMap = {}> extends IAtom {
  /** 视图引用字典（根据绑定配置自动生成） */
  protected refs!: GuiBindingRefs<M>;
  /**
   * 视图创建回调
   * @note 由视图管理器调用,请勿手动调用
   */
  abstract onViewCreated(): void;
  /**
   * 视图将要出现回调
   * @note 由视图管理器调用,请勿手动调用
   */
  abstract onViewWillAppear(params?: any): void;
  /**
   * 视图已出现回调
   * @note 由视图管理器调用,请勿手动调用
   */
  abstract onViewDidAppear(): void;
  /**
   * 视图将要消失回调
   * @note 由视图管理器调用,请勿手动调用
   */
  abstract onViewWillDisappear(): void;
  /**
   * 视图已消失回调
   * @note 由视图管理器调用,请勿手动调用
   */
  abstract onViewDidDisappear(): void;
  /**
   * 视图销毁回调
   * @note 由视图管理器调用,请勿手动调用
   */
  abstract onViewDisposed(): void;
  /**
   * 视图获得焦点回调
   * @note 由视图管理器调用,请勿手动调用
   */
  abstract onViewFocus(): void;
  /** 视图返回 */
  protected abstract back(): void;
}

/**
 * 视图实例接口
 * @description 视图实例是应用程序中实际显示的用户界面（UI）元素。
 * - 视图实例包含了视图的节点（Node）、控制器（Controller）和配置（Config）。
 */
export interface IGuiInstance {
  /** 视图节点 */
  node: Node;
  /** 视图控制器 */
  controller: IGuiController;
  /** 视图配置 */
  config: GuiConfig;
}

/** UIRoot 及各层级节点 */
export interface IGuiRootLayers {
  /** 根节点 */
  root: Node;
  /** Screen 层级 */
  screen: Node;
  /** Page 层级 */
  page: Node;
  /** Popup 层级 */
  popup: Node;
  /** Alert 层级 */
  alert: Node;
  /** Toast 层级 */
  toast: Node;
  /** Drawer 层级 */
  drawer: Node;
  /** Marquee 层级 */
  marquee: Node;
  /** Guide 层级 */
  guide: Node;
  /** Top 层级 */
  top: Node;
}

/**
 * Screen 层
 * @description Screen 层是应用程序中唯一可见的层级，用于显示主界面或全屏视图。
 * - Screen 层同时只能包含一个 Screen 视图实例。
 * - 返回对 Screen 层的调用无效。
 */
export abstract class IGuiScreen extends Node {
  /** 当前视图 */
  protected $instance: IGuiInstance | null = null;
  /** 顶层视图标识 */
  abstract get top(): string | undefined;
  /**
   * 打开视图
   * @param config 配置参数
   * @param params 附加参数
   */
  abstract open(config: GuiConfig, params?: any): Promise<void>;
  /**
   * 关闭当前视图
   * @param force 是否强制关闭
   */
  abstract close(force: boolean): Promise<void>;
  /** 返回上一个视图 */
  abstract back(): Promise<void>;
}

/**
 * Page 层
 * @description Page 层是应用程序中用于显示二级页面视图的层级。
 * - Page 层可以包含多个 Page 视图实例。
 * - 返回对 Page 层的调用会关闭当前 Page 视图实例。
 */
export abstract class IGuiPage extends Node {
  /**
   * 打开视图
   * @param config 配置参数或视图标识
   * @param params 附加参数
   */
  abstract open(config: GuiConfig | string, params?: any): Promise<void>;
  /**
   * 关闭视图
   * @param config 配置参数或栈深度或视图标识
   */
  abstract close(config?: GuiConfig | number | string): Promise<void>;
  /** 返回上一个视图 */
  abstract back(): Promise<void>;
  /** 获取当前视图的深度 */
  abstract get depth(): number;
  /** 获取顶部视图标识 */
  abstract get top(): string | undefined;
  /** 判断视图是否存在 */
  abstract exists(token: string): boolean;
}

/**
 * Popup 层
 * @description Popup 层是应用程序中用于显示弹窗视图的层级。
 * - Popup 层可以包含多个 Popup 视图实例。
 * - 返回对 Popup 层的调用会关闭当前 Popup 视图实例。
 */
export abstract class IGuiPopup extends Node {}

/**
 * Alert 层
 * @description Alert 层是应用程序中用于显示警告弹窗视图的层级。
 * - Alert 层可以包含多个 Alert 视图实例。
 * - 返回对 Alert 层的调用会关闭当前 Alert 视图实例。
 */
export abstract class IGuiAlert extends Node {}

/**
 * Toast 层
 * @description Toast 层是应用程序中用于显示短暂提示消息的层级。
 * - Toast 层可以包含多个 Toast 视图实例。
 * - 返回对 Toast 层的调用无效，因为它是非栈式的层级。
 */
export abstract class IGuiToast extends Node {}

/**
 * Drawer 层
 * @description Drawer 层是应用程序中用于显示侧边抽屉视图的层级。
 * - Drawer 层同时只能包含一个 Drawer 视图实例。
 * - 返回对 Drawer 层的调用无效，因为它是非栈式的层级。
 */
export abstract class IGuiDrawer extends Node {}

/**
 * Marquee 层
 * @description Marquee 层是应用程序中用于显示滚动消息的层级。
 * - Marquee 层同时只能包含一个 Marquee 视图实例。
 * - 返回对 Marquee 层的调用无效，因为它是非栈式的层级。
 */
export abstract class IGuiMarquee extends Node {}

/**
 * Guide 层
 * @description Guide 层是应用程序中用于显示操作引导的层级。
 * - Guide 层同时只能包含一个 Guide 视图实例。
 * - 返回对 Guide 层的调用无效，因为它是非栈式的层级。
 */
export abstract class IGuiGuide extends Node {}

/**
 * Top 层
 * @description Top 层是应用程序中用于显示顶部导航栏视图的层级。
 * - Top 层同时只能包含一个 Top 视图实例。
 * - 返回对 Top 层的调用无效，因为它是非栈式的层级。
 */
export abstract class IGuiTop extends Node {}

/**
 * 视图服务接口
 * @description 视图服务负责管理应用程序中的视图（UI）元素。
 * - 视图服务负责创建、显示、隐藏和销毁视图实例。
 * - 视图服务还负责处理视图之间的导航和交互。
 * - 视图服务可以根据配置自动生成视图实例，也可以手动创建和管理视图实例。
 */
export interface IGui extends IService {
  /** Screen 层 */
  readonly screen: IGuiScreen;
  /** Page 层 */
  readonly page: IGuiPage;
  /** Popup 层 */
  readonly popup: IGuiPopup;
  /** Alert 层 */
  readonly alert: IGuiAlert;
  /** Toast 层 */
  readonly toast: IGuiToast;
  /** Drawer 层 */
  readonly drawer: IGuiDrawer;
  /** Marquee 层 */
  readonly marquee: IGuiMarquee;
  /** Guide 层 */
  readonly guide: IGuiGuide;
  /** Top 层 */
  readonly top: IGuiTop;
  /** 初始化或获取 UIRoot 及各层级节点 */
  initialize(): IGuiRootLayers;
  /** 注册单个视图配置 */
  register(config: GuiConfig): void;
  /** 批量注册视图配置 */
  registerBatch(configs: GuiConfig[]): void;
  /** 检查视图配置是否存在 */
  has(token: string): boolean;
  /**
   * 根据 key 或 controller 构造器解析 GuiConfig
   * @param keyOrClass GuiConfig key 或 controller 构造器
   * @returns GuiConfig
   */
  fetchConfig(keyOrClass: string | Constructor<IGuiController>): GuiConfig | undefined;
  /** 返回（约等于关闭当前视图） */
  back(): Promise<void>;
  /** 调试打印当前视图栈 */
  debugStacks(tag: string): void;
  /** 调试打印当前视图快照 */
  debugSnapshots(tag: string): void;
}
