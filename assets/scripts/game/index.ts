import { EDITOR, DEV, BUILD } from 'cc/env';
import * as fk from '../aaron';
import { TableRole, TableDialogue, ITblDialogue, ITblRole } from './data/table';
import { BufferAsset } from 'cc';

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

/** 当前环境 */
const env = BUILD ? 'prod' : DEV ? 'dev' : 'debug';

if (!EDITOR) {
  // 初始化框架
  fk.init(optionsMapping[env])
    .then(async function () {
      fk.aaron.logger.i('✅ 游戏框架初始化完成');
      fk.aaron.globalAdapter.set('fk', fk);

      console.time('🕒 加载表格');
      await fk.aaron.resLoader.loadMany([
        [BufferAsset, { path: 'l:resources@TableDialogue', cacheExpires: 10000 }],
        [BufferAsset, { path: 'l:resources@TableRole', cacheExpires: 10000 }],
      ]);
      console.timeEnd('🕒 加载表格');

      console.time('🕒 解析表格');
      const txtDialogue = fk.aaron.resCache.get<BufferAsset>('l:resources@TableDialogue');
      const txtRole = fk.aaron.resCache.get<BufferAsset>('l:resources@TableRole');
      fk.aaron.tableQuery.registerBatch(TableDialogue, TableRole);
      await Promise.all([
        fk.aaron.tableQuery.parse(txtDialogue.name, new Uint8Array(txtDialogue.buffer())),
        fk.aaron.tableQuery.parse(txtRole.name, new Uint8Array(txtRole.buffer())),
      ]);
      console.timeEnd('🕒 解析表格');

      console.time('🕒 打印表格');
      fk.aaron.logger.d('🔍 查询表格 Dialogue id=30003:\n  ', fk.aaron.tableQuery.one(TableDialogue.token, 30003));
      fk.aaron.logger.d(
        '🔍 查询表格 Dialogue id=30005 的 text 字段:\n  ',
        fk.aaron.tableQuery.field<ITblDialogue>(TableDialogue.token, 30005, 'text')
      );
      fk.aaron.logger.d(
        '🔍 查询表格 Role id=1005 的字段 name, gender:\n  ',
        fk.aaron.tableQuery.fields<ITblRole>(TableRole.token, 1005, ['name', 'gender'])
      );
      fk.aaron.logger.d(
        '🔍 查询表格 Role 使用字段过滤 gender=2, direction5=true:\n  ',
        fk.aaron.tableQuery.query<ITblRole>(TableRole.token, {
          fields: { gender: 0, direction5: false },
          matchType: 'every',
          amountType: 'many',
          cache: true,
        })
      );
      fk.aaron.logger.d(
        '🔍 查询表格 Role 使用过滤器 filter:\n  ',
        fk.aaron.tableQuery.query<ITblRole>(TableRole.token, {
          filter: (id, role) =>
            role.gender === 1 && role.direction5 === false && role.damage > 30 && role.param.name == '攻击',
          matchType: 'every',
          amountType: 'many',
        })
      );
      console.timeEnd('🕒 打印表格');
    })
    .catch(function (err) {
      fk.aaron.logger.e('❌ 游戏框架初始化失败:', err);
    });
}
