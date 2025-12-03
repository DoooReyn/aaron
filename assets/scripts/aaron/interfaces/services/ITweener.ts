import { Node, Tween } from 'cc';
import { IService } from '../IService';

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
 * 同一节点同名缓动的存在策略
 * @note override: 覆盖旧的缓动；skip: 跳过新的，不做任何处理
 */
export type TweenerExistencePolicy = 'override' | 'skip';

/** 缓动条目接口，定义参数与执行入口 */
export interface ITweenEntry {
  /** 唯一库名，用于标识一种缓动 */
  lib: string;
  /** 该缓动的默认参数（会与调用时参数浅合并） */
  args: ITweenArgs;
  /**
   * 构建实际的 Tween 序列（不需要处理开始/结束回调与注册表写入）
   * @param node 目标节点
   * @param args 缓动参数
   * @returns Tween 实例
   */
  create(node: Node, args: ITweenArgs): Tween<Node>;
}

/** 缓动能力依赖接口 */
export interface ITweener extends IService {
  /** 初始化 */
  initialize(): void;
  /** 销毁 */
  destroy(): void;
  /**
   * 是否已注册某个缓动库
   * @param lib 库名
   * @returns 是否存在注册
   */
  has(lib: string): boolean;
  /**
   * 注册一个缓动库入口
   * @param entry 缓动条目
   */
  register(entry: ITweenEntry): void;
  /**
   * 反注册一个缓动库入口
   * @param entry 缓动条目或库名
   */
  unregister(entry: ITweenEntry | string): void;
  /**
   * 清空所有已注册的缓动库
   */
  clear(): void;
  /**
   * 播放指定节点上的缓动库（根据存在策略决定替换/跳过）
   * @param node 目标节点
   * @param lib 库名
   * @param args 播放参数
   * @returns 异步完成 Promise
   */
  play(node: Node, lib: string, args: ITweenArgs): Promise<void>;
  /**
   * 停止指定节点上的某个缓动
   * @param node 目标节点
   * @param lib 库名
   */
  stop(node: Node, lib: string): void;
  /**
   * 暂停指定节点上的某个缓动
   * @param node 目标节点
   * @param lib 库名
   */
  pause(node: Node, lib: string): void;
  /**
   * 恢复指定节点上的某个缓动
   * @param node 目标节点
   * @param lib 库名
   */
  resume(node: Node, lib: string): void;
  /**
   * 判断指定节点上的某个缓动是否播放中
   * @param node 目标节点
   * @param lib 库名
   * @returns 是否处于播放状态
   */
  isPlaying(node: Node, lib: string): boolean;
  /**
   * 暂停某节点或所有节点上的全部缓动
   * @param node 目标节点（可选）
   */
  pauseAll(node?: Node): void;
  /**
   * 恢复某节点或所有节点上的全部缓动
   * @param node 目标节点（可选）
   */
  resumeAll(node?: Node): void;
  /**
   * 停止某节点或所有节点上的全部缓动
   * @param node 目标节点（可选）
   */
  stopAll(node?: Node): void;
}
