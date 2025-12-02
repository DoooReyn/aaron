import { Service } from '../core';
import { RedDotPool } from '../foundation';
import {
  IRedDotConfig,
  IRedDotData,
  IRedDotChangeEvent,
  IRedDotPool,
  ILogger,
  IRedDotContainer,
  IStoreContainer,
  IEventBus,
} from '../interfaces';
import { EVENTS, SERVICES } from '../macro';

/**
 * 红点服务
 */
export class RedDotContainer extends Service implements IRedDotContainer {
  /** 红点配置映射 */
  private _configs: Map<string, IRedDotConfig> = new Map();
  /** 红点数据映射 */
  private _redDots: Map<string, IRedDotData> = new Map();
  /** 状态监听器映射 */
  private _listeners: Map<string, Set<(event: IRedDotChangeEvent) => void>> = new Map();
  /** 红点对象池 */
  private _pool: IRedDotPool = new RedDotPool();
  /** 批量更新队列 */
  private _batchQueue: { id: string; data: any }[] = [];
  /** 是否正在批量更新 */
  private _isBatching: boolean = false;

  /**
   * 注册红点配置
   * @param config 红点配置
   */
  register(config: IRedDotConfig): void {
    if (this._configs.has(config.id)) {
      this.resolve<ILogger>(SERVICES.LOGGER).ef('红点 {0} 已存在，无法重复注册', config.id);
      return;
    }

    this._configs.set(config.id, config);

    // 初始化红点数据
    const redDot = this._pool.acquire();
    redDot.updateTime = Date.now();

    // 如果支持持久化，尝试恢复本地数据
    if (config.persistent) {
      this.__loadFromStorage(config.id, redDot);
    }

    this._redDots.set(config.id, redDot);

    // 处理父子关系
    if (config.parent) {
      const parentConfig = this._configs.get(config.parent);
      if (parentConfig) {
        if (!parentConfig.children) {
          parentConfig.children = [];
        }
        if (!parentConfig.children.includes(config.id)) {
          parentConfig.children.push(config.id);
        }
      }
    }

    this.resolve<ILogger>(SERVICES.LOGGER).df('红点 {0} 注册成功', config.id);
  }

  /**
   * 更新红点数据
   * @param id 红点ID
   * @param data 红点数据
   */
  updateData(id: string, data: any): void {
    const config = this._configs.get(id);
    if (!config) {
      this.resolve<ILogger>(SERVICES.LOGGER).ef('红点 {0} 未注册，无法更新数据', id);
      return;
    }

    const redDot = this._redDots.get(id);
    if (!redDot) {
      this.resolve<ILogger>(SERVICES.LOGGER).ef('红点 {0} 数据不存在', id);
      return;
    }

    // 更新数据
    redDot.data = data;
    redDot.updateTime = Date.now();

    // 评估新状态
    const newVisible = config.rule.evaluate(data);

    if (redDot.visible !== newVisible) {
      redDot.visible = newVisible;

      // 触发状态变化事件
      this.__emitChangeEvent(id, newVisible, data);

      // 更新父红点状态
      this.__updateParentState(id);

      // 持久化处理
      if (config.persistent) {
        this.__saveToStorage(id, redDot);
      }
    }
  }

  /**
   * 获取红点状态
   * @param id 红点ID
   * @returns 是否显示红点
   */
  getState(id: string): boolean {
    const redDot = this._redDots.get(id);
    return redDot ? redDot.visible : false;
  }

  /**
   * 获取红点数据
   * @param id 红点ID
   * @returns 红点状态数据
   */
  getData(id: string): IRedDotData | null {
    const redDot = this._redDots.get(id);
    return redDot ? { ...redDot } : null;
  }

  /**
   * 监听红点状态变化
   * @param id 红点ID
   * @param callback 状态变化回调
   * @returns 取消监听的函数
   */
  subscribe(id: string, callback: (event: IRedDotChangeEvent) => void): () => void {
    if (!this._listeners.has(id)) {
      this._listeners.set(id, new Set());
    }

    this._listeners.get(id)!.add(callback);

    // 返回取消监听的函数
    return () => {
      this.unsubscribe(id, callback);
    };
  }

  /**
   * 取消监听红点状态变化
   * @param id 红点ID
   * @param callback 状态变化回调
   */
  unsubscribe(id: string, callback: (event: IRedDotChangeEvent) => void): void {
    const listeners = this._listeners.get(id);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this._listeners.delete(id);
      }
    }
  }

  /**
   * 批量更新红点数据
   * @param updates 批量更新数据
   */
  batchUpdate(updates: { id: string; data: any }[]): void {
    const changedEvents: IRedDotChangeEvent[] = [];
    const parentIdsToUpdate = new Set<string>();

    this._isBatching = true;

    try {
      updates.forEach((update) => {
        const config = this._configs.get(update.id);
        if (!config) {
          this.resolve<ILogger>(SERVICES.LOGGER).ef('红点 {0} 未注册，无法更新数据', update.id);
          return;
        }

        const redDot = this._redDots.get(update.id);
        if (!redDot) {
          this.resolve<ILogger>(SERVICES.LOGGER).ef('红点 {0} 数据不存在', update.id);
          return;
        }

        // 更新数据
        redDot.data = update.data;
        redDot.updateTime = Date.now();

        // 评估新状态
        const newVisible = config.rule.evaluate(update.data);

        if (redDot.visible !== newVisible) {
          redDot.visible = newVisible;

          // 收集状态变化事件，稍后批量触发
          changedEvents.push({ id: update.id, visible: newVisible, data: update.data });

          // 收集需要更新的父红点ID
          if (config.parent) {
            parentIdsToUpdate.add(config.parent);
          }

          // 持久化处理
          if (config.persistent) {
            this.__saveToStorage(update.id, redDot);
          }
        }
      });

      // 批量更新父红点状态
      parentIdsToUpdate.forEach((parentId) => {
        this.__updateParentState(parentId);
      });

      // 批量触发状态变化事件
      changedEvents.forEach((event) => {
        this.__notifyListeners(event);
        this.__notifyEventBus(event);
      });
    } finally {
      this._isBatching = false;
    }
  }

  /**
   * 清除红点状态
   * @param id 红点ID
   */
  clear(id: string): void {
    const config = this._configs.get(id);
    if (!config) {
      this.resolve<ILogger>(SERVICES.LOGGER).ef('红点 {0} 未注册，无法清除', id);
      return;
    }

    const redDot = this._redDots.get(id);
    if (!redDot) {
      return;
    }

    redDot.visible = false;
    redDot.data = undefined;
    redDot.updateTime = Date.now();

    // 触发状态变化事件
    this.__emitChangeEvent(id, false, undefined);

    // 更新父红点状态
    this.__updateParentState(id);

    // 持久化处理
    if (config.persistent) {
      this.__saveToStorage(id, redDot);
    }
  }

  /**
   * 触发红点点击事件
   * @param id 红点ID
   */
  onClick(id: string): void {
    const config = this._configs.get(id);
    if (!config) {
      this.resolve<ILogger>(SERVICES.LOGGER).ef('红点 {0} 未注册', id);
      return;
    }

    // 自动清除处理
    if (config.autoClear) {
      this.clear(id);
    }
  }

  /**
   * 获取所有红点状态
   * @returns 所有红点状态映射
   */
  getAllStates(): Map<string, IRedDotData> {
    const result = new Map<string, IRedDotData>();
    this._redDots.forEach((redDot, id) => {
      result.set(id, { ...redDot });
    });
    return result;
  }

  /**
   * 检查红点是否存在
   * @param id 红点ID
   * @returns 是否存在
   */
  has(id: string): boolean {
    return this._configs.has(id);
  }

  /**
   * 注销红点
   * @param id 红点ID
   */
  unregister(id: string): void {
    const config = this._configs.get(id);
    if (!config) {
      return;
    }

    // 清理子红点的父引用
    if (config.children) {
      config.children.forEach((childId) => {
        const childConfig = this._configs.get(childId);
        if (childConfig) {
          childConfig.parent = undefined;
        }
      });
    }

    // 清理父红点的子引用
    if (config.parent) {
      const parentConfig = this._configs.get(config.parent);
      if (parentConfig && parentConfig.children) {
        const index = parentConfig.children.indexOf(id);
        if (index !== -1) {
          parentConfig.children.splice(index, 1);
        }
      }
    }

    // 释放红点对象
    const redDot = this._redDots.get(id);
    if (redDot) {
      this._pool.recycle(redDot);
      this._redDots.delete(id);
    }

    // 清理监听器
    this._listeners.delete(id);

    // 删除配置
    this._configs.delete(id);

    this.resolve<ILogger>(SERVICES.LOGGER).wf('红点 {0} 注销成功', id);
  }

  /**
   * 触发状态变化事件
   * @param id 红点ID
   * @param visible 是否可见
   * @param data 红点数据
   */
  private __emitChangeEvent(id: string, visible: boolean, data?: any): void {
    const event: IRedDotChangeEvent = { id, visible, data };

    // 如果不是批量更新模式，立即触发事件
    if (!this._isBatching) {
      this.__notifyListeners(event);
      this.__notifyEventBus(event);
    }
  }

  /**
   * 通知监听器
   * @param event 状态变化事件
   */
  private __notifyListeners(event: IRedDotChangeEvent): void {
    const listeners = this._listeners.get(event.id);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          this.resolve<ILogger>(SERVICES.LOGGER).ef('红点 {0} 状态变化回调执行失败: {1}', event.id, error);
        }
      });
    }
  }

  /**
   * 通知事件总线
   * @param event 状态变化事件
   */
  private __notifyEventBus(event: IRedDotChangeEvent): void {
    this.resolve<IEventBus>(SERVICES.EVENT_BUS).red.emit(EVENTS.GUI.RED_DOT_CHANGED + event.id, event);
  }

  /**
   * 更新父红点状态
   * @param childId 子红点ID
   */
  private __updateParentState(childId: string): void {
    const config = this._configs.get(childId);
    if (!config || !config.parent) {
      return;
    }

    const parentConfig = this._configs.get(config.parent);
    if (!parentConfig || !parentConfig.children) {
      return;
    }

    // 计算父红点状态（任一子红点可见则父红点可见）
    let parentVisible = false;
    for (const childId of parentConfig.children) {
      const childRedDot = this._redDots.get(childId);
      if (childRedDot && childRedDot.visible) {
        parentVisible = true;
        break;
      }
    }

    const parentRedDot = this._redDots.get(config.parent);
    if (parentRedDot && parentRedDot.visible !== parentVisible) {
      parentRedDot.visible = parentVisible;
      parentRedDot.updateTime = Date.now();

      // 触发父红点状态变化事件
      this.__emitChangeEvent(config.parent, parentVisible, parentRedDot.data);

      // 递归更新祖父红点
      this.__updateParentState(config.parent);
    }
  }

  /**
   * 从本地存储加载红点数据
   * @param id 红点ID
   * @param redDot 红点数据对象
   */
  private __loadFromStorage(id: string, redDot: IRedDotData): void {
    const store = this.resolve<IStoreContainer>(SERVICES.STORE);
    try {
      const key = `redDot:${id}`;
      store.load(key);
      const storeItem = store.itemOf(key);
      if (storeItem && storeItem.data) {
        this.updateData(id, storeItem.data);
        this.resolve<ILogger>(SERVICES.LOGGER).df('红点 {0} 持久化数据恢复成功', id);
      }
    } catch (error) {
      this.resolve<ILogger>(SERVICES.LOGGER).ef('红点 {0} 持久化数据加载失败: {1}', id, error);
    }
  }

  /**
   * 保存红点数据到本地存储
   * @param id 红点ID
   * @param redDot 红点数据
   */
  private __saveToStorage(id: string, redDot: IRedDotData): void {
    try {
      const storeItem = this.resolve<IStoreContainer>(SERVICES.STORE).itemOf(`redDot:${id}`);
      if (storeItem) {
        storeItem.data.visible = redDot.visible;
        storeItem.data.data = redDot.data;
        storeItem.data.updateTime = redDot.updateTime;
        storeItem.save();
      }
    } catch (error) {
      this.resolve<ILogger>(SERVICES.LOGGER).ef('红点 {0} 持久化失败: {1}', id, error);
    }
  }

  public destroy() {
    this._configs.clear();
    this._redDots.clear();
    this._listeners.clear();
    this._batchQueue.length = 0;
    this.resolve<ILogger>(SERVICES.LOGGER).d('红点管理系统已清理');
  }
}
