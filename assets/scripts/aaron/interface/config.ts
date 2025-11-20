/**
 * Aaron 框架配置相关接口定义
 */

/**
 * 框架主配置接口
 */
export interface IAaronConfig {
    /** 是否开启调试模式 */
    debug?: boolean;

    /** 日志级别 */
    logLevel?: LogLevel;

    /** 模块配置列表 */
    modules?: IModuleConfig[];

    /** 错误处理器配置 */
    errorHandler?: IErrorHandlerConfig;

    /** 插件列表 */
    plugins?: IPluginConfig[];

    /** 扩展配置 */
    extensions?: IExtensionConfig;

    /** 自定义配置 */
    custom?: Record<string, any>;
}

/**
 * 日志级别枚举
 */
export enum LogLevel {
    /** 不输出日志 */
    NONE = 0,
    /** 错误日志 */
    ERROR = 1,
    /** 警告日志 */
    WARN = 2,
    /** 信息日志 */
    INFO = 3,
    /** 调试日志 */
    DEBUG = 4,
    /** 详细日志 */
    VERBOSE = 5
}

/**
 * 模块配置接口
 */
export interface IModuleConfig {
    /** 模块名称 */
    name: string;

    /** 是否启用该模块 */
    enabled: boolean;

    /** 模块优先级（数字越小优先级越高） */
    priority: number;

    /** 模块依赖的其他模块 */
    dependencies?: string[];

    /** 模块特定配置 */
    config?: Record<string, any>;
}

/**
 * 错误处理器配置接口
 */
export interface IErrorHandlerConfig {
    /** 是否启用全局错误捕获 */
    enabled: boolean;

    /** 是否在控制台输出错误 */
    logToConsole: boolean;

    /** 是否上报错误到服务器 */
    reportToServer: boolean;

    /** 错误上报地址 */
    reportUrl?: string;

    /** 自定义错误处理函数 */
    customHandler?: (error: Error, context?: string) => void;
}

/**
 * 插件配置接口
 */
export interface IPluginConfig {
    /** 插件名称 */
    name: string;

    /** 是否启用该插件 */
    enabled: boolean;

    /** 插件配置 */
    config?: Record<string, any>;
}

/**
 * 扩展配置接口
 */
export interface IExtensionConfig {
    /** 是否允许动态加载模块 */
    dynamicLoading: boolean;

    /** 模块加载超时时间（毫秒） */
    loadTimeout: number;

    /** 扩展点配置 */
    extensionPoints?: Record<string, any>;
}