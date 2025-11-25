import { Pair } from "../types";

/** 数据传输对象 */
export interface Dto {}
/** 数据属性变化回调 */
export type OnPropertyChanged = (path: string, value: any) => void;

/** 订阅结构 */
export type Subscription = Pair<OnPropertyChanged, any>;

/** 数据模型接口 */
export interface IModel<T extends Dto> {
  /** 数据代理 */
  get dto(): T;

  /** 初始化 */
  initialize(): void;

  /**
   * 同步数据
   * @param dto 数据对象
   */
  sync(dto: T): void;

  /**
   * 订阅属性变化（细粒度）
   * @param property 属性路径
   * @param onPropertyChanged 回调
   * @param context 上下文
   * @returns
   */
  subscribeCompact(property: string, onPropertyChanged: OnPropertyChanged, context: any): void;

  /**
   * 取消订阅（细粒度）
   * @param property 属性路径
   * @param onPropertyChanged 回调
   * @param context 上下文
   */
  unsubscribeCompact(property: string, onPropertyChanged: OnPropertyChanged, context: any): void;

  /**
   * 取消（指定路径的）所有订阅（细粒度）
   * @param property 属性路径（可选，不传时取消所有订阅）
   * @param context 上下文（可选，不传时取消指定属性的所有订阅）
   */
  unsubscribeAllCompact(property?: string, context?: any): void;

  /**
   * 订阅属性变化（粗粒度）
   * @param onPropertyChanged 回调
   * @param context 上下文
   */
  subscribeCoarse(onPropertyChanged: OnPropertyChanged, context: any): void;

  /**
   * 取消订阅（粗粒度）
   * @param onPropertyChanged 回调
   * @param context 上下文
   */
  unsubscribeCoarse(onPropertyChanged: OnPropertyChanged, context: any): void;

  /**
   * 取消（指定上下文的）所有属性订阅（粗粒度）
   */
  unsubscribeAllCoarse(context?: any): void;

  /**
   * 取消所有订阅（包含细粒度和粗粒度）
   * @param context 上下文（可选，不传时取消所有订阅）
   */
  unsubscribeAll(context?: any): void;
}
