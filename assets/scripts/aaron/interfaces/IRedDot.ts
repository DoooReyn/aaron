import { IService } from './IService';

/**
 * 红点样式枚举
 */
export enum RedDotStyle {
  /** 数字样式 */
  NUMBER = 'number',
  /** 角标样式 */
  BADGE = 'badge',
  /** 图标样式 */
  ICON = 'icon',
}

/**
 * 红点规则接口
 */
export interface IRedDotRule {
  /**
   * 评估红点是否应该显示
   * @param data 红点数据
   * @returns 是否显示红点
   */
  evaluate(data: any): boolean;
}

/**
 * 红点状态数据
 */
export interface IRedDotData {
  /** 红点数据 */
  data?: any;
  /** 是否显示 */
  visible: boolean;
  /** 最后更新时间 */
  updateTime: number;
}

/**
 * 红点配置
 */
export interface IRedDotConfig {
  /** 红点唯一标识 */
  id: string;
  /** 红点样式 */
  style: RedDotStyle;
  /** 红点规则 */
  rule: IRedDotRule;
  /** 点击后是否自动清除 */
  autoClear: boolean;
  /** 是否持久化 */
  persistent: boolean;
  /** 父红点ID（支持嵌套） */
  parent?: string;
  /** 子红点ID列表 */
  children?: string[];
}

/**
 * 红点状态变化事件
 */
export interface IRedDotChangeEvent {
  /** 红点ID */
  id: string;
  /** 新状态 */
  visible: boolean;
  /** 红点数据 */
  data?: any;
}

/**
 * 红点服务接口
 */
export interface IRedDotContainer extends IService {
  /**
   * 注册红点配置
   * @param config 红点配置
   */
  register(config: IRedDotConfig): void;

  /**
   * 更新红点数据
   * @param id 红点ID
   * @param data 红点数据
   */
  updateData(id: string, data: any): void;

  /**
   * 获取红点状态
   * @param id 红点ID
   * @returns 是否显示红点
   */
  getState(id: string): boolean;

  /**
   * 获取红点数据
   * @param id 红点ID
   * @returns 红点状态数据
   */
  getData(id: string): IRedDotData | null;

  /**
   * 监听红点状态变化
   * @param id 红点ID
   * @param callback 状态变化回调
   * @returns 取消监听的函数
   */
  subscribe(id: string, callback: (event: IRedDotChangeEvent) => void): () => void;

  /**
   * 取消监听红点状态变化
   * @param id 红点ID
   * @param callback 状态变化回调
   */
  unsubscribe(id: string, callback: (event: IRedDotChangeEvent) => void): void;

  /**
   * 批量更新红点数据
   * @param updates 批量更新数据
   */
  batchUpdate(updates: { id: string; data: any }[]): void;

  /**
   * 清除红点状态
   * @param id 红点ID
   */
  clear(id: string): void;

  /**
   * 触发红点点击事件
   * @param id 红点ID
   */
  onClick(id: string): void;

  /**
   * 获取所有红点状态
   * @returns 所有红点状态映射
   */
  getAllStates(): Map<string, IRedDotData>;

  /**
   * 检查红点是否存在
   * @param id 红点ID
   * @returns 是否存在
   */
  has(id: string): boolean;

  /**
   * 注销红点
   * @param id 红点ID
   */
  unregister(id: string): void;
}

/**
 * 红点池对象接口
 */
export interface IRedDotPool {
  /**
   * 获取红点对象
   * @returns 红点对象
   */
  acquire(): IRedDotData;

  /**
   * 回收红点对象
   * @param redDot 红点对象
   */
  recycle(redDot: IRedDotData): void;
}
