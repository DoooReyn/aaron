/**
 * Aaron 框架插件系统接口定义
 */

import { IAaronApp } from './app';

/**
 * 插件接口
 * 所有插件都必须实现此接口
 */
export interface IPlugin {
    /** 插件名称 */
    name: string;

    /** 插件版本 */
    version: string;

    /** 插件描述 */
    description?: string;

    /** 插件依赖的其他插件 */
    dependencies?: string[];

    /** 插件兼容的框架版本 */
    aaronVersion?: string;

    /**
     * 安装插件
     * @param app 应用实例
     */
    install(app: IAaronApp): Promise<void> | void;

    /**
     * 卸载插件
     * @param app 应用实例
     */
    uninstall(app: IAaronApp): Promise<void> | void;

    /**
     * 插件激活时调用
     */
    activate?(): Promise<void> | void;

    /**
     * 插件停用时调用
     */
    deactivate?(): Promise<void> | void;
}

/**
 * 插件生命周期钩子接口
 */
export interface IPluginLifecycle {
    /** 插件加载前 */
    beforeLoad?(plugin: IPlugin): void;

    /** 插件加载后 */
    afterLoad?(plugin: IPlugin): void;

    /** 插件激活前 */
    beforeActivate?(plugin: IPlugin): void;

    /** 插件激活后 */
    afterActivate?(plugin: IPlugin): void;

    /** 插件停用前 */
    beforeDeactivate?(plugin: IPlugin): void;

    /** 插件停用后 */
    afterDeactivate?(plugin: IPlugin): void;

    /** 插件卸载前 */
    beforeUnload?(plugin: IPlugin): void;

    /** 插件卸载后 */
    afterUnload?(plugin: IPlugin): void;
}

/**
 * 插件管理器接口
 */
export interface IPluginManager {
    /** 已加载的插件列表 */
    readonly plugins: IPlugin[];

    /** 已激活的插件列表 */
    readonly activePlugins: IPlugin[];

    /**
     * 加载插件
     * @param plugin 插件实例或插件类
     */
    load(plugin: IPlugin | (new () => IPlugin)): Promise<void>;

    /**
     * 卸载插件
     * @param pluginName 插件名称
     */
    unload(pluginName: string): Promise<void>;

    /**
     * 激活插件
     * @param pluginName 插件名称
     */
    activate(pluginName: string): Promise<void>;

    /**
     * 停用插件
     * @param pluginName 插件名称
     */
    deactivate(pluginName: string): Promise<void>;

    /**
     * 获取插件
     * @param pluginName 插件名称
     */
    getPlugin(pluginName: string): IPlugin | null;

    /**
     * 检查插件是否已加载
     * @param pluginName 插件名称
     */
    isLoaded(pluginName: string): boolean;

    /**
     * 检查插件是否已激活
     * @param pluginName 插件名称
     */
    isActive(pluginName: string): boolean;

    /**
     * 清除所有插件
     */
    clear(): Promise<void>;
}

/**
 * 插件元数据接口
 */
export interface IPluginMetadata {
    /** 插件名称 */
    name: string;

    /** 插件版本 */
    version: string;

    /** 插件描述 */
    description?: string;

    /** 插件作者 */
    author?: string;

    /** 插件主页 */
    homepage?: string;

    /** 插件仓库地址 */
    repository?: string;

    /** 插件许可证 */
    license?: string;

    /** 关键词标签 */
    keywords?: string[];

    /** 插件依赖 */
    dependencies?: string[];

    /** 插件兼容的框架版本 */
    aaronVersion?: string;

    /** 插件分类 */
    category?: string;

    /** 插件图标 */
    icon?: string;
}