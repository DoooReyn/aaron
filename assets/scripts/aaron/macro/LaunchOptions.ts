import { ILaunchOptions, LogLevel } from '../interfaces';

/**
 * 默认启动参数
 */
export const DefaultLaunchOptions: ILaunchOptions = {
  appName: 'Aaron',
  logLevel: LogLevel.INFO,
  env: 'dev',
} as const;
