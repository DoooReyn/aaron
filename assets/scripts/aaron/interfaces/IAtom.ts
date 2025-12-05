import { Component } from 'cc';

/**
 * 原子组件接口
 * @description 定义了原子组件的生命周期方法，所有原子组件都必须实现这些方法。
 * @note 原子组件已经对 Component 的生命周期做了代理，因此应该去派生 Atom 而非 Component 的生命周期。
 */
export interface IAtom extends Component {
  /** 生命周期：初始化 */
  onInit(): void;
  /** 生命周期：启动 */
  onLaunch(): void;
  /** 生命周期：注册事件 */
  onRegisterEvent(): void;
  /** 生命周期：激活 */
  onActivate(): void;
  /** 生命周期：更新 */
  onUpdate(dt: number): void;
  /** 生命周期：后置更新 */
  onPostUpdate(dt: number): void;
  /** 生命周期：注销事件 */
  onUnregisterEvent(): void;
  /** 生命周期：禁用 */
  onDeactivate(): void;
  /** 生命周期：前置终止 */
  onPreTerminate(): void;
  /** 生命周期：终止 */
  onTerminate(): void;
}
