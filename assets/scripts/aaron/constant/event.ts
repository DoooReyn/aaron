/**
 * Aaron 框架事件常量定义
 */

/**
 * 框架核心事件常量
 */
export const FRAMEWORK_EVENTS = {
    /** 应用初始化 */
    APP_INIT: 'app:init',

    /** 应用启动 */
    APP_START: 'app:start',

    /** 应用停止 */
    APP_STOP: 'app:stop',

    /** 应用销毁 */
    APP_DESTROY: 'app:destroy',

    /** 模块加载 */
    MODULE_LOAD: 'module:load',

    /** 模块卸载 */
    MODULE_UNLOAD: 'module:unload',

    /** 模块错误 */
    MODULE_ERROR: 'module:error',

    /** 插件加载 */
    PLUGIN_LOAD: 'plugin:load',

    /** 插件卸载 */
    PLUGIN_UNLOAD: 'plugin:unload',

    /** 插件激活 */
    PLUGIN_ACTIVATE: 'plugin:activate',

    /** 插件停用 */
    PLUGIN_DEACTIVATE: 'plugin:deactivate',

    /** 资源加载开始 */
    RESOURCE_LOAD_START: 'resource:load_start',

    /** 资源加载进度 */
    RESOURCE_LOAD_PROGRESS: 'resource:load_progress',

    /** 资源加载完成 */
    RESOURCE_LOAD_COMPLETE: 'resource:load_complete',

    /** 资源加载错误 */
    RESOURCE_LOAD_ERROR: 'resource:load_error',

    /** 场景加载开始 */
    SCENE_LOAD_START: 'scene:load_start',

    /** 场景加载进度 */
    SCENE_LOAD_PROGRESS: 'scene:load_progress',

    /** 场景加载完成 */
    SCENE_LOAD_COMPLETE: 'scene:load_complete',

    /** UI 打开 */
    UI_OPEN: 'ui:open',

    /** UI 关闭 */
    UI_CLOSE: 'ui:close',

    /** UI 显示 */
    UI_SHOW: 'ui:show',

    /** UI 隐藏 */
    UI_HIDE: 'ui:hide',

    /** 错误发生 */
    ERROR_OCCURRED: 'error:occurred',

    /** 警告发生 */
    WARNING_OCCURRED: 'warning:occurred'
} as const;

/**
 * 网络事件常量
 */
export const NETWORK_EVENTS = {
    /** 连接开始 */
    CONNECT_START: 'network:connect_start',

    /** 连接成功 */
    CONNECT_SUCCESS: 'network:connect_success',

    /** 连接失败 */
    CONNECT_FAILED: 'network:connect_failed',

    /** 连接断开 */
    DISCONNECT: 'network:disconnect',

    /** 请求开始 */
    REQUEST_START: 'network:request_start',

    /** 请求成功 */
    REQUEST_SUCCESS: 'network:request_success',

    /** 请求失败 */
    REQUEST_FAILED: 'network:request_failed',

    /** 请求超时 */
    REQUEST_TIMEOUT: 'network:request_timeout'
} as const;

/**
 * 音频事件常量
 */
export const AUDIO_EVENTS = {
    /** 背景音乐开始播放 */
    BGM_PLAY: 'audio:bgm_play',

    /** 背景音乐暂停 */
    BGM_PAUSE: 'audio:bgm_pause',

    /** 背景音乐停止 */
    BGM_STOP: 'audio:bgm_stop',

    /** 音效播放 */
    SFX_PLAY: 'audio:sfx_play',

    /** 音效停止 */
    SFX_STOP: 'audio:sfx_stop',

    /** 音频加载完成 */
    AUDIO_LOADED: 'audio:loaded'
} as const;

/**
 * 生命周期事件常量
 */
export const LIFECYCLE_EVENTS = {
    /** 应用进入前台 */
    APP_SHOW: 'lifecycle:app_show',

    /** 应用进入后台 */
    APP_HIDE: 'lifecycle:app_hide',

    /** 页面显示 */
    PAGE_SHOW: 'lifecycle:page_show',

    /** 页面隐藏 */
    PAGE_HIDE: 'lifecycle:page_hide',

    /** 游戏暂停 */
    GAME_PAUSE: 'lifecycle:game_pause',

    /** 游戏恢复 */
    GAME_RESUME: 'lifecycle:game_resume'
} as const;