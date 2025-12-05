import { EventTouch, Node } from 'cc';

import { aaron } from '../../core';
import { IGuiTop } from '../../interfaces';
import { Triggers } from '../Trigger';

/**
 * Top
 * @description Gui视图的顶层，用于控制触摸穿透。
 * @note 开发者可以通过内置的触发器来扩展来自顶层的触摸操作（注意 AppLauncher 也提供相似的接口，但更注重屏幕点击操作）。
 */
export class GuiTop extends Node implements IGuiTop {
  /** 是否接受触摸 */
  private _touchAllowed = true;

  public readonly onStart: Triggers = new Triggers();
  public readonly onEnd: Triggers = new Triggers();
  public readonly onCancel: Triggers = new Triggers();
  public readonly onMove: Triggers = new Triggers();

  constructor(name: string) {
    super(name);

    aaron.gui.createLayer(this);

    this.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    this.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.once(Node.EventType.NODE_DESTROYED, this.onDisposed, this);
  }

  /** 是否接受触摸 */
  get touchAllowed() {
    return this._touchAllowed;
  }
  set touchAllowed(value: boolean) {
    this._touchAllowed = value;
  }

  private onTouchStart(event: EventTouch) {
    event.propagationStopped = !this._touchAllowed;
    event.propagationImmediateStopped = !this._touchAllowed;
    event.preventSwallow = this._touchAllowed;
    this.onStart.runWith(event);
  }

  private onTouchMove(event: EventTouch) {
    event.preventSwallow = this._touchAllowed;
    this.onMove.runWith(event);
  }

  private onTouchEnd(event: EventTouch) {
    event.preventSwallow = this._touchAllowed;
    this.onEnd.runWith(event);
  }

  private onTouchCancel(event: EventTouch) {
    event.preventSwallow = this._touchAllowed;
    this.onCancel.runWith(event);
  }

  private onDisposed() {
    this.onStart.clear();
    this.onMove.clear();
    this.onEnd.clear();
    this.onCancel.clear();
    this.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    this.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.off(Node.EventType.NODE_DESTROYED, this.onDisposed, this);
  }
}
