import { Dto, IModel, Subscription, OnPropertyChanged } from '../interfaces';
import { list } from '../utils';
import { DeepProxy } from './DeepProxy';
import { ObjectEntry } from './ObjectEntry';

/** 数据模型 */
export class Model<D extends Dto> extends ObjectEntry implements IModel<D> {
  /** 原始数据 */
  protected $dto: D | null = null;

  /** 数据深层代理 */
  protected $proxy: DeepProxy<D> | null = null;

  /** （细粒度）属性订阅者 */
  private _compactSubscriptions: Map<string, Set<Subscription>> = new Map();

  /** （粗粒度）属性订阅者 */
  private _coarseSubscriptions: Subscription[] = [];

  onInitialize(...args: any[]): void {}

  onRecycled(): void {
    this.$dto = null;
    this.$proxy = null;
    this.unsubscribeAll();
  }

  /**
   * 通知订阅者
   * @param property 属性路径
   * @param value 属性值
   */
  private notify(property: string[], value: any): void {
    const path = property.join('.');
    if (this._compactSubscriptions.has(path)) {
      this._compactSubscriptions.get(path)!.forEach((subscription) => {
        const [onPropertyChanged, context] = subscription;
        onPropertyChanged.call(context, path, value);
      });
    }
    this._coarseSubscriptions.forEach((item) => item[0].call(item[1], path, value));
  }

  get dto(): D | null {
    return this.$dto;
  }

  sync(dto: D) {
    const self = this;
    this.$proxy = new DeepProxy(dto, {
      set: (target: any, prop: string | symbol, value: any, receiver: any) => {
        const old = Reflect.get(target, prop, receiver);
        const path = [...(self.$proxy!.getPath(target) ?? []), String(prop)];
        if (old !== value) {
          self.notify(path, value);
        }
        return Reflect.set(target, prop, value, receiver);
      },
    });
    this.$dto = this.$proxy.create();
  }

  subscribeCompact(property: string, onPropertyChanged: OnPropertyChanged, context: any) {
    if (!this._compactSubscriptions.has(property)) {
      this._compactSubscriptions.set(property, new Set());
    }
    this._compactSubscriptions.get(property)!.add([onPropertyChanged, context]);
  }

  unsubscribeCompact(property: string, onPropertyChanged: OnPropertyChanged, context: any): void {
    const subscriptions = this._compactSubscriptions.get(property);
    if (subscriptions) {
      for (const subscription of subscriptions) {
        if (subscription[0] === onPropertyChanged && subscription[1] === context) {
          subscriptions.delete(subscription);
          break;
        }
      }
    }
  }

  unsubscribeAllCompact(property?: string, context?: any): void {
    if (property) {
      const subscriptions = this._compactSubscriptions.get(property);
      if (subscriptions) {
        if (context) {
          // 取消指定属性和上下文的订阅
          for (const subscription of subscriptions) {
            if (subscription[1] === context) {
              subscriptions.delete(subscription);
            }
          }
        } else {
          // 取消指定属性的所有订阅
          subscriptions.clear();
        }
      }
    } else {
      if (context) {
        // 取消指定上下文的所有订阅
        this._compactSubscriptions.forEach((subscriptions) => {
          for (const subscription of subscriptions) {
            if (subscription[1] === context) {
              subscriptions.delete(subscription);
            }
          }
        });
      } else {
        // 取消所有订阅
        this._compactSubscriptions.clear();
      }
    }
  }

  subscribeCoarse(onPropertyChanged: OnPropertyChanged, context: any) {
    this._coarseSubscriptions.push([onPropertyChanged, context]);
  }

  unsubscribeCoarse(onPropertyChanged: OnPropertyChanged, context: any) {
    list.removeIf(this._coarseSubscriptions, (item) => item[0] === onPropertyChanged && item[1] === context, true);
  }

  unsubscribeAllCoarse(context?: any) {
    if (context) {
      list.removeIf(this._coarseSubscriptions, (item) => item[1] === context, true);
    } else {
      list.clear(this._coarseSubscriptions);
    }
  }

  unsubscribeAll(context?: any) {
    this.unsubscribeAllCompact(undefined, context);
    this.unsubscribeAllCoarse(context);
  }
}
