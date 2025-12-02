import { EDITOR, DEV, BUILD } from 'cc/env';
import * as fk from '../aaron';
import { TableRole, TableDialogue, ITblDialogue, ITblRole } from './data/table';
import { ResPath } from './data/ResPath';
import { UserInfoController } from './controller/UserInfoController';

/** 当前环境 */
const env = BUILD ? 'prod' : DEV ? 'dev' : 'debug';

/** 根据环境切换配置 */
const optionsMapping: Record<'dev' | 'debug' | 'prod', fk.IPartialLaunchOptions> = {
  dev: {
    appName: 'Midnight Stroll',
    logLevel: fk.LogLevel.DEBUG,
    env: 'dev',
  },
  debug: {
    appName: 'Midnight Stroll',
    logLevel: fk.LogLevel.INFO,
    env: 'debug',
  },
  prod: {
    appName: 'Midnight Stroll',
    logLevel: fk.LogLevel.WARN,
    env: 'prod',
  },
};

/**
 * 主程序入口
 *
 * 1. 初始化游戏框架
 * 2. 加载表格
 * 3. 解析表格
 * 4. 打印表格
 * 5. 播放背景音乐
 */
async function main() {
  fk.aaron.logger.i('✅ 游戏框架初始化完成');

  // 挂载全局变量 fk
  fk.aaron.globalAdapter.set('fk', fk);

  // 解析表格
  console.time('🕒 解析表格');
  fk.aaron.tableQuery.registerBatch(TableDialogue, TableRole);
  await Promise.all([fk.ReferTable.Load(ResPath.Tbl.Dialogue), fk.ReferTable.Load(ResPath.Tbl.Role)]);
  console.timeEnd('🕒 解析表格');

  // 查询表格
  console.time('🕒 查询表格');
  fk.aaron.logger.d('🔍 查询表格 Dialogue id=30003:\n  ', fk.aaron.tableQuery.one(TableDialogue.token, 30003));
  fk.aaron.logger.d(
    '🔍 查询表格 Dialogue id=30005 的 text 字段:\n  ',
    fk.aaron.tableQuery.field<ITblDialogue>(TableDialogue.token, 30005, 'text'),
  );
  fk.aaron.logger.d(
    '🔍 查询表格 Role id=1005 的字段 name, gender:\n  ',
    fk.aaron.tableQuery.fields<ITblRole>(TableRole.token, 1005, ['name', 'gender']),
  );
  fk.aaron.logger.d(
    '🔍 查询表格 Role 使用字段过滤 gender=2, direction5=true:\n  ',
    fk.aaron.tableQuery.query<ITblRole>(TableRole.token, {
      fields: { gender: 0, direction5: false },
      matchType: 'every',
      amountType: 'many',
      cache: true,
    }),
  );
  fk.aaron.logger.d(
    '🔍 查询表格 Role 使用过滤器 filter:\n  ',
    fk.aaron.tableQuery.query<ITblRole>(TableRole.token, {
      filter: (id, role) =>
        role.gender === 1 && role.direction5 === false && role.damage > 30 && role.param.name == '攻击',
      matchType: 'every',
      amountType: 'many',
    }),
  );
  console.timeEnd('🕒 查询表格');

  // 播放背景音乐
  fk.aaron.audioPlayer.music.play(ResPath.Audio.Msc1, {
    volume: 0.5,
    onStart: (id: number, url: string) => {
      fk.aaron.logger.df('✅ 背景音乐播放开始，ID: {0}, URL: {1}', id, url);
    },
    onRepeat(id: number, url: string, round: number) {
      fk.aaron.logger.df('✅ 背景音乐播放重复，ID: {0}, URL: {1}, 轮次: {2}', id, url, round);
    },
  });

  let lastClickTime = 0; // 记录上次点击时间
  fk.aaron.eventBus.app.on(
    fk.EVENTS.GUI.SCREEN_TAPPED,
    () => {
      // 防止快速点击，300ms 内最多只能触发一次
      const now = fk.time.now();
      if (now - lastClickTime < 300) {
        return;
      }
      lastClickTime = now;

      // 播放点击音效
      fk.aaron.audioPlayer.sound.play(ResPath.Audio.SfxClick);

      // 关闭音效
      fk.aaron.audioPlayer.sound.muted = true;
    },
    this,
  );

  // 弹窗
  fk.aaron.gui.open(UserInfoController.Config, { input: '我是一只鱼' });
}

/**
 * 游戏框架初始化失败回调函数
 * @param err - 初始化失败的错误对象
 */
function onError(err: Error) {
  fk.aaron.logger.e('❌ 游戏框架初始化失败:', err);
}

/** 非编辑器环境才允许初始化 */
if (!EDITOR) {
  // 初始化框架
  fk.init(optionsMapping[env]).then(main).catch(onError);
}
