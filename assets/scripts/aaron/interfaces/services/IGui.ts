import { Component, Node } from 'cc';

import { Constructor } from '../../types';
import { IAtom } from '../IAtom';
import { IService } from '../IService';
import { ITriggers } from '../ITrigger';
import { ITweenArgs } from './ITweener';

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
 * 视图配置
 * @description 定义了应用程序中不同类型的用户界面（UI）的配置。
 * - token: 视图唯一标识，用于在应用程序中引用该视图。
 * - interface: 视图类型，指定了视图的显示方式和行为。
 * - overlay: Overlay 类型，指定了叠加层视图的具体类型。
 * - prefab: 视图预制体路径，指定了视图的可视化表示。
 * - controller: 视图控制脚本构造器，用于处理视图的逻辑和交互。
 * - cacheExpires: 视图缓存过期时间,用于指定视图销毁后多久销毁资源。
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
  path: string;
  /** 视图控制脚本构造器 */
  controller: Constructor<IGuiController<GuiBindingMap>>;
  /**
   * 缓存策略
   * - Persistence: 持久化缓存，视图关闭后不会销毁资源。
   * - Expires: 过期缓存，视图关闭后会保留一段时间的缓存。
   * - LRU: 最近最少使用缓存，视图关闭后会保留最近使用的缓存。
   * - DestroyImmediately: 立即销毁缓存，视图关闭后会立即销毁资源。
   */
  cachePolicy: 'Persistence' | 'Expires' | 'LRU' | 'DestroyImmediately';
  /** 视图缓存过期时间(仅对 Expires 策略有效) */
  cacheExpires?: number;
  /** 进入动画 */
  enterTweenLib?: [string, ITweenArgs?];
  /** 退出动画 */
  exitTweenLib?: [string, ITweenArgs?];
  /** 是否点击遮罩关闭(仅对Popup有效) */
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
export interface IGuiController<M extends GuiBindingMap = {}> extends IAtom {
  /** 视图标识 */
  get token(): string;
  /** 视图引用字典（根据绑定配置自动生成） */
  refs: GuiBindingRefs<M>;
  /**
   * 视图生命周期：视图创建
   * @note 由视图管理器调用,请勿手动调用
   * @param token 视图标识符
   */
  onViewCreated(token: string): void;
  /**
   * 视图生命周期：视图即将出现
   * @note 由视图管理器调用,请勿手动调用
   */
  onViewWillAppear(params?: any): void;
  /**
   * 视图生命周期：视图完全出现
   * @note 由视图管理器调用,请勿手动调用
   */
  onViewDidAppear(): void;
  /**
   * 视图生命周期：视图即将消失
   * @note 由视图管理器调用,请勿手动调用
   */
  onViewWillDisappear(): void;
  /**
   * 视图生命周期：视图完全消失
   * @note 由视图管理器调用,请勿手动调用
   */
  onViewDidDisappear(): void;
  /**
   * 视图生命周期：视图销毁
   * @note 由视图管理器调用,请勿手动调用
   */
  onViewDisposed(): void;
  /**
   * 视图生命周期：视图获得焦点
   * @note 由视图管理器调用,请勿手动调用
   */
  onViewFocus(): void;
  /** 视图返回 */
  back(): void;
  /** 视图关闭 */
  close(): void;
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
  /** 关闭时间 */
  closeAt?: number;
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
export interface IGuiScreen extends Node {
  /** 顶层视图标识 */
  get top(): string | undefined;
  /** 视图栈 */
  get stack(): string[];
  /**
   * 打开视图
   * @param config 配置参数
   * @param params 附加参数
   */
  open(config: GuiConfig, params?: any): Promise<void>;
  /**
   * 关闭当前视图
   * @param force 是否强制关闭
   */
  close(force: boolean): Promise<void>;
  /** 返回上一个视图 */
  back(): Promise<void>;
  /** 聚焦顶层视图 */
  focus(): void;
}

/**
 * 拥栈层
 * @description 拥栈层是应用程序中用于拥有页面堆栈的层级。
 * - 拥栈层可以包含多个 Page 视图实例。
 * - 返回对拥栈层的调用会关闭当前层顶部视图实例。
 */
export interface IGuiStack extends Node {
  /**
   * 打开视图
   * @param config 配置参数或视图标识
   * @param params 附加参数
   */
  open(config: GuiConfig | string, params?: any): Promise<void>;
  /**
   * 关闭视图
   * @param config 配置参数或栈深度或视图标识
   */
  close(config?: GuiConfig | number | string): Promise<void>;
  /** 返回上一个视图 */
  back(): Promise<void>;
  /** 获取视图栈的深度 */
  get depth(): number;
  /** 获取顶部视图标识 */
  get top(): string | undefined;
  /** 视图栈 */
  get stack(): string[];
  /** 判断视图是否存在 */
  exists(token: string): boolean;
  /** 聚焦顶层视图 */
  focus(): void;
  /** 视图栈深度变化回调 */
  onViewDepthChanged(): void;
}

/**
 * Page 层
 * @description Page 层是应用程序中用于显示二级页面视图的层级。
 * - Page 层可以包含多个 Page 视图实例。
 * - 返回对 Page 层的调用会关闭当前 Page 视图实例。
 */
export interface IGuiPage extends IGuiStack {}

/**
 * Popup 层
 * @description Popup 层是应用程序中用于显示弹窗视图的层级。
 * - Popup 层可以包含多个 Popup 视图实例。
 * - 返回对 Popup 层的调用会关闭当前 Popup 视图实例。
 */
export interface IGuiPopup extends IGuiStack {}

/**
 * Alert 层
 * @description Alert 层是应用程序中用于显示警告弹窗视图的层级。
 * - Alert 层可以包含多个 Alert 视图实例。
 * - 返回对 Alert 层的调用会关闭当前 Alert 视图实例。
 */
export interface IGuiAlert extends IGuiStack {}

/**
 * Toast 层
 * @description Toast 层是应用程序中用于显示短暂提示消息的层级。
 * - Toast 层可以包含多个 Toast 视图实例。
 * - 返回对 Toast 层的调用无效，因为它是非栈式的层级。
 */
export interface IGuiToast extends Node {}

/**
 * Drawer 层
 * @description Drawer 层是应用程序中用于显示侧边抽屉视图的层级。
 * - Drawer 层同时只能包含一个 Drawer 视图实例。
 * - 返回对 Drawer 层的调用无效，因为它是非栈式的层级。
 */
export interface IGuiDrawer extends Node {}

/**
 * Marquee 层
 * @description Marquee 层是应用程序中用于显示滚动消息的层级。
 * - Marquee 层同时只能包含一个 Marquee 视图实例。
 * - 返回对 Marquee 层的调用无效，因为它是非栈式的层级。
 */
export interface IGuiMarquee extends Node {}

/**
 * Guide 层
 * @description Guide 层是应用程序中用于显示操作引导的层级。
 * - Guide 层同时只能包含一个 Guide 视图实例。
 * - 返回对 Guide 层的调用无效，因为它是非栈式的层级。
 */
export interface IGuiGuide extends Node {}

/**
 * Top 层
 * @description Top 层是应用程序中用于显示顶部视图的层级。
 * - Top 层同时只能包含一个 Top 视图实例。
 * - 返回对 Top 层的调用无效，因为它是非栈式的层级。
 */
export interface IGuiTop extends Node {
  /** 是否接受触摸 */
  touchAllowed: boolean;
  /** 触摸开始事件 */
  onStart: ITriggers;
  /** 触摸移动事件 */
  onMove: ITriggers;
  /** 触摸结束事件 */
  onEnd: ITriggers;
  /** 触摸取消事件 */
  onCancel: ITriggers;
}

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
  /** LRU 实例保留数量，限制1~10之间，默认为3 */
  lruReserves: number;
  /** 初始化或获取 UIRoot 及各层级节点 */
  initialize(): void;
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
  /**
   * 创建视图实例
   *
   * 根据配置创建视图的节点实例，包括：
   * - 加载预制体资源
   * - 实例化节点并添加到父节点
   * - 增加预制体引用计数
   * - 获取控制器组件
   *
   * @param parent 父节点
   * @param config 视图配置
   * @returns 视图实例对象，包含配置、节点和控制器，创建失败返回 undefined
   */
  createInstance(parent: Node, config: GuiConfig): Promise<IGuiInstance | undefined>;
  /**
   * 关闭视图实例
   * @param instance 视图实例
   */
  closeInstance(instance: IGuiInstance): void;
  /**
   * 清空未使用实例
   */
  clearUnused(): void;
  /**
   * 预处理视图配置
   *
   * 验证视图配置的有效性，处理视图注册状态。
   * 支持两种输入方式：
   * - 字符串：直接使用视图 token
   * - 配置对象：完整的 GuiConfig 配置
   *
   * @param config 视图配置（token 或 GuiConfig）
   * @returns 处理后的配置，如果配置无效则返回 undefined
   */
  inspect(config: GuiConfig | string): GuiConfig | undefined;
  /**
   * 创建视图图层
   *
   * 为视图层节点设置 UI 变换组件和对齐配置：
   * - 添加 UITransform 组件
   * - 配置 Widget 组件实现全屏对齐
   * - 启用窗口大小变化时自动调整
   *
   * @param layer 视图层节点
   */
  createLayer(layer: Node): void;
  /**
   * 播放视图进入动画
   *
   * 根据配置播放视图的进入过渡动画。
   * 支持外部动画库集成，当前版本暂时注释。
   *
   * @param config 视图配置
   * @param node 视图节点
   */
  playEnter(config: GuiConfig, node: Node): Promise<void>;
  /**
   * 播放视图退出动画
   *
   * 根据配置播放视图的退出过渡动画。
   * 支持外部动画库集成，当前版本暂时注释。
   *
   * @param config 视图配置
   * @param node 视图节点
   */
  playExit(config: GuiConfig, node: Node): Promise<void>;
  /** 返回（约等于关闭顶层视图） */
  back(): Promise<void>;
  /**
   * 打开视图
   * @param config 视图配置
   * @param params 视图入参
   */
  open(config: GuiConfig, params?: any): Promise<void>;
  /** 关闭指定视图 */
  close(token: string): Promise<void>;
  /** 聚焦顶层视图 */
  focus(): void;
  /** 调试打印当前视图栈 */
  debugStacks(tag: string): void;
}
