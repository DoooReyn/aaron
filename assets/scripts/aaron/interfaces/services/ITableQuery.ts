import { IService } from '../IService';

/** 配置表注册信息 */
export type Table<R = [], I = object> = {
  token: string;
  header: string[];
  listings?: R[];
  mappings?: Record<number | string, I>;
};

/** 表格条目基础结构 */
export interface ITableEntry {
  id: number;
  [key: string]: any;
}

/** 查询量级类型 */
export type QueryAmountType = "one" | "many";

/** 查询匹配类型 */
export type QueryMatchType = "some" | "every";

/** 查询条件 */
export interface IQuery<T extends ITableEntry> {
  /** 查询字段 */
  fields?: Partial<T>;
  /** 查询过滤器 */
  filter?: (id: number, data: ITableEntry) => boolean;
  /** 是否缓存 */
  cache?: boolean;
  /** 查询量级类型 */
  amountType?: QueryAmountType;
  /** 查询匹配类型 */
  matchType?: QueryMatchType;
}

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
  parse<R = [], I = object>(token: string, input: string | Uint8Array): Promise<Table<R, I>>;

  /**
   * 查询指定主键编号的条目
   * @param token 配置表唯一标识
   * @param id 配置表主键编号
   * @returns 如果配置表已初始化且存在，返回具有指定主键编号的条目；否则返回 undefined。
   */
  one<T extends ITableEntry>(token: string, id: string | number): T | undefined;

  /**
   * 查询指定条目的特定字段值
   * @template T 配置表条目类型
   * @template K 字段名类型
   * @param token 配置表唯一标识
   * @param id 配置表主键编号
   * @param key 要查询的字段名
   * @returns 如果条目存在且字段存在，返回字段值；否则返回 undefined。
   */
  field<T extends ITableEntry, K extends keyof T = keyof T>(
    token: string,
    id: string | number,
    key: K
  ): T[K] | undefined;

  /**
   * 查询指定条目的多个字段值
   * @template T 配置表条目类型
   * @template K 字段名类型
   * @param token 配置表唯一标识
   * @param id 配置表主键编号
   * @param keys 要查询的字段名列表
   * @returns 如果条目存在且字段存在，返回仅包含字段的条目数据；否则返回 undefined。
   */
  fields<T extends ITableEntry, K extends keyof T = keyof T>(
    token: string,
    id: string | number,
    keys: K[]
  ): Pick<T, K> | undefined;

  /**
   * 高级查询
   * @param token 配置表唯一标识
   * @param query 查询条件
   * @description 支持多种查询方式
   * - 方式：字段匹配、过滤器
   * - 量级：一个、多个
   * - 匹配：符合所有条件、符合任意条件
   * @returns 查询结果数组
   */
  query<T extends ITableEntry>(token: string, query: IQuery<T>): T[];
}
