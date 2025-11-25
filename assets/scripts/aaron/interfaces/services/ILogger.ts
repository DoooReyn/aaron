import { IService } from '../IService';

/**
 * 日志服务接口
 *
 * 提供统一的日志记录功能，支持不同级别的日志输出
 */
export interface ILogger extends IService {
  /**
   * 记录调试级别日志
   * @param message 日志消息
   * @param args 额外参数
   */
  d(message: string, ...args: any[]): void;
  /**
   * 记录调试级别日志（格式化）
   * @param message 日志消息
   * @param args 额外参数
   */
  df(message: string, ...args: any[]): void;
  /**
   * 记录信息级别日志
   * @param message 日志消息
   * @param args 额外参数
   */
  i(message: string, ...args: any[]): void;
  /**
   * 记录信息级别日志（格式化）
   * @param message 日志消息
   * @param args 额外参数
   */
  if(message: string, ...args: any[]): void;
  /**
   * 记录警告级别日志
   * @param message 日志消息
   * @param args 额外参数
   */
  w(message: string, ...args: any[]): void;
  /**
   * 记录警告级别日志（格式化）
   * @param message 日志消息
   * @param args 额外参数
   */
  wf(message: string, ...args: any[]): void;
  /**
   * 记录错误级别日志
   * @param message 日志消息
   * @param args 额外参数
   */
  e(message: string, ...args: any[]): void;
  /**
   * 记录错误级别日志（格式化）
   * @param message 日志消息
   * @param args 额外参数
   */
  ef(message: string, ...args: any[]): void;
  /**
   * 设置日志级别
   * @param level 日志级别
   */
  setLevel(level: LogLevel): void;
  /**
   * 获取当前日志级别
   * @returns 当前日志级别
   */
  getLevel(): LogLevel;
}

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
