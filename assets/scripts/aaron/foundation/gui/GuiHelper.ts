import { Node, Prefab, UITransform, Widget, instantiate } from 'cc';
import { GuiConfig } from '../../interfaces';
import { aaron } from '../../core';
import { be } from '../../utils';

/**
 * GUI 工具类
 *
 * 提供视图创建、图层设置和动画播放等通用功能。
 * 主要用于 Gui 服务内部的视图实例化和生命周期管理。
 * @TODO 节点缓存与清理
 */
export class GuiHelper {
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
  public static preOpen(config: GuiConfig | string) {
    if (be.isString(config)) {
      // 字符串模式：直接使用 token
      const token = config as string;
      if (!aaron.gui.has(token)) {
        aaron.logger.wf('📷 视图: {0} 未注册', token);
      }
      return undefined;
    } else {
      // 配置对象模式：完整配置处理
      const cfg = config as GuiConfig;
      const token = cfg.token;
      if (!aaron.gui.has(token)) {
        // 自动注册未注册的视图（推荐在应用启动时统一注册）
        aaron.logger.wf('📷 视图: {0} 未注册(目前已自动注册,但最好统一注册)', token);
        aaron.gui.register(cfg);
      }
      return cfg;
    }
  }

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
  public static async createInstance(parent: Node, config: GuiConfig) {
    // 加载预制体资源
    const prefab = await aaron.resLoader.load(Prefab, config);
    if (!prefab) {
      aaron.logger.ef('📷 视图: {0} <{1}> 创建实例失败,未能正确识别预制体', config.token, config.path);
      return undefined;
    }

    // 实例化预制体
    const node = instantiate(prefab);
    parent.addChild(node);

    // 增加预制体资源引用
    aaron.resCache.addRef(config.path);

    // 获取控制器组件
    const controller = node.acquire(config.controller);

    return { config, node, controller };
  }

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
  public static createLayer(layer: Node) {
    // 确保 UI 变换组件存在
    layer.acquire(UITransform);

    // 配置对齐组件
    const wid = layer.acquire(Widget);
    wid.top = wid.bottom = wid.left = wid.right = 0; // 设置边距
    wid.isAlignTop = wid.isAlignBottom = wid.isAlignLeft = wid.isAlignRight = true; // 启用四边对齐
    wid.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE; // 窗口大小变化时重新对齐
    wid.updateAlignment(); // 立即更新对齐状态
  }

  /**
   * 播放视图进入动画
   *
   * 根据配置播放视图的进入过渡动画。
   * 支持外部动画库集成，当前版本暂时注释。
   *
   * @param config 视图配置
   * @param node 视图节点
   */
  public static async playEnter(config: GuiConfig, node: Node) {
    if (config.enterTweenLib) {
      const [lib, args] = config.enterTweenLib;
      aaron.logger.df('📷 视图: {0} 播放进入动画 {1}', config.token, lib);
      // TODO: 集成动画库后启用
      // await aaron.tweenLib.play(node, lib, args ?? { duration: 0.3 });
    }
  }

  /**
   * 播放视图退出动画
   *
   * 根据配置播放视图的退出过渡动画。
   * 支持外部动画库集成，当前版本暂时注释。
   *
   * @param config 视图配置
   * @param node 视图节点
   */
  public static async playExit(config: GuiConfig, node: Node) {
    if (config.exitTweenLib) {
      const [lib, args] = config.exitTweenLib;
      aaron.logger.df('📷 视图: {0} 播放退出动画 {1}', config.token, lib);
      // TODO: 集成动画库后启用
      // await aaron.tweenLib.play(node, lib, args ?? { duration: 0.3 });
    }
  }
}
