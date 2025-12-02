import { Asset } from 'cc';
import { Constructor } from '../../types';
import { aaron } from '../../core';
import { be } from '../../utils';
import { ILoadOptions } from '../../interfaces';

export interface ReferContainer {
  get isValid(): boolean;
}

/**
 * 资源引用策略
 * @description 统一资源加载、释放等操作
 */
export abstract class ReferBase<K extends ReferContainer, T extends Asset> {
  /** 资源 */
  protected $asset: T;

  /** 上次使用的资源路径 */
  protected $url: string;

  /**
   * 构造
   * @param container 容器
   */
  constructor(
    public readonly container: K,
    public readonly cls: Constructor<T>,
  ) {}

  /** 容器是否有效 */
  protected get isContainerValid(): boolean {
    return this.container && this.container.isValid;
  }

  /** 资源是否有效 */
  get isAssetValid(): boolean {
    return this.$asset && this.$asset.isValid;
  }

  /** 容器、资源是否都有效 */
  get isValid(): boolean {
    return this.isAssetValid && this.isContainerValid;
  }

  /**
   * 加载资源
   * @param preferred 首选资源加载选项
   * @param fallback 保底资源加载选项
   */
  private async internalLoad(preferred: ILoadOptions, fallback?: ILoadOptions) {
    let asset: T | null = null;

    // 选择加载策略
    asset = await aaron.resLoader.load<T>(this.cls, preferred);

    if (be.isEmpty(asset)) {
      // 如果资源无效，尝试加载保底资源
      if (fallback) {
        return this.internalLoad(fallback);
      }
    } else {
      // 如果资源有效，保存资源信息
      this.$url = preferred.path;
      this.$asset = asset;
    }

    return Promise.resolve();
  }

  /** 应用资源 */
  protected abstract apply(): void;

  /** 撤销资源 */
  protected abstract discard(): void;

  /**
   * 使用资源
   * @param preffered 首选资源
   * @param fallback 降级资源
   */
  async load(preffered: ILoadOptions, fallback?: ILoadOptions): Promise<void> {
    if (this.isValid) {
      if (this.$url == preffered.path) return;
      this.unload();
    }

    return this.internalLoad(preffered, fallback).then(() => {
      if (this.isValid) {
        aaron.resCache.addRef(preffered.path);
        this.apply();
      }
    });
  }

  /** 解除资源 */
  unload() {
    this.discard();
    if (this.isAssetValid) {
      aaron.resCache.decRef(this.$url);
      this.$asset = null;
    }
  }
}
