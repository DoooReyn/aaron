import { Node, UITransform, Graphics } from 'cc';
import { aaron } from '../../core';
import { COLOR, EVENTS } from '../../macro';
import { GuiStack } from './GuiStack';
import { color } from '../../utils';
import { GuiConfig } from '../../interfaces';

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

  private onMaskClicked(): void {
    if (this.depth > 0) {
      const top = this.$instances[this.depth - 1];
      aaron.eventBus.app.emit(EVENTS.GUI.ALERT_MASK_CLICKED, top.config.token);
    }
  }
}
