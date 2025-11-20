/**
 * Aaron 框架核心接口定义
 *
 * 本文件定义了 Aaron 框架的核心接口，包括应用主接口、服务容器接口等
 */

import { IAaronConfig } from './config';
import { IPlugin } from "./plugin";

/**
 * Aaron 应用主接口
 * 框架的核心入口，提供初始化、启动、销毁等功能
 */
export interface IAaronApp {
    /** 应用是否已初始化 */
    readonly initialized: boolean;

    /** 应用是否正在运行 */
    readonly running: boolean;

    /** 服务容器实例 */
    readonly serviceContainer: IServiceContainer;

    /** 事件管理器实例 */
    readonly event: IEventManager;

    /** 配置管理器实例 */
    readonly config: IConfigManager;

    /**
     * 初始化应用
     * @param config 应用配置
     */
    init(config: IAaronConfig): Promise<void>;

    /**
     * 启动应用
     */
    start(): Promise<void>;

    /**
     * 停止应用
     */
    stop(): Promise<void>;

    /**
     * 销毁应用
     */
    destroy(): Promise<void>;

    /**
     * 注册插件
     * @param plugin 插件实例
     */
    use(plugin: IPlugin): IAaronApp;

    /**
     * 获取服务实例
     * @param token 服务标识
     */
    getService<T>(token: string): T;
}

/**
 * 服务容器接口
 * 负责管理和解析框架中的所有服务
 */
export interface IServiceContainer {
    /**
     * 注册服务（每次创建新实例）
     * @param token 服务标识
     * @param implementation 服务实现类
     */
    register<T>(token: string, implementation: new () => T): void;

    /**
     * 注册单例服务
     * @param token 服务标识
     * @param implementation 服务实现类
     */
    registerSingleton<T>(token: string, implementation: new () => T): void;

    /**
     * 注册服务实例
     * @param token 服务标识
     * @param instance 服务实例
     */
    registerInstance<T>(token: string, instance: T): void;

    /**
     * 解析服务
     * @param token 服务标识
     */
    resolve<T>(token: string): T;

    /**
     * 检查服务是否已注册
     * @param token 服务标识
     */
    isRegistered(token: string): boolean;

    /**
     * 清除所有服务
     */
    clear(): void;
}

/**
 * 事件管理器接口
 * 负责框架内的事件发布和订阅
 */
export interface IEventManager {
    /**
     * 监听事件
     * @param event 事件名称
     * @param callback 回调函数
     * @param target 回调执行上下文
     */
    on(event: string, callback: Function, target?: any): void;

    /**
     * 监听事件（只触发一次）
     * @param event 事件名称
     * @param callback 回调函数
     * @param target 回调执行上下文
     */
    once(event: string, callback: Function, target?: any): void;

    /**
     * 取消监听事件
     * @param event 事件名称
     * @param callback 回调函数
     * @param target 回调执行上下文
     */
    off(event: string, callback: Function, target?: any): void;

    /**
     * 发布事件
     * @param event 事件名称
     * @param args 事件参数
     */
    emit(event: string, ...args: any[]): void;

    /**
     * 清除所有事件监听
     */
    clear(): void;
}

/**
 * 配置管理器接口
 * 负责管理框架和模块的配置
 */
export interface IConfigManager {
    /**
     * 获取配置值
     * @param key 配置键名，支持点号分隔的嵌套访问
     * @param defaultValue 默认值
     */
    get<T>(key: string, defaultValue?: T): T;

    /**
     * 设置配置值
     * @param key 配置键名
     * @param value 配置值
     */
    set(key: string, value: any): void;

    /**
     * 检查配置是否存在
     * @param key 配置键名
     */
    has(key: string): boolean;

    /**
     * 删除配置
     * @param key 配置键名
     */
    delete(key: string): void;

    /**
     * 合并配置
     * @param config 要合并的配置
     */
    merge(config: Record<string, any>): void;

    /**
     * 重置配置
     */
    reset(): void;
}