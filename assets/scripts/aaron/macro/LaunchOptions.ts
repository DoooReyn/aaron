import { ILaunchOptions, LogLevel } from '../interfaces';

/**
 * 默认启动参数
 */
export const DEFAULT_LAUNCH_OPTIONS: ILaunchOptions = {
  appName: 'Aaron',
  logLevel: LogLevel.INFO,
  env: 'dev',
} as const;
