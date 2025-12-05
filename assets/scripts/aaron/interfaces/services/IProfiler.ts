import { Texture2D } from 'cc';

import { IService } from '../IService';

/**
 * 性能分析器接口
 */
export interface IProfiler extends IService {
  /** 当前纹理数量 */
  get textureCount(): number;

  /**
   * 打印纹理日志
   * @param hashOrTexture 纹理哈希值或者纹理对象
   */
  dumpTextureLog(hashOrTexture: number | Texture2D): void;

  /**
   * 获取纹理缓存
   * @param hash 纹理哈希值
   * @returns 纹理缓存
   */
  getTextureCache(hash: number): Texture2D | undefined;

  /** 打印纹理列表 */
  dumpTextures(): void;

  /** 重载网页 */
  reload(): void;

  /**
   * 添加调试项到面板
   * @param key 调试项唯一标识
   * @param title 显示标题
   * @param getter 值获取函数，返回值可以包含"\n"换行符，会自动转换为HTML换行
   * @returns 创建的 HTML 元素
   */
  addDebugItem(key: string, title: string, getter: () => string | number | undefined | null): HTMLElement | null;

  /**
   * 从面板移除调试项
   * @param key 调试项唯一标识
   */
  removeDebugItem(key: string): void;
}


/**
 * Debug Panel Type Definitions
 * Provides type definitions for the global DebugPanel interface
 */
declare global {
  /**
   * Global DebugPanel interface for managing debug information
   */
  interface DebugPanelInterface {
    /**
     * Show the debug panel
     */
    show(): void;

    /**
     * Hide the debug panel
     */
    hide(): void;

    /**
     * Toggle the debug panel visibility (minimize/maximize)
     */
    toggle(): void;

    /**
     * Add a new debug item to the panel with a getter function
     * @param key - Unique identifier for the debug item
     * @param title - Display title for the debug item
     * @param getter - Function that returns the current value for the debug item. Return value can contain "\n" which will be converted to HTML line breaks
     * @returns The created HTML element
     */
    addItem(key: string, title: string, getter: () => string | number | undefined | null): HTMLElement;

    /**
     * Update all debug item values by calling their getter functions
     */
    update(): void;

    /**
     * Remove a debug item from the panel
     * @param key - Unique identifier of the debug item to remove
     */
    removeItem(key: string): void;

    /**
     * Clear all debug items from the panel
     */
    clear(): void;
  }

  /**
   * Global DebugPanel instance
   */
  var debugPanel: DebugPanelInterface;

  /**
   * Window interface extension to include DebugPanel
   */
  interface Window {
    debugPanel: DebugPanelInterface;
  }
}

/**
 * Debug item configuration interface
 */
export interface DebugItem {
  key: string;
  title: string;
  value: string;
}

/**
 * Debug panel configuration options
 */
export interface DebugPanelConfig {
  /**
   * Initial position of the panel
   */
  position?: {
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
  };

  /**
   * Initial size of the panel
   */
  size?: {
    width?: number;
    height?: number;
  };

  /**
   * Whether to show the panel initially
   */
  visible?: boolean;

  /**
   * Whether the panel starts minimized
   */
  minimized?: boolean;

  /**
   * Custom CSS class for styling
   */
  className?: string;
}
