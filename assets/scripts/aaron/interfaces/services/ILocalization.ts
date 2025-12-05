import { __private } from 'cc';

import { IService } from '../IService';

/** 语言类型 */
export type Language = __private._pal_system_info_enum_type_language__Language;

/** 语言字典 */
export type LanguageDictionary = Record<string, string>;

/** 语言存储接口 */
export interface IStoreEntryOfLang {
  language: Language;
}

/**
 * 国际化工具接口
 */
export interface ILocalization extends IService {
  /** 当前语言 */
  language: Language;

  /**
   * 初始化
   * @param options 选项
   * @param options.language 默认语言
   * @param options.supported 支持的语言列表
   */
  initialize(options: { language?: Language; supported?: Language[] }): void;

  /**
   * 是否支持指定语言
   * @param language 语言
   * @returns
   */
  isSupported(language: Language): boolean;

  /**
   * 获取多语言文本
   * @description 当 `id` 传入时，`nameOrId` 为字典名称；当 `id` 不传入时，`nameOrId` 为文本编号。
   * @param nameOrId 字典名称或文本编号
   * @param id 文本编号
   * @returns 多语言文本
   */
  text(nameOrId: string, id?: string): string;

  /**
   * 格式化多语言文本
   * @description 当 `id` 传入时，`nameOrId` 为字典名称；当 `id` 不传入时，`nameOrId` 为文本编号。
   * @param nameOrId 字典名称或文本编号
   * @param id 文本编号
   * @param args 参数列表
   * @returns 格式化后的多语言文本
   */
  fmt(nameOrId: string, id?: string, ...args: any[]): string;

  /**
   * 添加字典
   * @param language 语言
   * @param name 字典名称
   * @param dict 字典数据
   */
  add(language: Language, name: string, dict: Record<string, string>): void;

  /**
   * 移除字典
   * @param language 语言
   * @param name 字典名称
   */
  del(language: Language, name: string): void;

  /**
   * 清除指定语言的字典
   * @param language 语言
   */
  clear(language: Language): void;

  /**
   * 清除所有语言的字典
   */
  clearAll(): void;
}
