import { Node } from 'cc';
import { GuiConfig, IGuiInstance, IGuiScreen } from '../../interfaces';
import { aaron } from '../../core';

/**
 * Screen
 * @description 一级界面，全屏，通常是常驻页面，比如：登录界面、游戏大厅等。
 */
export class GuiScreen extends Node implements IGuiScreen {
  /** 当前视图实例 */
  private _current: IGuiInstance;

  constructor(name: string) {
    super(name);

    this.once(Node.EventType.PARENT_CHANGED, () => aaron.gui.createLayer(this), this);
  }

  async open(config: GuiConfig | string, params?: any): Promise<void> {
    // 打开前检查
    config = aaron.gui.inspect(config);
    if (config === undefined) return;

    if (config.interface !== 'Screen') {
      aaron.logger.wf('📷 视图: {0} 层级不符 Screen != {1}，请检查', config.token, config.interface);
      return;
    }

    // 检测是否已打开
    if (this._current && this._current.config.token === config.token) {
      aaron.logger.wf('📷 视图: {0} 已经打开，请勿重复操作', config.token);
      return;
    }

    // 关闭高层级所有视图（除 Alert 外）
    await aaron.gui.popup.close();
    await aaron.gui.page.close();

    // 关闭上一个实例
    await this.close(true);

    // 打开新实例
    const inst = await aaron.gui.createInstance(this, config);
    if (!inst) return;

    inst.controller.onViewCreated(config.token);
    inst.controller.onViewWillAppear(params);
    await aaron.gui.playEnter(config, inst.node);
    inst.controller.onViewDidAppear();

    this._current = inst;
  }

  async close(force: boolean) {
    if (this._current) {
      if (force) {
        this._current.controller.onViewWillDisappear();
        await aaron.gui.playExit(this._current.config, this._current.node);
        this._current.controller.onViewDidDisappear();
        aaron.gui.closeInstance(this._current);
        this._current = null;
      } else {
        aaron.logger.df(
          '📷 视图: Screen栈内仅剩最后一个实例，如果坚持关闭，请使用 close(true)',
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
