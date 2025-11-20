/**
 * Aaron 框架主入口文件
 *
 * 这是框架的统一入口点，提供所有公共 API
 */

// 导出接口定义
export * from '../test/interfaces';

// 导出依赖注入系统
export * from './di';

// 导出工具函数
export * from './utils';

// 导出常量
export * from './constant';

// 版本信息
export const VERSION = '1.0.0';

// 框架信息
export const FRAMEWORK_INFO = {
    name: 'Aaron Framework',
    version: VERSION,
    description: '基于 Cocos Creator 3.8 的轻量级 2D 游戏框架',
    author: 'Aaron Team',
    homepage: 'https://github.com/aaron-framework/aaron'
};

/**
 * 框架初始化函数
 * 这是一个快速初始化函数，用于简化框架的使用
 */
export async function init(config?: any): Promise<void> {
    console.log(`🚀 初始化 ${FRAMEWORK_INFO.name} v${VERSION}`);

    // 这里将来会实现完整的初始化逻辑
    // 目前只是打印信息

    console.log('✅ 框架初始化完成');
}

/**
 * 获取依赖注入管理器实例
 */
export { diManager } from './di';