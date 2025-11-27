import { Component, _decorator } from 'cc';

const { ccclass } = _decorator;

/**
 * 原子组件接口
 * @description 定义了原子组件的生命周期方法，所有原子组件都必须实现这些方法。
 * @note 所有生命周期方法都必须是 protected 类型，以确保只能在 Atom 类中调用。
 */
@ccclass('Atom')
export abstract class IAtom extends Component {
  /** 生命周期：初始化 */
  protected abstract onInit(): void;
  /** 生命周期：启动 */
  protected abstract onLaunch(): void;
  /** 生命周期：注册事件 */
  protected abstract onRegEvent(): void;
  /** 生命周期：激活 */
  protected abstract onActivate(): void;
  /** 生命周期：更新 */
  protected abstract onUpdate(dt: number): void;
  /** 生命周期：后置更新 */
  protected abstract onPostUpdate(dt: number): void;
  /** 生命周期：注销事件 */
  protected abstract onUnRegEvent(): void;
  /** 生命周期：禁用 */
  protected abstract onDeactivate(): void;
  /** 生命周期：前置终止 */
  protected abstract onPreTerminate(): void;
  /** 生命周期：终止 */
  protected abstract onTerminate(): void;
}
