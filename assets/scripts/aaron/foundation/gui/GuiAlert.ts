import { Graphics, Node, UITransform } from 'cc';

import { aaron } from '../../core';
import { GuiConfig } from '../../interfaces';
import { COLOR, EVENTS } from '../../macro';
import { color, time } from '../../utils';
import { GuiStack } from './GuiStack';

/**
 * Alert 警示弹窗层
 * @description 通常用于重要消息的通知，必须用户确认才可以关闭，比如：更新通知、确认支付、网络掉线等。
 * @note 切换一级、二级、普通弹窗都不会影响警示弹窗层。
 */
export class GuiAlert extends GuiStack {
  private _mask: Node;

  constructor(name: string) {
    super(name);

    const mask = new Node('mask');
    mask.acquire(UITransform);
    mask.acquire(Graphics);
    mask.on(Node.EventType.TOUCH_END, this.onMaskClicked, this);
    mask.active = false;
    this.addChild(mask);
    this._mask = mask;
  }

  protected internalInpsect(config: GuiConfig) {
    return config.interface === 'Alert';
  }

  onViewDepthChanged(): void {
    if (this.depth === 0) {
      this._mask.active = false;
      this._mask.uiGraphics.clear();
    } else {
      this._mask.active = true;
      const { width, height } = this.size;
      this._mask.uiTransform.setContentSize(width, height);
      this._mask.uiGraphics.clear();
      this._mask.uiGraphics.fillColor = color.from(COLOR.BLACK_25);
      this._mask.uiGraphics.fillRect(-width / 2 - 10, -height / 2 - 10, width + 20, height + 20);
      this._mask.setSiblingIndex(this.depth - 1);
    }

    // 同步告知弹窗层
    aaron.gui.popup.onViewDepthChanged();
  }

  private _lastClickAt: number = 0;
  private onMaskClicked(): void {
    const now = time.now();
    if (this.depth > 0 && now - this._lastClickAt > 1_000) {
      this._lastClickAt = now;
      console.log('Alert Mask Clicked');
      const top = this.$instances[this.depth - 1];
      aaron.eventBus.app.emit(EVENTS.GUI.ALERT_MASK_CLICKED, top.config.token);
    }
  }
}
