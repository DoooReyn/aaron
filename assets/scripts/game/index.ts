import { Aaron, init, LogLevel } from '../aaron';

import { DEBUG, BUILD } from 'cc/env';

// 异步初始化框架
init(
  {
    dev: {
      logLevel: LogLevel.DEBUG,
    },
    debug: {
      logLevel: LogLevel.INFO,
    },
    prod: {
      logLevel: LogLevel.WARN,
    },
  }[BUILD ? 'prod' : DEBUG ? 'debug' : 'dev']
)
  .then(() => {
    Aaron.Shared.logger.i('✅ 游戏框架初始化完成');
  })
  .catch((error) => {
    Aaron.Shared.logger.e('❌ 游戏框架初始化失败:', error);
  });
