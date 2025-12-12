import { ILogger, LogLevel } from '../interfaces';
import { Constructor } from '../types';
import { literal } from '../utils';

/**
 * 日志分级标识
 */
const LoggerFlags: Record<keyof typeof LogLevel, string> = {
  DEBUG: '🐤',
  INFO: '🐓',
  WARN: '🦩',
  ERROR: '🐦',
  NONE: '🦢',
};

/**
 * 上下文
 */
interface LoggerContext {
  level: keyof typeof LogLevel;
  token: string;
  content: any[];
  timestamp: number;
  stack?: string;
}

/**
 * 输出控制器
 */
export abstract class LoggerAppender {
  abstract output(context: LoggerContext): void;
}

/**
 * 控制台输出控制器
 */
class ConsoleAppender extends LoggerAppender {
  output(context: LoggerContext): void {
    const flag = LoggerFlags[context.level];
    if (context.stack) {
      console.log(flag, context.token, ...context.content, context.stack);
    } else {
      console.log(flag, context.token, ...context.content);
    }
  }
}

/**
 */

/**
 * 日志
 *
 * 提供统一的日志记录功能，支持不同级别的日志输出
 *
 * 文件输出控制器
 * @example
 * ```typescript
 * class FileAppender extends LoggerAppender {
 *   private _date = new Date();
 *   output(context: LoggerContext): void {
 *     this._date.setTime(context.timestamp);
 *     const flag = LoggerFlags[context.level];
 *     let content = [
 *       this._date.toLocaleString(),
 *       flag,
 *       context.token,
 *       context.content.map(String).join(' ')
 *     ].join(' ');
 *     if (context.stack) {
 *       content += context.stack;
 *     }
 *     // @todo 写入文件或文件流
 *     // writeStream.append(content);
 *     // writeStream.append('\n');
 *   }
 * }
 * ```
 */
export class Logger implements ILogger {
  /** 当前日志等级 */
  private _level: LogLevel = LogLevel.DEBUG;

  /** 输出控制器列表，默认内置控制台输出 */
  private static _appenders: LoggerAppender[] = [new ConsoleAppender()];

  /**
   * 日志构造
   * @param token 日志标识
   */
  constructor(public readonly token: string) {}

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

  /**
   * 输出日志
   * @param level 日志等级
   * @param fmt 是否格式化
   * @param message 消息
   * @param args 入参
   */
  private log(level: LogLevel, fmt: boolean, message: string, ...args: any[]): void {
    if (this._level <= level) {
      const content = fmt ? [literal.fmt(message, ...args)] : [message, ...args];
      const context: LoggerContext = {
        level: LogLevel[level] as keyof typeof LogLevel,
        token: this.token,
        content,
        timestamp: Date.now(),
      };
      if (level >= LogLevel.WARN) {
        context.stack = '\n' + new Error().stack.split('\n').slice(2).join('\n');
      }
      Logger._appenders.forEach((v) => v.output(context));
    }
  }

  /**
   * 添加输出控制器
   * @param cls 输出控制器
   */
  public static addAppender(cls: Constructor<LoggerAppender>) {
    this._appenders.push(new cls());
  }
}
