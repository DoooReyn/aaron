import { __private } from 'cc';

import { LogLevel } from './services';

/** 应用启动参数 */
export interface ILaunchOptions {
  /** 应用名称 */
  appName: string;
  /** 运行环境 */
  env: 'dev' | 'debug' | 'prod';
  /** 日志等级 */
  logLevel: LogLevel;
  /** 支持的语言（首个为默认语言，如果为空，则取 sys.language 为默认语言） */
  languages: __private._pal_system_info_enum_type_language__Language[];

  [k: string]: any;
}

/**
 * 可选的应用启动参数
 */
export type IPartialLaunchOptions = Partial<ILaunchOptions> & Pick<ILaunchOptions, 'appName'>;