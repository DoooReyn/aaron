/**
 * Aaron 框架错误处理相关接口定义
 */

// 扩展 Error 构造函数类型以支持 captureStackTrace
declare global {
    interface ErrorConstructor {
        captureStackTrace?(targetObject: Object, constructorOpt?: Function): void;
    }
}

/**
 * 框架错误类型枚举
 */
export enum AaronErrorType {
    /** 初始化错误 */
    INIT_ERROR = 'INIT_ERROR',

    /** 模块错误 */
    MODULE_ERROR = 'MODULE_ERROR',

    /** 资源错误 */
    RESOURCE_ERROR = 'RESOURCE_ERROR',

    /** 运行时错误 */
    RUNTIME_ERROR = 'RUNTIME_ERROR',

    /** 网络错误 */
    NETWORK_ERROR = 'NETWORK_ERROR',

    /** 配置错误 */
    CONFIG_ERROR = 'CONFIG_ERROR',

    /** 插件错误 */
    PLUGIN_ERROR = 'PLUGIN_ERROR',

    /** 依赖注入错误 */
    DEPENDENCY_ERROR = 'DEPENDENCY_ERROR',

    /** 生命周期错误 */
    LIFECYCLE_ERROR = 'LIFECYCLE_ERROR'
}

/**
 * 错误严重级别枚举
 */
export enum ErrorSeverity {
    /** 低级别 - 警告 */
    LOW = 'low',

    /** 中级别 - 一般错误 */
    MEDIUM = 'medium',

    /** 高级别 - 严重错误 */
    HIGH = 'high',

    /** 致命级别 - 导致应用崩溃 */
    CRITICAL = 'critical'
}

/**
 * 框架错误基类
 */
export class AaronError extends Error {
    /** 错误类型 */
    public readonly type: AaronErrorType;

    /** 错误严重级别 */
    public readonly severity: ErrorSeverity;

    /** 错误上下文 */
    public readonly context?: string;

    /** 错误代码 */
    public readonly code?: string;

    /** 错误发生时间 */
    public readonly timestamp: number;

    /** 原始错误对象 */
    public readonly originalError?: Error;

    constructor(
        type: AaronErrorType,
        message: string,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        context?: string,
        code?: string,
        originalError?: Error
    ) {
        super(message);
        this.name = 'AaronError';
        this.type = type;
        this.severity = severity;
        this.context = context;
        this.code = code;
        this.timestamp = Date.now();
        this.originalError = originalError;

        // 保持堆栈跟踪
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * 获取错误的详细信息
     */
    getDetails(): Record<string, any> {
        return {
            type: this.type,
            severity: this.severity,
            message: this.message,
            context: this.context,
            code: this.code,
            timestamp: this.timestamp,
            stack: this.stack,
            originalError: this.originalError ? {
                message: this.originalError.message,
                stack: this.originalError.stack
            } : undefined
        };
    }

    /**
     * 转换为 JSON 对象
     */
    toJSON(): Record<string, any> {
        return this.getDetails();
    }
}

/**
 * 错误处理器接口
 */
export interface IErrorHandler {
    /**
     * 处理错误
     * @param error 错误对象
     * @param context 错误上下文
     */
    handle(error: Error, context?: string): void;

    /**
     * 是否可以处理指定类型的错误
     * @param error 错误对象
     */
    canHandle(error: Error): boolean;

    /** 错误处理器优先级 */
    readonly priority: number;
}

/**
 * 错误管理器接口
 */
export interface IErrorManager {
    /** 是否启用全局错误捕获 */
    readonly enabled: boolean;

    /** 错误处理器列表 */
    readonly handlers: IErrorHandler[];

    /**
     * 注册错误处理器
     * @param handler 错误处理器
     */
    registerHandler(handler: IErrorHandler): void;

    /**
     * 移除错误处理器
     * @param handler 错误处理器
     */
    removeHandler(handler: IErrorHandler): void;

    /**
     * 处理错误
     * @param error 错误对象
     * @param context 错误上下文
     */
    handle(error: Error, context?: string): void;

    /**
     * 启用全局错误捕获
     */
    enable(): void;

    /**
     * 禁用全局错误捕获
     */
    disable(): void;

    /**
     * 清除所有错误处理器
     */
    clear(): void;

    /**
     * 获取错误统计信息
     */
    getStats(): IErrorStats;
}

/**
 * 错误统计信息接口
 */
export interface IErrorStats {
    /** 总错误数 */
    total: number;

    /** 按类型分组的错误数 */
    byType: Record<string, number>;

    /** 按严重级别分组的错误数 */
    bySeverity: Record<string, number>;

    /** 最近错误列表 */
    recentErrors: Array<{
        type: string;
        message: string;
        timestamp: number;
    }>;
}

/**
 * 错误报告器接口
 */
export interface IErrorReporter {
    /**
     * 上报错误
     * @param error 错误对象
     * @param context 错误上下文
     */
    report(error: Error, context?: string): Promise<void>;

    /** 是否启用 */
    readonly enabled: boolean;

    /** 上报 URL */
    readonly url?: string;
}