import { LogLevel } from "./services";

/** 应用启动参数 */
export interface ILaunchOptions {
  /** 应用名称 */
  appName: string;
  /** 运行环境 */
  env: 'dev' | 'debug' | 'prod';
  /** 日志等级 */
  logLevel: LogLevel;
  [k: string]: any;
}
