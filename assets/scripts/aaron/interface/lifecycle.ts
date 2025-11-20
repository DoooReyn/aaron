/**
 * Aaron 框架生命周期相关接口定义
 */

import { IAaronApp } from './app';
import { IAaronConfig } from './config';

/**
 * 生命周期阶段枚举
 */
export enum LifecyclePhase {
    /** 初始化前 */
    BEFORE_INIT = 'before_init',

    /** 初始化中 */
    INIT = 'init',

    /** 初始化后 */
    AFTER_INIT = 'after_init',

    /** 启动前 */
    BEFORE_START = 'before_start',

    /** 启动中 */
    START = 'start',

    /** 启动后 */
    AFTER_START = 'after_start',

    /** 停止前 */
    BEFORE_STOP = 'before_stop',

    /** 停止中 */
    STOP = 'stop',

    /** 停止后 */
    AFTER_STOP = 'after_stop',

    /** 销毁前 */
    BEFORE_DESTROY = 'before_destroy',

    /** 销毁中 */
    DESTROY = 'destroy',

    /** 销毁后 */
    AFTER_DESTROY = 'after_destroy'
}

/**
 * 生命周期钩子接口
 */
export interface ILifecycleHooks {
    /** 初始化前钩子 */
    beforeInit?(config: IAaronConfig): Promise<void> | void;

    /** 初始化后钩子 */
    afterInit?(app: IAaronApp): Promise<void> | void;

    /** 启动前钩子 */
    beforeStart?(): Promise<void> | void;

    /** 启动后钩子 */
    afterStart?(): Promise<void> | void;

    /** 停止前钩子 */
    beforeStop?(): Promise<void> | void;

    /** 停止后钩子 */
    afterStop?(): Promise<void> | void;

    /** 销毁前钩子 */
    beforeDestroy?(): Promise<void> | void;

    /** 销毁后钩子 */
    afterDestroy?(): Promise<void> | void;

    /** 错误处理钩子 */
    onError?(error: Error, context?: string): Promise<void> | void;

    /** 自定义钩子 */
    [key: string]: ((...args: any[]) => Promise<void> | void) | undefined;
}

/**
 * 生命周期管理器接口
 */
export interface ILifecycleManager {
    /** 当前生命周期阶段 */
    readonly currentPhase: LifecyclePhase;

    /** 生命周期钩子列表 */
    readonly hooks: ILifecycleHooks;

    /**
     * 注册生命周期钩子
     * @param phase 生命周期阶段
     * @param hook 钩子函数
     */
    registerHook(phase: string, hook: (...args: any[]) => Promise<void> | void): void;

    /**
     * 移除生命周期钩子
     * @param phase 生命周期阶段
     * @param hook 钩子函数
     */
    removeHook(phase: string, hook: (...args: any[]) => Promise<void> | void): void;

    /**
     * 执行生命周期阶段
     * @param phase 生命周期阶段
     * @param args 参数
     */
    executePhase(phase: LifecyclePhase, ...args: any[]): Promise<void>;

    /**
     * 清除所有钩子
     */
    clear(): void;
}

/**
 * 可销毁接口
 * 实现此接口的类可以被正确销毁
 */
export interface IDisposable {
    /**
     * 销毁实例
     */
    dispose(): Promise<void> | void;

    /** 是否已销毁 */
    readonly disposed: boolean;
}

/**
 * 可初始化接口
 * 实现此接口的类需要显式初始化
 */
export interface IInitializable {
    /**
     * 初始化实例
     */
    initialize(): Promise<void> | void;

    /** 是否已初始化 */
    readonly initialized: boolean;
}

/**
 * 可暂停/恢复接口
 */
export interface IPausable {
    /**
     * 暂停
     */
    pause(): void;

    /**
     * 恢复
     */
    resume(): void;

    /** 是否已暂停 */
    readonly paused: boolean;
}