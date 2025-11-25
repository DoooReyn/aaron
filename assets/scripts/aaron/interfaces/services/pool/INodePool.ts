import { Prefab } from 'cc';
import { IRecyclableNode, IRecyclableOptions } from './IRecyclable';
import { IService } from '../../IService';
import { Constructor } from '../../../types';

/**
 * 节点池接口
 */
export interface INodePool {
  /** 模板 */
  readonly template: IRecyclableNode | Prefab;
  /** 对象池配置 */
  readonly options: IRecyclableOptions;
  /** 对象池标识 */
  get token(): string;
  /** 对象池容量 */
  get capacity(): number;
  /** 对象过期时间 */
  get expires(): number;
  /** 节点剩余个数 */
  get size(): number;
  /**
   * 填充条目
   * @param n 目标数量
   * @returns
   */
  fill(n: number): void;
  /**
   * 取出条目
   * @returns 实例条目
   */
  acquire(): IRecyclableNode | undefined;
  /**
   * 回收节点
   * @param inst 节点实例
   */
  recycle(inst: IRecyclableNode): void;
  /** 清理过期节点 */
  clearUnused(): void;
  /** 清空节点池 */
  clear(): void;
}

/**
 * 节点池服务接口
 */
export interface INodePoolContainer extends IService {
  /**
   * 注册节点池
   * @param template 模板类
   * @@param options 回收配置
   */
  registerByConstructor(template: Constructor<IRecyclableNode>, options: IRecyclableOptions): void;
  /**
   * 注册节点池
   * @param template 模板节点或预制体
   * @@param options 回收配置
   */
  registerByInstance(template: IRecyclableNode | Prefab, options: IRecyclableOptions): void;
  /**
   * 注销节点池
   * @param token 节点池名称
   */
  unregister(token: string): void;
  /**
   * 节点池是否已注册
   * @param token 节点池名称
   * @returns
   */
  has(token: string): boolean;
  /**
   * 获取节点池模板资源
   * @param token 节点池名称
   * @returns
   */
  templateOf(token: string): Prefab | IRecyclableNode | undefined;
  /**
   * 获取节点
   * @param token 节点池名称
   * @returns
   */
  acquire<N extends IRecyclableNode>(token: string): N | undefined;
  /**
   * 回收节点
   * @param inst 节点实例
   */
  recycle(inst: IRecyclableNode): void;
  /**
   * 获取节点池当前节点数量
   * @param token 节点池名称
   * @returns
   */
  sizeOf(token: string): number;
  /**
   * 清理未使用节点
   */
  clearUnused(): void;
  /**
   * 清空所有节点池
   */
  clear(): void;
}
