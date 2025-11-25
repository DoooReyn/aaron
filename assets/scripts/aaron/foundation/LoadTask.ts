import { Asset, Constructor } from 'cc';
import { aaron } from '../core';
import { ILoadTask, ILoadOptions } from '../interfaces';

/**
 * 加载任务
 * @description
 */
export class LoadTask<T extends Asset> implements ILoadTask {
  /** 任务是否正在加载 */
  private _loading: boolean;
  /** 任务是否已取消 */
  private _aborted: boolean;

  constructor(
    public readonly type: Constructor<T>,
    public readonly options: ILoadOptions,
    public readonly onComplete?: (asset: T | null) => void,
    public readonly onSuccess?: (asset: T) => void,
    public readonly onFail?: () => void
  ) {
    this._loading = false;
    this._aborted = false;
  }

  get aborted() {
    return this._aborted;
  }

  get loading() {
    return this._loading;
  }

  load() {
    if (!this._loading) {
      this._loading = true;

      aaron.resLoader.load(this.type, this.options).then((asset) => {
        this?.onComplete?.(asset);
        if (asset && this._aborted) {
          this?.onSuccess?.(asset);
        } else {
          this?.onFail?.();
        }
      });
    }
  }

  abort() {
    this._aborted = true;
    this._loading = false;
  }
}
