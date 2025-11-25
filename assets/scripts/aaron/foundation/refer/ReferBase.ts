import { Asset, Component } from 'cc';
import { Constructor } from '../../types';
import { aaron } from '../../core';
import { be } from '../../utils';

/**
 * 资源引用策略
 * @description 统一资源加载、释放等操作
 */
export abstract class ReferBase<K extends Component, T extends Asset> {
  /** 资源 */
  protected _asset: T;

  /** 上次使用的资源路径 */
  protected _url: string;

  /**
   * 构造
   * @param container 容器
   */
  constructor(public readonly container: K, public readonly cls: Constructor<T>) {}

  /** 容器是否有效 */
  protected get isContainerValid(): boolean {
    return this.container && this.container.isValid;
  }

  /** 资源是否有效 */
  get isAssetValid(): boolean {
    return this._asset && this._asset.isValid;
  }

  /** 容器、资源是否都有效 */
  get isValid(): boolean {
    return this.isAssetValid && this.isContainerValid;
  }

  /**
   * 加载资源
   * @param url 资源路径
   * @param fallback 保底资源
   */
  private async internalLoad(url: string, fallback?: string) {
    let asset: T | null = null;

    // 选择加载策略
    asset = await aaron.resLoader.load<T>(this.cls, { path: url });

    if (be.isEmpty(asset)) {
      // 如果资源无效，尝试加载保底资源
      if (fallback) {
        return this.internalLoad(fallback);
      }
    } else {
      // 如果资源有效，保存资源信息
      this._url = url;
      this._asset = asset;
    }

    return Promise.resolve();
  }

  /** 应用资源 */
  protected abstract apply(): void;

  /** 撤销资源 */
  protected abstract discard(): void;

  /**
   * 使用资源
   * @param url 资源路径
   * @param fallback 降级资源路径
   */
  load(url: string, fallback?: string) {
    if (this.isValid) {
      if (this._url == url) return;
      this.unload();
    }

    this.internalLoad(url, fallback).then(() => {
      if (this.isValid) {
        aaron.resCache.addRef(url);
        this.apply();
      }
    });
  }

  /** 解除资源 */
  unload() {
    this.discard();
    if (this.isAssetValid) {
      aaron.resCache.decRef(this._url);
      this._asset = null;
    }
  }
}
