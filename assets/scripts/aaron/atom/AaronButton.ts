import { Color, Enum, EventMouse, EventTouch, Node, Vec3, _decorator } from 'cc';
import { Atom } from './Atom';
import { aaron } from '../core';
import { Triggers } from '../foundation';
import { color } from '../utils';
import { PRESET } from '../macro';

const { ccclass, menu, property } = _decorator;

/** 按钮交互方式 */
export enum InteractMode {
  /** 仅支持单击 */
  Tap,
  /** 仅支持长按 */
  Hold,
  /** 同时支持单击和长按 */
  TapHold,
}

/** 按钮状态 */
export enum ButtonState {
  /** 正常状态 */
  Normal = 'normal',
  /** 悬停状态 */
  Hover = 'hover',
  /** 按下状态 */
  Tap = 'tap',
  /** 长按状态 */
  Hold = 'hold',
  /** 禁用状态 */
  Disabled = 'disabled',
}

/** 按钮事件 */
export enum ButtonEvent {
  /** 按钮单击落下事件 */
  TapStart = 'tap-start',
  /** 按钮单击松开事件 */
  TapEnd = 'tap-end',
  /** 按钮长按开始事件 */
  HoldStart = 'hold-start',
  /** 按钮长按触发事件 */
  HoldTrigger = 'hold-trigger',
  /** 按钮长按结束事件 */
  HoldEnd = 'hold-end',
  /** 按钮悬停进入事件 */
  HoverIn = 'hover-in',
  /** 按钮悬停离开事件 */
  HoverOut = 'hover-out',
}

/** 按钮交互方式 */
const CCInteractMode = Enum(InteractMode);

/**
 * 自定义按钮组件
 *
 * 功能特性：
 * - 支持单击和长按操作
 * - 支持按钮状态切换
 * - 支持单击和长按事件派发
 * - 提供直接设置状态的接口
 * - 支持音效播放
 * - 支持视觉状态切换（颜色、缩放）
 */
@ccclass('AaronButton')
@menu('Aaron/Gui/Button')
export class AaronButton extends Atom {
  @property({
    type: CCInteractMode,
    displayName: '交互方式',
    tooltip: '选择按钮的交互方式',
    serializable: true,
  })
  readonly interactMode: InteractMode = InteractMode.Tap;

  @property({
    displayName: '单击间隔（毫秒）',
    tooltip: '设置按钮的单击间隔（每两次点击需要至少n毫秒）',
    visible(): boolean {
      return this.interactMode === InteractMode.Tap || this.interactMode === InteractMode.TapHold;
    },
    serializable: true,
  })
  readonly tapInterval: number = 100;

  @property({
    displayName: '长按延迟时间（毫秒）',
    tooltip: '设置按钮的长按延迟时间',
    visible(): boolean {
      return this.interactMode === InteractMode.Hold || this.interactMode === InteractMode.TapHold;
    },
    serializable: true,
  })
  readonly holdDelay: number = 500;

  @property({
    displayName: '长按触发间隔（毫秒）',
    tooltip: '设置按钮的长按触发间隔（每次触发需要至少n毫秒）',
    visible(): boolean {
      return this.interactMode === InteractMode.Hold || this.interactMode === InteractMode.TapHold;
    },
    serializable: true,
  })
  readonly holdInterval: number = 100;

  @property({
    displayName: '点击落下音效',
    tooltip: '选择按钮的点击落下音频资源',
    serializable: true,
  })
  readonly tapStartSound: string = 'l:resources@SfxClick';

  @property({
    displayName: '点击松开音效',
    tooltip: '选择按钮的点击松开音频资源',
    visible(): boolean {
      return this.interactMode === InteractMode.Tap || this.interactMode === InteractMode.TapHold;
    },
    serializable: true,
  })
  readonly tapEndSound: string = '';

  @property({
    displayName: '长按触发音效',
    tooltip: '选择按钮的长按触发音频资源',
    serializable: true,
    visible(): boolean {
      return this.interactMode === InteractMode.Hold || this.interactMode === InteractMode.TapHold;
    },
  })
  readonly holdTriggerSound: string = '';

  /** 是否静音（开启时不播放音效） */
  private _mute: boolean = false;
  @property({
    displayName: '静音',
    tooltip: '是否静音（开启时不播放音效）',
    serializable: true,
  })
  get muted(): boolean {
    return this._mute;
  }
  set muted(value: boolean) {
    this._mute = value;
  }

  @property({ displayName: '正常颜色', serializable: true })
  readonly normalColor: Color = new Color();
  @property({ displayName: '点击颜色', serializable: true })
  readonly tapColor: Color = new Color();
  @property({ displayName: '悬停颜色', serializable: true })
  readonly hoverColor: Color = new Color();
  @property({ displayName: '禁用颜色', serializable: true })
  readonly disabledColor: Color = new Color();

  @property({ displayName: '正常缩放', serializable: true })
  readonly normalScale: Vec3 = new Vec3(1, 1, 1);
  @property({ displayName: '点击缩放', serializable: true })
  readonly tapScale: Vec3 = new Vec3(0.95, 0.95, 1);
  @property({ displayName: '悬停缩放', serializable: true })
  readonly hoverScale: Vec3 = new Vec3(1.05, 1.05, 1);
  @property({ displayName: '禁用缩放', serializable: true })
  readonly disabledScale: Vec3 = new Vec3(1, 1, 1);

  // 内部状态
  private _state: ButtonState = ButtonState.Normal;
  private _interactionEnabled: boolean = true;
  private _lastTapTime: number = 0;
  private _pressStartTime: number = 0;
  private _holdTriggerCount: number = 0;
  private _lastHoldTriggerTime: number = 0;
  private _touchStartPos: Vec3 = new Vec3();
  private _isPressed: boolean = false;

  // 触发器
  public readonly onTapStart: Triggers = new Triggers();
  public readonly onTapEnd: Triggers = new Triggers();
  public readonly onHoldStart: Triggers = new Triggers();
  public readonly onHoldTrigger: Triggers = new Triggers();
  public readonly onHoldEnd: Triggers = new Triggers();
  public readonly onHoverIn: Triggers = new Triggers();
  public readonly onHoverOut: Triggers = new Triggers();

  // 生命周期方法
  onLaunch(): void {
    super.onLaunch();
    // 初始化状态
    this.updateVisualState();
  }

  onRegisterEvent(): void {
    super.onRegisterEvent();
    // 注册事件监听
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);

    // 桌面平台支持鼠标悬停
    if (aaron.platform.desktop) {
      this.node.on(Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
      this.node.on(Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
    }
  }

  onUnregisterEvent(): void {
    super.onUnregisterEvent();
    // 注销事件监听
    this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);

    if (aaron.platform.desktop) {
      this.node.off(Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
      this.node.off(Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
    }

    // 停止所有长按定时器
    this.stopHoldTimer();
  }

  // 触摸事件处理
  private onTouchStart(event: EventTouch): void {
    if (!this._interactionEnabled || this._state === ButtonState.Disabled) {
      return;
    }

    // 记录触摸开始信息
    const now = Date.now();
    this._touchStartPos.set(event.getUILocation().toVec3());
    this._isPressed = true;
    this._pressStartTime = now;

    // 防抖检查
    if (now - this._lastTapTime < this.tapInterval) {
      return;
    }
    this._lastTapTime = this._pressStartTime;

    // 进入按下状态
    this.setState(ButtonState.Tap);
    this.triggerEvent(ButtonEvent.TapStart);

    // 播放点击音效
    this.playTapStartSound();

    // 根据交互模式启动长按检测
    if (this.interactMode === InteractMode.Hold || this.interactMode === InteractMode.TapHold) {
      this.startHoldTimer();
    }
  }

  private onTouchMove(event: EventTouch): void {
    if (!this._isPressed || this._state === ButtonState.Disabled) {
      return;
    }

    const currentPos = event.getUILocation().toVec3();
    const distance = Vec3.distance(currentPos, this._touchStartPos);

    // 如果移动距离超过阈值（10像素），则取消点击
    if (distance > 10) {
      this.cancelInteraction();
    }
  }

  private onTouchEnd(event: EventTouch): void {
    if (!this._isPressed || this._state === ButtonState.Disabled) {
      return;
    }

    const now = Date.now();
    const touchDuration = now - this._pressStartTime;

    // 检查是否需要触发长按
    if (
      (this.interactMode === InteractMode.Hold || this.interactMode === InteractMode.TapHold) &&
      touchDuration >= this.holdDelay
    ) {
      // 长按结束
      this.setState(ButtonState.Normal);
      this.triggerEvent(ButtonEvent.HoldEnd);
    } else {
      // 单击结束
      this.setState(ButtonState.Normal);
      this.triggerEvent(ButtonEvent.TapEnd);
    }

    this._isPressed = false;
  }

  private onTouchCancel(event: EventTouch): void {
    if (!this._isPressed || this._state === ButtonState.Disabled) {
      return;
    }

    this.cancelInteraction();
  }

  // 鼠标事件处理（仅桌面平台）
  private onMouseEnter(event: EventMouse): void {
    if (!this._interactionEnabled || this._state === ButtonState.Disabled) {
      return;
    }

    this.setState(ButtonState.Hover);
    this.triggerEvent(ButtonEvent.HoverIn);
  }

  private onMouseLeave(event: EventMouse): void {
    if (!this._interactionEnabled || this._state === ButtonState.Disabled) {
      return;
    }

    this.setState(ButtonState.Normal);
    this.triggerEvent(ButtonEvent.HoverOut);
  }

  // 长按处理
  private startHoldTimer(): void {
    if (this.interactMode === InteractMode.Tap) {
      return;
    }

    // 延迟指定时间后触发长按
    this.scheduleOnce(() => {
      if (this._isPressed && this._state === ButtonState.Tap) {
        this.startHold();
      }
    }, this.holdDelay / 1000);
  }

  private startHold(): void {
    if (this._state === ButtonState.Disabled) {
      return;
    }

    this._holdTriggerCount = 0;
    this.setState(ButtonState.Hold);
    this.triggerEvent(ButtonEvent.HoldStart);
    this.playHoldTriggerSound();

    // 开始长按重复触发
    this.scheduleHoldTrigger();
  }

  private scheduleHoldTrigger(): void {
    if (this._state !== ButtonState.Hold) {
      return;
    }

    this.schedule(() => {
      if (this._isPressed && this._state === ButtonState.Hold) {
        this.triggerHoldEvent();
      } else {
        this.unschedule(this.scheduleHoldTrigger);
      }
    }, this.holdInterval / 1000);
  }

  private triggerHoldEvent(): void {
    const now = Date.now();

    // 检查触发间隔
    if (now - this._lastHoldTriggerTime < this.holdInterval) {
      return;
    }

    this._holdTriggerCount++;
    this._lastHoldTriggerTime = now;
    this.triggerEvent(ButtonEvent.HoldTrigger);
    this.playHoldTriggerSound();
  }

  private stopHoldTimer(): void {
    this.unscheduleAllCallbacks();
  }

  // 取消交互
  private cancelInteraction(): void {
    this._isPressed = false;
    this.setState(ButtonState.Normal);
    this.stopHoldTimer();
  }

  // 状态管理
  private setState(newState: ButtonState): void {
    if (this._state === newState) {
      return;
    }

    const oldState = this._state;
    this._state = newState;
    this.updateVisualState();
    // this.onStateChanged?.(oldState, newState);
  }

  private updateVisualState(): void {
    if (!this.node) {
      return;
    }

    // 根据状态更新视觉效果
    switch (this._state) {
      case ButtonState.Hover:
        this.node.setScale(this.hoverScale);
        this.node.color = color.from(this.hoverColor);
        break;
      case ButtonState.Tap:
        this.node.setScale(this.tapScale);
        this.node.color = color.from(this.tapColor);
        break;
      case ButtonState.Hold:
        break;
      case ButtonState.Disabled:
        this.node.setScale(this.disabledScale);
        this.node.color = color.from(this.disabledColor);
        break;
      case ButtonState.Normal:
      default:
        this.node.setScale(this.normalScale);
        this.node.color = color.from(this.normalColor);
        break;
    }
  }

  // 事件触发
  private triggerEvent(eventType: ButtonEvent): void {
    switch (eventType) {
      case ButtonEvent.TapStart:
        this.onTapStart.run();
        break;
      case ButtonEvent.TapEnd:
        this.onTapEnd.run();
        break;
      case ButtonEvent.HoldStart:
        this.onHoldStart.run();
        break;
      case ButtonEvent.HoldTrigger:
        this.onHoldTrigger.run();
        break;
      case ButtonEvent.HoldEnd:
        this.onHoldEnd.run();
        break;
      case ButtonEvent.HoverIn:
        this.onHoverIn.run();
        break;
      case ButtonEvent.HoverOut:
        this.onHoverOut.run();
        break;
    }
  }

  // 音频播放
  private playHoldTriggerSound(): void {
    if (this._mute || !this.holdTriggerSound) {
      return;
    }

    aaron.audioPlayer.sound.play({ path: this.holdTriggerSound, cacheExpires: PRESET.SOUND_ENTRY_OPTIONS.expires });
  }
  private playTapStartSound(): void {
    if (this._mute || !this.tapStartSound) {
      return;
    }

    aaron.audioPlayer.sound.play({ path: this.tapStartSound, cacheExpires: PRESET.SOUND_ENTRY_OPTIONS.expires });
  }
  private playTapEndSound(): void {
    if (this._mute || !this.tapEndSound) {
      return;
    }

    aaron.audioPlayer.sound.play({ path: this.tapEndSound, cacheExpires: PRESET.SOUND_ENTRY_OPTIONS.expires });
  }

  // 公共 API

  /**
   * 启用/禁用按钮交互
   */
  public set interactionEnabled(value: boolean) {
    if (this._interactionEnabled === value) {
      return;
    }

    this._interactionEnabled = value;

    if (value) {
      this.setState(ButtonState.Normal);
    } else {
      this.cancelInteraction();
      this.setState(ButtonState.Disabled);
    }
  }

  public get interactionEnabled(): boolean {
    return this._interactionEnabled;
  }

  /**
   * 手动设置按钮状态
   */
  public set state(newState: ButtonState) {
    this.setState(newState);
  }

  public get state(): ButtonState {
    return this._state;
  }

  /**
   * 手动触发点击事件
   */
  public click(): void {
    if (!this._interactionEnabled || this._state === ButtonState.Disabled) {
      return;
    }

    const now = Date.now();

    // 防抖检查
    if (now - this._lastTapTime < this.tapInterval) {
      return;
    }
    this._lastTapTime = now;

    // 触发点击事件
    this.setState(ButtonState.Tap);
    this.triggerEvent(ButtonEvent.TapStart);

    // 播放点击音效
    this.playTapStartSound();

    // 短暂延迟后结束点击
    this.scheduleOnce(() => {
      this.setState(ButtonState.Normal);
      this.triggerEvent(ButtonEvent.TapEnd);
      this.playTapEndSound();
    }, 0.05);
  }

  /**
   * 获取当前交互模式
   */
  public get interactModeValue(): InteractMode {
    return this.interactMode;
  }

  /**
   * 获取长按触发次数
   */
  public get holdTriggerCount(): number {
    return this._holdTriggerCount;
  }

  /**
   * 重置按钮状态
   */
  public reset(): void {
    this.cancelInteraction();
    this.setState(ButtonState.Normal);
    this._lastTapTime = 0;
    this._holdTriggerCount = 0;
  }
}
