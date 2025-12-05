import { _decorator, Component } from 'cc';

import { IAtom } from '../interfaces';

const { ccclass } = _decorator;

/**
 * 原子组件
 * @description Atom 全面代理了组件的生命周期，并进一步完善（原始的生命周期不建议混用），以下是新版生命周期的执行顺序：
 * - 初始化: `onInit`
 * - 启动: `onLaunch`
 * - 注册事件: `onRegEvent`
 * - 激活: `onActivate`
 * - 更新: `onUpdate`
 * - 后置更新: `onPostUpdate`
 * - 注销事件: `onUnRegEvent`
 * - 禁用: `onDeactivate`
 * - 前置终止: `onPreTerminate`
 * - 终止: `onTerminate`
 */
@ccclass('Atom')
export class Atom extends Component implements IAtom {
  protected onLoad(): void {
    this.onInit();
  }

  protected start(): void {
    this.onLaunch();
  }

  protected onEnable(): void {
    this.onRegisterEvent();
    this.onActivate();
  }

  protected update(dt: number): void {
    this.onUpdate(dt);
  }

  protected lateUpdate(dt: number): void {
    this.onPostUpdate(dt);
  }

  protected onDisable(): void {
    this.onUnregisterEvent();
    this.onDeactivate();
  }

  public _onPreDestroy() {
    this.onPreTerminate();
    super._onPreDestroy();
  }

  protected onDestroy(): void {
    this.onTerminate();
  }

  /** 生命周期：初始化 */
  onInit(): void {}

  /** 生命周期：启动 */
  onLaunch(): void {}

  /** 生命周期：注册事件 */
  onRegisterEvent(): void {}

  /** 生命周期：激活 */
  onActivate(): void {}

  /** 生命周期：更新 */
  onUpdate(dt: number): void {}

  /** 生命周期：后置更新 */
  onPostUpdate(dt: number): void {}

  /** 生命周期：注销事件 */
  onUnregisterEvent(): void {}

  /** 生命周期：禁用 */
  onDeactivate(): void {}

  /** 生命周期：前置终止 */
  onPreTerminate(): void {}

  /** 生命周期：终止 */
  onTerminate(): void {}
}
