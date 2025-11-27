import { IService } from "../IService";
import { ITriggers } from "../ITrigger";
import { IObjectEntry } from "./pool";

/**
 * 计数器接口
 */
export interface ICounter extends IObjectEntry {
  /** 触发器#计次 */
  onCount: ITriggers;
  /** 触发器#按帧计次 */
  onTick: ITriggers;
  /** 触发器#按固定频率计次 */
  onFixedTick: ITriggers;
  /** 触发器#完成 */
  onDone: ITriggers;
  /** 计时器ID */
  get cid(): number;
  /** 计时#累计次数 */
  get count(): number;
  /** 计时#是否完成 */
  get done(): boolean;
  /** 设定#计次总数 */
  get total(): number;
  /** 设定#计次间隔 */
  get interval(): number;
  /** 计时#累计时间 */
  get accumulated(): number;
  /**
   * 累加时间片
   * @param dt 时间片
   */
  update(dt: number): void;
}

/**
 * 定时器接口
 */
export interface ITick {
  /** 定时器标识 */
  readonly name: string;
  /** 运行 */
  run(): void;
  /** 暂停 */
  pause(): void;
  /** 停止 */
  stop(): void;
  /**
   * 添加计数器
   * @param interval 设定间隔
   * @param total 设定计数
   * @returns
   */
  add(interval?: number, total?: number): ICounter;
  /**
   * 移除计数器
   * @param counter 计数器
   */
  del(counter: ICounter | number): void;
  /**
   * 下一帧执行
   * @param handle 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  nextTick(handle: Function, context: any, ...args: any[]): ICounter;
  /**
   * N 帧后执行
   * @param n 帧数
   * @param handle 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  nextTicks(n: number, handle: Function, context: any, ...args: any[]): ICounter;
  /**
   * 延迟执行
   * @param interval 设定间隔
   * @param handle 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  delay(interval: number, handle: Function, context: any, ...args: any[]): ICounter;
  /**
   * 计次执行
   * @param interval 设定间隔
   * @param total 设定计数
   * @param handle 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  repeat(interval: number, total: number, handle: Function, context: any, ...args: any[]): ICounter;
  /**
   * 重复执行
   * @param interval 设定间隔
   * @param handle 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  loop(interval: number, handle: Function, context: any, ...args: any[]): ICounter;
  /**
   * 每帧执行
   * @param handle 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  everyTick(handle: Function, context: any, ...args: any[]): ICounter;
  /**
   * 以固定频率重复执行
   * @param handle 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  fixedTick(interval: number, handle: Function, context: any, ...args: any[]): ICounter;
  /**
   * 当前速率
   */
  speed: number;
  /**
   * 累积时间片
   * @param dt 时间片
   */
  update(dt: number): void;
}

/**
 * 定时器服务接口
 * @description 定时器服务接口定义了定时器服务的行为
 */
export interface ITimer extends IService {
  /**
   * 获取定时器
   * @param key 定时器标识
   */
  acquire(key: string): ITick;
  /**
   * 获取共享定时器
   * - 一般的，不应对此定时器调速
   */
  get shared(): ITick;
  /**
   * 获取系统定时器
   * - 一般的，不应对此定时器调速
   */
  get system(): ITick;
  /**
   * 获取回收定时器
   * - 一般的，不应对此定时器调速
   */
  get recycle(): ITick;
  /**
   * 暂停所有定时器（不包括 Director）
   */
  pause(): void;
  /**
   * 恢复所有定时器（不包括 Director）
   */
  resume(): void;
  /**
   * 停止（清除）所有定时器（不包括 Director）
   */
  stop(): void;
  /**
   * 更新所有定时器（不包括 Director）
   * @param dt 时间片
   */
  update(dt: number): void;
}
