import { IService } from '../IService';

export type Table<R = [], I = object> = {
  token: string;
  header: string[];
  listings?: R[];
  mappings?: Record<number | string, I>;
};

/**
 * 配置表数据注册与查询服务接口
 */
export interface ITableQuery extends IService {
  /**
   * 注册配置表
   * @template R 配置表条目列表形式
   * @template I 配置表条目映射形式
   * @param table 配置表注册信息
   */
  register<R, I>(table: Table<R, I>): void;

  /**
   * 批量注册配置表
   * @param tables 配置表注册信息列表
   */
  registerBatch(...tables: Table<unknown, unknown>[]): void;

  /**
   * 配置表是否已注册
   * @param token 配置表唯一标识
   * @returns 配置表是否已注册
   */
  has(token: string): boolean;

  /**
   * 解析配置表
   * @template R 配置表条目列表形式
   * @template I 配置表条目映射形式
   * @param token 配置表唯一标识
   * @param input 配置表数据（文本或二进制）
   */
  parse<R = [], I = object>(token: string, input: string | Uint8Array): Promise<Table<R,I>>;
}
