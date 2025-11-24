import { aaron, ILaunchOptions, init, LogLevel } from '../aaron';
import { EDITOR, DEV, BUILD } from 'cc/env';
import * as fk from '../aaron';

/** 根据环境切换配置 */
const optionsMapping: Record<'dev' | 'debug' | 'prod', ILaunchOptions> = {
  dev: {
    appName: 'Midnight Stroll',
    logLevel: LogLevel.DEBUG,
    env: 'dev',
  },
  debug: {
    appName: 'Midnight Stroll',
    logLevel: LogLevel.INFO,
    env: 'debug',
  },
  prod: {
    appName: 'Midnight Stroll',
    logLevel: LogLevel.WARN,
    env: 'prod',
  },
};

/** 当前环境 */
const env = BUILD ? 'prod' : DEV ? 'dev' : 'debug';
if (!EDITOR) {
  // 异步初始化框架
  init(optionsMapping[env])
    .then(function () {
      aaron.logger.i('✅ 游戏框架初始化完成');
      aaron.globalAdapter.set('fk', fk);
    })
    .catch(function (err) {
      aaron.logger.e('❌ 游戏框架初始化失败:', err);
    });
}
