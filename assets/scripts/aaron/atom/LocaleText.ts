import { Label, _decorator } from 'cc';
import { EDITOR } from 'cc/env';
import { literal } from '../utils';
import { aaron } from '../core';

const { ccclass, property, menu } = _decorator;

/**
 * 本地化文本组件
 */
@ccclass('LocaleText')
@menu('Aaron/UI/LocaleText')
export class LocaleText extends Label {
  /** 输入参数 */
  private _args: any[] = [];

  /** 多语言文本键 */
  @property({ tooltip: '多语言文本键' })
  private _tid: string = '';
  /** 多语言文本键 */
  public get tid(): string {
    return this._tid;
  }
  public set tid(id: string) {
    this._tid = id;
    if (!EDITOR) {
      this.sync();
    }
  }

  /**
   * 设置输入参数
   * @param args 输入参数
   */
  setArgs(...args: any[]) {
    this._args = [...args];
    this.sync();
  }

  /** 同步文本 */
  private sync() {
    const text = aaron.localization.text(this.tid) ?? this._tid;
    if (this._args.length == 0) {
      this.string = text;
    } else {
      this.string = literal.fmt(text, ...this._args);
    }
  }
}
