/**
 * 消息模板常量
 *
 * 统一管理整个框架中的消息模板
 *
 * 使用方式：
 * ```typescript
 * import { Message } from '../macro/Message';
 *
 * // 在 GUI 服务中使用
 * export class Gui {
 *   private static readonly MESSAGES = Message.GUI;
 *   private _logView(message: string, ...args: any[]) {
 *     console.log(this.MESSAGES.CATEGORY + message, ...args);
 *   }
 * }
 *
 * // 在资源服务中使用
 * export class ResourceManager {
 *   private static readonly MESSAGES = Message.RESOURCE;
 *   private _log(message: string, ...args: any[]) {
 *     console.log(this.MESSAGES.CATEGORY + message, ...args);
 *   }
 * }
 *
 * // 在音频服务中使用
 * export class AudioManager {
 *   private static readonly MESSAGES = Message.AUDIO;
 *   private _log(message: string, ...args: any[]) {
 *     console.log(this.MESSAGES.CATEGORY + message, ...args);
 *   }
 * }
 * ```
 */

export namespace Message {
  /** GUI 服务相关消息 */
  export const GUI = {
    // 消息类别前缀
    CATEGORY: '📷 视图: ',

    // 注册相关消息
    REGISTERED: '{0} 已经注册',
    REGISTER_DUPLICATE: '{0} 重复注册, 已跳过',
    REGISTER_REPLACED: '{0} 已经注册, 已替换',
    UNREGISTERED: '{0} 未注册',

    // 实例创建相关消息
    CREATE_PARENT_INVALID: '{0} 创建实例失败，父节点无效',
    CREATE_CONFIG_INVALID: '{0} 创建实例失败，配置无效',
    CREATE_PREFAB_INVALID: '{0} <{1}> 创建实例失败，未能正确识别预制体',

    // 实例操作消息
    INSTANCE_FROM_CACHE: '{0} 从缓存创建',
    INSTANCE_FROM_PREFAB: '{0} 从实例创建',
    INSTANCE_CLOSED: '{0} 关闭',

    // 动画相关消息
    ANIMATION_ENTER: '{0} 播放进入动画 {1}',
    ANIMATION_EXIT: '{0} 播放退出动画 {1}',

    // 参数验证消息
    FETCH_CONFIG_INVALID: 'fetchConfig 参数无效',
    FETCH_CONFIG_TYPE_UNSUPPORTED: 'fetchConfig 不支持的参数类型: {0}',
  } as const;

  /** 资源管理相关消息 */
  export const RESOURCE = {
    CATEGORY: '📦 资源: ',
  } as const;

  /** 音频管理相关消息 */
  export const AUDIO = {
    CATEGORY: '🔊 音频: ',
  } as const;

  /** 网络相关消息 */
  export const NETWORK = {
    CATEGORY: '🌐 网络: ',
  } as const;

  /** 数据管理相关消息 */
  export const DATA = {
    CATEGORY: '💾 数据: ',
  } as const;

  /** 计时器相关消息 */
  export const TIMER = {
    CATEGORY: '⏰ 计时器: ',
  } as const;

  /** 工具相关消息 */
  export const UTIL = {
    CATEGORY: '🛠️ 工具: ',
  } as const;

  /** 应用程序相关消息 */
  export const APP = {
    CATEGORY: '🚀 应用: ',
  } as const;
}