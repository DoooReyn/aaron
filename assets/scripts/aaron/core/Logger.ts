import { ILogger, LogLevel } from '../interfaces';
import { literal } from '../utils';

/**
 * 日志分级处理句柄
 */
const LoggerHandlers: Record<LogLevel, (...args: any[]) => void> = {
  [LogLevel.DEBUG]: console.debug.bind(console, '『D』'),
  [LogLevel.INFO]: console.info.bind(console, '『I』'),
  [LogLevel.WARN]: console.warn.bind(console, '『W』'),
  [LogLevel.ERROR]: console.error.bind(console, '『E』'),
  [LogLevel.NONE]: function (..._: any[]) {},
};

/**
 * 日志
 *
 * 提供统一的日志记录功能，支持不同级别的日志输出
 */
export class Logger implements ILogger {
  /**
   * 日志构造
   * @param token 日志标识
   */
  constructor(public readonly token: string) {}

  /** 当前日志等级 */
  private _level: LogLevel = LogLevel.DEBUG;

  /**
   * 获取当前日志级别
   * @returns 当前日志级别
   */
  get level(): LogLevel {
    return this._level;
  }
  /**
   * 设置日志级别
   * @param level 日志级别
   */
  set level(level: LogLevel) {
    this._level = level;
  }

  private log(level: LogLevel, fmt: boolean, message: string, ...args: any[]): void {
    if (this._level <= level) {
      LoggerHandlers[this._level](this.token, ...(fmt ? [literal.fmt(message, ...args)] : [message, ...args]));
    }
  }

  /**
   * 记录调试级别日志
   * @param message 日志消息
   * @param args 额外参数
   */
  d = this.log.bind(this, LogLevel.DEBUG, false);

  /**
   * 记录调试级别日志（格式化）
   * @param message 日志消息
   * @param args 额外参数
   */
  df = this.log.bind(this, LogLevel.DEBUG, true);

  /**
   * 记录信息级别日志
   * @param message 日志消息
   * @param args 额外参数
   */
  i = this.log.bind(this, LogLevel.INFO, false);

  /**
   * 记录信息级别日志（格式化）
   * @param message 日志消息
   * @param args 额外参数
   */
  if = this.log.bind(this, LogLevel.INFO, true);

  /**
   * 记录警告级别日志
   * @param message 日志消息
   * @param args 额外参数
   */
  w = this.log.bind(this, LogLevel.WARN, false);

  /**
   * 记录警告级别日志（格式化）
   * @param message 日志消息
   * @param args 额外参数
   */
  wf = this.log.bind(this, LogLevel.WARN, true);

  /**
   * 记录错误级别日志
   * @param message 日志消息
   * @param args 额外参数
   */
  e = this.log.bind(this, LogLevel.ERROR, false);

  /**
   * 记录错误级别日志（格式化）
   * @param message 日志消息
   * @param args 额外参数
   */
  ef = this.log.bind(this, LogLevel.ERROR, true);
}
