import { Service } from '../core';
import { ILogger, LogLevel } from '../interfaces';
import { literal } from '../utils';

/**
 * 日志服务
 */
export class Logger extends Service implements ILogger {
  /** 当前日志等级 */
  private _level: LogLevel = LogLevel.INFO;

  d(message: string, ...args: any[]): void {
    if (this._level <= LogLevel.DEBUG) {
      console.debug(`😑 ${message}`, ...args);
    }
  }

  df(message: string, ...args: any[]): void {
    if (this._level <= LogLevel.DEBUG) {
      message = literal.fmt(message, ...args);
      if (message == undefined) debugger;
      console.debug(`😑 ${message}`);
    }
  }

  i(message: string, ...args: any[]): void {
    if (this._level <= LogLevel.INFO) {
      console.info(`😊 ${message}`, ...args);
    }
  }

  if(message: string, ...args: any[]): void {
    if (this._level <= LogLevel.INFO) {
      message = literal.fmt(message, ...args);
      console.info(`😊 ${message}`);
    }
  }

  w(message: string, ...args: any[]): void {
    if (this._level <= LogLevel.WARN) {
      console.warn(`🤔 ${message}`, ...args);
    }
  }

  wf(message: string, ...args: any[]): void {
    if (this._level <= LogLevel.WARN) {
      message = literal.fmt(message, ...args);
      console.warn(`🤔 ${message}`);
    }
  }

  e(message: string, ...args: any[]): void {
    if (this._level <= LogLevel.ERROR) {
      console.error(`😭 ${message}`, ...args);
    }
  }

  ef(message: string, ...args: any[]): void {
    if (this._level <= LogLevel.ERROR) {
      message = literal.fmt(message, ...args);
      console.error(`😭 ${message}`);
    }
  }

  getLevel(): LogLevel {
    return this._level;
  }

  setLevel(level: LogLevel): void {
    this._level = level;
  }
}
