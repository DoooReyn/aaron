import { sys } from 'cc';
import { aaron } from '../core';
import { Dict } from '../types';
import { Triggers } from './Trigger';
import { dict, json, lzstring, zson } from '../utils';

/**
 * 本地存储条目
 */
export class StoreEntry<T extends Dict> {
  /** 原始数据 */
  private __raw: T;

  /** 代理数据 */
  public data: T;

  /** 数据变化触发器 */
  public readonly onDataChanged: Triggers;

  /**
   * 构造函数
   * @param token 存储条目标识
   * @param template 数据模板
   */
  constructor(public readonly token: string, public readonly template: T) {
    this.onDataChanged = new Triggers();
    this.load();
  }

  /**
   * 数据编码
   * @returns 编码后的数据
   */
  private __encode() {
    if (aaron.argParser.isProd) {
      return lzstring.encode(zson.encode(this.__raw));
    } else {
      return json.encode(this.__raw);
    }
  }

  /**
   * 数据解码
   * @param content 内容
   * @returns 解码后的数据
   */
  private __decode(content: string) {
    if (aaron.argParser.isProd) {
      return zson.decode(lzstring.decode(content)) as T;
    } else {
      return json.decode(content) as T;
    }
  }

  /** 加载数据 */
  load() {
    if (this.data) return;

    const content = sys.localStorage.getItem(this.token);
    if (content) {
      this.__raw = this.__decode(content) as T;
    } else {
      this.__raw = dict.deepCopy(this.template) as T;
      this.save();
    }

    const self = this;
    this.data = new Proxy(this.__raw, {
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
    if (aaron.argParser.isDev && aaron.platform.browser) {
      const user = aaron.argParser.args.user ?? 'guest';
      return aaron.argParser.args.appName + '-' + user + '-' + this.token;
    } else {
      return aaron.argParser.args.appName + '-' + this.token;
    }
  }

  /** 保存数据 */
  save() {
    sys.localStorage.setItem(this.token, this.__encode());
  }
}
