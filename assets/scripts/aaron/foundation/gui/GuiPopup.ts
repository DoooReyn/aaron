import { Node, Graphics, UITransform } from 'cc';
import { GuiStack } from './GuiStack';
import { color } from '../../utils';
import { COLOR, EVENTS } from '../../macro';
import { aaron } from '../../core';
import { IGuiPopup } from '../../interfaces';

export class GuiPopup extends GuiStack implements IGuiPopup {
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

  onViewDepthChanged(): void {
    if (aaron.gui.alert.depth > 0) {
      this._mask.active = false;
      this._mask.uiGraphics.clear();
    } else if (this.depth === 0) {
      this._mask.active = false;
      this._mask.uiGraphics.clear();
    } else {
      this._mask.active = true;
      const { width, height } = this.size;
      this._mask.uiTransform.setContentSize(width, height);
      this._mask.uiGraphics.clear();
      this._mask.uiGraphics.fillColor = color.from(COLOR.BLACK_25);
      this._mask.uiGraphics.fillRect(-width / 2 - 10, -height / 2 - 10, width + 20, height + 20);
    }
  }

  private onMaskClicked(): void {
    aaron.eventBus.app.emit(EVENTS.GUI.POPUP_MASK_CLICKED);
  }
}
