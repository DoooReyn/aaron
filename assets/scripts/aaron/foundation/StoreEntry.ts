import { sys } from 'cc';
import { Triggers } from './Trigger';
import { Dict } from '../types';
import { dict } from '../utils';
import { IStoreModem } from '../interfaces';

/**
 * 本地存储条目
 */
export class StoreEntry<T extends Dict> {
  /** 原始数据 */
  private _raw: T;

  /** 代理数据 */
  public data: T;

  /** 数据变化触发器 */
  public readonly onDataChanged: Triggers;

  /**
   * 构造函数
   * @param token 存储条目标识
   * @param template 数据模板
   */
  constructor(public readonly token: string, public readonly template: T, private readonly _modem: IStoreModem) {
    this.onDataChanged = new Triggers();
    this.load();
  }

  /**
   * 数据编码
   * @returns 编码后的数据
   */
  private encode() {
    return this._modem.encode(this._raw);
  }

  /**
   * 数据解码
   * @param content 内容
   * @returns 解码后的数据
   */
  private decode(content: string) {
    return this._modem.decode(content);
  }

  /** 加载数据 */
  load() {
    if (this.data) return;

    const content = sys.localStorage.getItem(this.token);
    if (content) {
      this._raw = this.decode(content) as T;
    } else {
      this._raw = dict.deepCopy(this.template) as T;
      this.save();
    }

    const self = this;
    this.data = new Proxy(this._raw, {
      set(target, prop, value) {
        // 自动保存
        self.onDataChanged.runWith(prop, target[prop], value);
        dict.set(target, prop, value);
        self.save();
        return true;
      },
      get(target, prop) {
        return target[prop];
      },
    });
  }

  /** 存储条目唯一标识 */
  get key() {
    return this._modem.makeKey(this.token);
  }

  /** 保存数据 */
  save() {
    sys.localStorage.setItem(this.token, this.encode());
  }
}
