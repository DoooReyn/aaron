import { director, game, screen, view, Camera, Canvas, Director, EventTouch, Game, Node, Scene } from 'cc';

import { Service } from '../core';
import { IAppLauncher, IEventBus, ITimer } from '../interfaces';
import { EVENTS, MESSAGES, PRESET, SERVICES } from '../macro';
import { digit, misc, time } from '../utils';

/**
 * 应用启动器服务
 */
export class AppLauncher extends Service implements IAppLauncher {
  readonly token: string = MESSAGES.APP_LAUNCHER.CATEGORY;

  scene: Scene;
  stage: Canvas;
  root: Node;
  camera2D: Camera;

  /** 时间记录点：回调前台 */
  private _timeEnterFG: number = 0;

  /** 时间记录点：进入后台 */
  private _timeEnterBG: number = 0;

  initialize() {
    return new Promise<void>((resolve, reject) => {
      director.once(
        Director.EVENT_AFTER_SCENE_LAUNCH,
        (scene: Scene) => {
          this.scene = scene;

          // 根节点： PRESET.ROOT
          this.root = scene.getChildByName(PRESET.ROOT);
          if (!this.root) {
            reject(MESSAGES.APP_LAUNCHER.INVALID_ROOT);
          }

          // 舞台
          this.stage = this.root.getComponent(Canvas);
          if (!this.stage) {
            reject(MESSAGES.APP_LAUNCHER.CANVAS_NEEDED);
          }

          // 2D相机: PRESET.CAMERA_2D
          const camera2D = this.root.getChildByName(PRESET.CAMERA_2D);
          if (!camera2D) {
            reject(MESSAGES.APP_LAUNCHER.INVALID_2D_CAMERA);
          }

          // 2D相机组件
          this.camera2D = camera2D?.getComponent(Camera);
          if (!this.camera2D) {
            reject(MESSAGES.APP_LAUNCHER.CAMERA_NEEDED);
          }

          // 代理窗口尺寸变换事件
          this.onScreenSizeChangedMock = misc.throttle(this.onScreenSizeChanged, this).bind(this);

          // 注册基础事件
          game.on(Game.EVENT_SHOW, this.onEnterFG, this);
          game.on(Game.EVENT_HIDE, this.onEnterBG, this);
          game.on(Game.EVENT_CLOSE, this.onEnded, this);
          game.on(Game.EVENT_LOW_MEMORY, this.onLowMemory, this);
          screen.on(EVENTS.APP.SCREEN_SIZE_CHANGED, this.onScreenSizeChangedMock, this);
          screen.on(EVENTS.APP.SCREEN_FULL_CHANGED, this.onScreenSizeChangedMock, this);
          screen.on(EVENTS.APP.SCREEN_ORIENTATION_CHANGED, this.onScreenOrientationChanged, this);
          director.on(Director.EVENT_AFTER_UPDATE, this.onUpdate, this);
          this.root.on(Node.EventType.TOUCH_END, this.onScreenTapped, this, true);

          resolve();
        },
        this
      );
    });
  }

  /**
   * 获取从后台返回前台耗时
   * @description 开发者可以根据时长决定是否执行某些操作
   */
  public get elapsed() {
    return this._timeEnterFG - this._timeEnterBG;
  }

  /** 回到前台  */
  private onEnterFG(): void {
    this._timeEnterFG = time.now();
    const diff = digit.keepBits((this._timeEnterFG - this._timeEnterBG) / 1000, 2);
    this.logger.df(MESSAGES.APP_LAUNCHER.ENTER_FOREGROUND, diff);
    this.resolve<IEventBus>(SERVICES.EVENT_BUS).app.emit(EVENTS.APP.ENTER_FOREGROUND);
  }

  /** 进入后台  */
  private onEnterBG(): void {
    this._timeEnterBG = time.now();
    this.logger.d(MESSAGES.APP_LAUNCHER.ENTER_BACKGROUND);
    this.resolve<IEventBus>(SERVICES.EVENT_BUS).app.emit(EVENTS.APP.ENTER_BACKGROUND);
  }

  /** 关闭应用 */
  private onEnded(): void {
    this.resolve<ITimer>(SERVICES.TIMER)?.stop();
    this.root.off(Node.EventType.TOUCH_END, this.onScreenTapped, this, true);
    game.off(Game.EVENT_SHOW, this.onEnterFG, this);
    game.off(Game.EVENT_HIDE, this.onEnterBG, this);
    game.off(Game.EVENT_CLOSE, this.onEnded, this);
    game.off(Game.EVENT_LOW_MEMORY, this.onLowMemory, this);
    screen.off(EVENTS.APP.SCREEN_SIZE_CHANGED, this.onScreenSizeChangedMock, this);
    screen.off(EVENTS.APP.SCREEN_FULL_CHANGED, this.onScreenSizeChangedMock, this);
    screen.off(EVENTS.APP.SCREEN_ORIENTATION_CHANGED, this.onScreenOrientationChanged, this);
    this.resolve<IEventBus>(SERVICES.EVENT_BUS).app.emit(EVENTS.APP.EXIT);
    this.scene = this.root = this.stage = this.camera2D = null;
    this.onScreenSizeChangedMock = null;
  }

  /** 内存警告 */
  private onLowMemory(): void {
    this.logger.d(MESSAGES.APP_LAUNCHER.OUT_OF_MEMORY);
    this.resolve<IEventBus>(SERVICES.EVENT_BUS).app.emit(EVENTS.APP.LOW_MEMORY);
  }

  /** 窗口尺寸变化 */
  private onScreenSizeChanged(): void {
    const size = view.getVisibleSize();
    this.logger.d(MESSAGES.APP_LAUNCHER.SCREEN_SIZE_CHANGED, size.toString());
    this.resolve<IEventBus>(SERVICES.EVENT_BUS).app.emit(EVENTS.APP.SCREEN_SIZE_CHANGED, size);
  }

  /** 窗口尺寸变化代理 */
  private onScreenSizeChangedMock: () => void;

  /** 屏幕朝向变化 */
  private onScreenOrientationChanged(orientation: number): void {
    this.logger.d(MESSAGES.APP_LAUNCHER.SCREEN_ORIENTATION_CHANGED, orientation);
    this.resolve<IEventBus>(SERVICES.EVENT_BUS).app.emit(EVENTS.APP.SCREEN_ORIENTATION_CHANGED, orientation);
  }

  /**
   * 屏幕被点击
   * @param touch 触摸事件
   */
  private onScreenTapped(touch: EventTouch): void {
    const loc = touch.getLocation();
    if (this.root._uiProps.uiTransformComp.hitTest(loc)) {
      this.logger.df(MESSAGES.APP_LAUNCHER.SCREEN_TAPPED, loc.x, loc.y);
      this.resolve<IEventBus>(SERVICES.EVENT_BUS).app.emit(EVENTS.GUI.SCREEN_TAPPED, touch);
    }
  }

  /**
   * 系统定时器更新
   */
  private onUpdate() {
    this.resolve<ITimer>(SERVICES.TIMER).update(game.deltaTime);
  }
}
