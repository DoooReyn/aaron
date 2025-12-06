/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * 日志接口
 */
export interface ILogger {
  readonly token: string;
  level: LogLevel;
  d(message: string, ...args: any[]): void;
  df(message: string, ...args: any[]): void;
  i(message: string, ...args: any[]): void;
  if(message: string, ...args: any[]): void;
  w(message: string, ...args: any[]): void;
  wf(message: string, ...args: any[]): void;
  e(message: string, ...args: any[]): void;
  ef(message: string, ...args: any[]): void;
}
