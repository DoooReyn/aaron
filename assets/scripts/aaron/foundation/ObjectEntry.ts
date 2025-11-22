import { IObjectEntry } from '../interfaces';
import { time } from '../utils';

/**
 * 对象条目
 */
export class ObjectEntry implements IObjectEntry {
  createdAt: number = 0;
  recycledAt: number = 0;
  token: string;

  get initialized(): boolean {
    return this.createdAt > 0;
  }

  get destroyed(): boolean {
    return this.recycledAt > 0;
  }

  initialize(...args: any[]): void {
    if (!this.initialized) {
      this.reset();
      this.createdAt = time.now();
      this.recycledAt = 0;
      this.onInitialize(...args);
    }
  }

  recycle(): boolean {
    if (!this.destroyed) {
      this.recycledAt = time.now();
      this.createdAt = 0;
      this.onRecycled();
      return true;
    }
    return false;
  }

  reset(): void { }

  onInitialize(...args: any[]): void { }

  onRecycled(): void { }
}
