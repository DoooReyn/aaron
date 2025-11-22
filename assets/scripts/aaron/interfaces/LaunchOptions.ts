import { LogLevel } from "./services";

/** 启动参数 */
export interface ILaunchOptions {
  env: 'dev' | 'debug' | 'prod';
  logLevel: LogLevel;
  [k: string]: any;
}
