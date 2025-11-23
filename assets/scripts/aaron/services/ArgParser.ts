import { Service } from '../core';
import { IArgParser, ILaunchOptions, type IGlobalAdapter } from '../interfaces';
import { DEFAULT_LAUNCH_OPTIONS, SERVICES } from '../macro';
import { Dict } from '../types';

/**
 * 参数解析器服务
 */
export class ArgParser extends Service implements IArgParser {
  /** 参数 */
  public args: ILaunchOptions = { ...DEFAULT_LAUNCH_OPTIONS };

  parse(args: Dict) {
    const globalAdapter = this.resolve<IGlobalAdapter>(SERVICES.GLOBAL_ADAPTER);
    if (globalAdapter?.has('location')) {
      const url = globalAdapter.get<Location>('location')?.href ?? '';
      const query = url.split('?');
      if (query.length == 2) {
        const pairs = query[1].split('&');
        for (let i = 0, l = pairs.length, key: string, value: string; i < l; i++) {
          [key, value] = pairs[i].split('=');
          this.args[key] = decodeURIComponent(value || '');
        }
      }
    }

    if (args !== undefined) {
      this.args = { ...this.args, ...args };
    }
  }

  isEnv(env: ILaunchOptions['env']) {
    return this.args.env === env;
  }

  get isDev() {
    return this.isEnv('dev');
  }

  get isDebug() {
    return this.isEnv('debug');
  }

  get isProd() {
    return this.isEnv('prod');
  }
}
