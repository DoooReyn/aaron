import { Dict } from '../../types';
import { ILaunchOptions } from '../ILaunchOptions';
import { IService } from '../IService';

/**
 * 参数解析器服务接口
 */
export interface IArgParser extends IService {
  /** 输出参数 */
  args: ILaunchOptions;
  /**
   * 解析参数
   * @param args 输入参数
   */
  parse(args: Dict): void;
  /**
   * 是否指定环境
   * @param env 环境
   */
  isEnv(env: ILaunchOptions['env']): boolean;
  /** 是否开发环境 */
  get isDev(): boolean;
  /** 是否测试环境 */
  get isDebug(): boolean;
  /** 是否发布环境 */
  get isProd(): boolean;
}
