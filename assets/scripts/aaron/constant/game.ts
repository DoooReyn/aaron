/**
 * Aaron 框架游戏相关常量定义
 */

/**
 * 游戏状态枚举
 */
export enum GameState {
    /** 未初始化 */
    UNINITIALIZED = 'uninitialized',

    /** 初始化中 */
    INITIALIZING = 'initializing',

    /** 已初始化 */
    INITIALIZED = 'initialized',

    /** 加载中 */
    LOADING = 'loading',

    /** 运行中 */
    RUNNING = 'running',

    /** 暂停中 */
    PAUSED = 'paused',

    /** 游戏结束 */
    GAME_OVER = 'game_over',

    /** 销毁中 */
    DESTROYING = 'destroying',

    /** 已销毁 */
    DESTROYED = 'destroyed'
}

/**
 * UI 层级常量
 */
export const UI_LAYERS = {
    /** 背景层 */
    BACKGROUND: 0,

    /** 场景层 */
    SCENE: 100,

    /** 游戏层 */
    GAME: 200,

    /** UI 背景层 */
    UI_BACKGROUND: 300,

    /** UI 默认层 */
    UI_NORMAL: 400,

    /** UI 弹窗层 */
    UI_POPUP: 500,

    /** UI 提示层 */
    UI_TOAST: 600,

    /** UI 加载层 */
    UI_LOADING: 700,

    /** UI 顶层 */
    UI_TOP: 800,

    /** 调试层 */
    DEBUG: 900
} as const;

/**
 * 资源类型常量
 */
export const RESOURCE_TYPES = {
    /** 图片资源 */
    IMAGE: 'image',

    /** 预制体 */
    PREFAB: 'prefab',

    /** 场景 */
    SCENE: 'scene',

    /** 动画剪辑 */
    ANIMATION_CLIP: 'animation-clip',

    /** 音频 */
    AUDIO: 'audio',

    /** 粒子 */
    PARTICLE: 'particle',

    /** 材质 */
    MATERIAL: 'material',

    /** 字体 */
    FONT: 'font',

    /** 纹理 */
    TEXTURE: 'texture',

    /** 精灵帧 */
    SPRITE_FRAME: 'sprite-frame',

    /** 图集 */
    ATLAS: 'atlas',

    /** 瓦片地图 */
    TILED_MAP: 'tiled-map',

    /** JSON 文件 */
    JSON: 'json',

    /** 文本文件 */
    TEXT: 'text',

    /** 二进制文件 */
    BINARY: 'binary',

    /** 自定义类型 */
    CUSTOM: 'custom'
} as const;

/**
 * 平台类型常量
 */
export const PLATFORM_TYPES = {
    /** Web 平台 */
    WEB: 'web',

    /** iOS 平台 */
    IOS: 'ios',

    /** Android 平台 */
    ANDROID: 'android',

    /** Windows 平台 */
    WINDOWS: 'windows',

    /** Mac 平台 */
    MAC: 'mac',

    /** 微信小游戏 */
    WECHAT_GAME: 'wechat-game',

    /** 支付宝小游戏 */
    ALIPAY_GAME: 'alipay-game',

    /** QQ 小游戏 */
    QQ_GAME: 'qq-game',

    /** 百度小游戏 */
    BAIDU_GAME: 'baidu-game',

    /** 字节跳动小游戏 */
    BYTEDANCE_GAME: 'bytedance-game',

    /** OPPO 小游戏 */
    OPPO_GAME: 'oppo-game',

    /** VIVO 小游戏 */
    VIVO_GAME: 'vivo-game',

    /** 华为快游戏 */
    HUAWEI_GAME: 'huawei-game',

    /** 小米快游戏 */
    XIAOMI_GAME: 'xiaomi-game',

    /** 4399 游戏 */
    ["4399_GAME"]: '4399-game',

    /** 未识别平台 */
    UNKNOWN: 'unknown'
} as const;

/**
 * 日志级别常量
 */
export const LOG_LEVELS = {
    /** 关闭日志 */
    OFF: 0,

    /** 错误级别 */
    ERROR: 1,

    /** 警告级别 */
    WARN: 2,

    /** 信息级别 */
    INFO: 3,

    /** 调试级别 */
    DEBUG: 4,

    /** 详细级别 */
    VERBOSE: 5
} as const;