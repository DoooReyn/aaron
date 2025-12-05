import { BufferAsset } from 'cc';

import { aaron } from '../../core';
import { ILoadOptions } from '../../interfaces';
import { ReferBase } from './ReferBase';

/**
 * 配置表内容容器
 */
class ReferTableContainer {
  data: ArrayBuffer;
  get isValid() {
    return true;
  }
}

/**
 * 配置表资源引用
 */
class InternalReferTable extends ReferBase<ReferTableContainer, BufferAsset> {
  protected apply(): void {
    const data = (this.container.data = this.$asset.buffer());
    aaron.tableQuery.parse(this.$asset.name, new Uint8Array(data));
  }
  protected discard(): void {
    this.container.data = null;
  }
}

export class ReferTable {
  private _container: ReferTableContainer;
  private _refer: InternalReferTable;

  constructor() {
    this._container = new ReferTableContainer();
    this._refer = new InternalReferTable(this._container, BufferAsset);
  }

  /** 容器是否有效 */
  protected get isContainerValid(): boolean {
    return true;
  }

  /** 资源是否有效 */
  get isAssetValid(): boolean {
    return this._refer.isAssetValid;
  }

  /** 容器、资源是否都有效 */
  get isValid(): boolean {
    return this.isAssetValid && this.isContainerValid;
  }

  /**
   * 使用资源
   * @param preffered 首选资源
   * @param fallback 降级资源
   */
  async load(preffered: ILoadOptions, fallback?: ILoadOptions) {
    return this._refer.load(preffered, fallback);
  }

  unload() {
    this._refer.unload();
  }

  static async Load(preffered: ILoadOptions, fallback?: ILoadOptions): Promise<void> {
    const table = new ReferTable();
    await table.load(preffered, fallback);
    table.unload();
  }
}
