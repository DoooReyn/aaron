import { ILogger, LogLevel } from '../interfaces';
import { literal } from '../utils';

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

  /**
   * 记录调试级别日志
   * @param message 日志消息
   * @param args 额外参数
   */
  d(message: string, ...args: any[]): void {
    if (this._level <= LogLevel.DEBUG) {
      console.debug('『D』', this.token, message, ...args);
    }
  }

  /**
   * 记录调试级别日志（格式化）
   * @param message 日志消息
   * @param args 额外参数
   */
  df(message: string, ...args: any[]): void {
    if (this._level <= LogLevel.DEBUG) {
      console.debug('『D』', this.token, literal.fmt(message, ...args));
    }
  }

  /**
   * 记录信息级别日志
   * @param message 日志消息
   * @param args 额外参数
   */
  i(message: string, ...args: any[]): void {
    if (this._level <= LogLevel.INFO) {
      console.info('『I』', this.token, message, ...args);
    }
  }

  /**
   * 记录信息级别日志（格式化）
   * @param message 日志消息
   * @param args 额外参数
   */
  if(message: string, ...args: any[]): void {
    if (this._level <= LogLevel.INFO) {
      console.info('『I』', this.token, literal.fmt(message, ...args));
    }
  }

  /**
   * 记录警告级别日志
   * @param message 日志消息
   * @param args 额外参数
   */
  w(message: string, ...args: any[]): void {
    if (this._level <= LogLevel.WARN) {
      console.warn('『W』', this.token, message, ...args);
    }
  }

  /**
   * 记录警告级别日志（格式化）
   * @param message 日志消息
   * @param args 额外参数
   */
  wf(message: string, ...args: any[]): void {
    if (this._level <= LogLevel.WARN) {
      console.warn('『W』', this.token, literal.fmt(message, ...args));
    }
  }

  /**
   * 记录错误级别日志
   * @param message 日志消息
   * @param args 额外参数
   */
  e(message: string, ...args: any[]): void {
    if (this._level <= LogLevel.ERROR) {
      console.error('『E』', this.token, message, ...args);
    }
  }

  /**
   * 记录错误级别日志（格式化）
   * @param message 日志消息
   * @param args 额外参数
   */
  ef(message: string, ...args: any[]): void {
    if (this._level <= LogLevel.ERROR) {
      console.error('『E』', this.token, literal.fmt(message, ...args));
    }
  }
}
