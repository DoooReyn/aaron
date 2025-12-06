import { Node } from 'cc';

import { aaron } from '../../core';
import { GuiConfig, IGuiInstance, IGuiScreen } from '../../interfaces';
import { MESSAGES } from '../../macro';

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
      aaron.gui.logger.wf(MESSAGES.GUI.CHECK_OWN_LAYER, config.token, 'screen', config.interface);
      return;
    }

    // 检测是否已打开
    if (this._current && this._current.config.token === config.token) {
      aaron.gui.logger.wf(MESSAGES.GUI.OPEN_YET, config.token);
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
        aaron.gui.logger.df(MESSAGES.GUI.FORCE_CLOSE_SCREEN_TIP, this._current.config.token);
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

  get stack() {
    return this._current ? [this._current.config.token] : [];
  }
}
