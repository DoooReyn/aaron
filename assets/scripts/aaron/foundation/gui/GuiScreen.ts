import { Node } from 'cc';
import { GuiConfig, IGuiInstance, IGuiScreen } from '../../interfaces';
import { aaron } from '../../core';
import { GuiHelper } from './GuiHelper';

/**
 * Screen 层
 * @description 一级界面
 */
export class GuiScreen extends Node implements IGuiScreen {
  /** 当前视图实例 */
  private _current: IGuiInstance;

  constructor(name: string) {
    super(name);

    this.once(Node.EventType.PARENT_CHANGED, GuiHelper.createLayer.bind(GuiHelper, this), this);
  }

  async open(config: GuiConfig | string, params?: any): Promise<void> {
    // 打开前检查
    config = GuiHelper.preOpen(config);
    if (config === undefined) return;

    // 检测是否已打开
    if (this._current && this._current.config.token === config.token) {
      aaron.logger.wf('📷 视图: {0} 已经打开,请勿重复操作', config.token);
      return;
    }

    // 关闭上一个实例
    await this.close(true);

    // 打开新实例
    const inst = await GuiHelper.createInstance(this, config);
    if (!inst) return;

    inst.controller.onViewCreated(config.token);
    inst.controller.onViewWillAppear(params);
    await GuiHelper.playEnter(config, inst.node);
    inst.controller.onViewDidAppear();

    this._current = inst;
  }

  async close(force: boolean) {
    if (this._current) {
      if (force) {
        this._current.controller.onViewWillDisappear();
        await GuiHelper.playExit(this._current.config, this._current.node);
        this._current.controller.onViewDidDisappear();
        this._current.controller.onViewDisposed();
        this._current.node.destroy();
        aaron.resCache.decRef(this._current.config.prefab);
        this._current = null;
      } else {
        aaron.logger.df(
          '📷 视图: Screen栈内仅剩最后一个实例,如果坚持关闭,请使用 close(true)',
          this._current.config.token,
        );
      }
    }
  }

  async back() {
    return Promise.resolve();
  }

  focus(): void {
    if (this._current) this._current.controller.onViewFocus();
  }

  get top(): string | undefined {
    return this._current?.config.token;
  }
}
