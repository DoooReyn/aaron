import { aaron, ILaunchOptions, init, LogLevel } from '../aaron';
import { DEBUG, BUILD } from 'cc/env';

/** 根据环境切换配置 */
const optionsMapping: Record<'dev' | 'debug' | 'prod', ILaunchOptions> = {
  dev: {
    logLevel: LogLevel.DEBUG,
    env: 'dev',
  },
  debug: {
    logLevel: LogLevel.INFO,
    env: 'debug',
  },
  prod: {
    logLevel: LogLevel.WARN,
    env: 'prod',
  },
};

/** 当前环境 */
const env = BUILD ? 'prod' : DEBUG ? 'debug' : 'dev';

// 异步初始化框架
init(optionsMapping[env])
  .then(function () {
    aaron.logger.i('✅ 游戏框架初始化完成');
  })
  .catch(function (err) {
    aaron.logger.e('❌ 游戏框架初始化失败:', err);
  });
