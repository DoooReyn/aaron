import { IRedDotData, IRedDotPool } from '../interfaces';

/**
 * 红点池实现
 */
export class RedDotPool implements IRedDotPool {
  /** 红点对象容器 */
  private _container: IRedDotData[] = [];
  /** 红点对象池最大容量 */
  private _maxSize: number = 128;

  acquire(): IRedDotData {
    if (this._container.length > 0) {
      const redDot = this._container.pop()!;
      redDot.data = undefined;
      redDot.visible = false;
      redDot.updateTime = 0;
      return redDot;
    }
    return {
      data: undefined,
      visible: false,
      updateTime: Date.now(),
    };
  }

  recycle(redDot: IRedDotData): void {
    if (this._container.length < this._maxSize) {
      this._container.push(redDot);
    }
  }
}
