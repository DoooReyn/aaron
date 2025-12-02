import { Constructor, Node, UITransform } from 'cc';
import { Service } from '../core';
import {
  GuiConfig,
  IAppLauncher,
  IGui,
  IGuiAlert,
  IGuiController,
  IGuiDrawer,
  IGuiGuide,
  IGuiMarquee,
  IGuiPage,
  IGuiPopup,
  IGuiRootLayers,
  IGuiScreen,
  IGuiToast,
  IGuiTop,
  ILogger,
} from '../interfaces';
import {
  GuiScreen,
  GuiPage,
  GuiPopup,
  GuiAlert,
  GuiToast,
  GuiDrawer,
  GuiMarquee,
  GuiGuide,
  GuiTop,
  GuiHelper,
} from '../foundation';
import { SERVICES } from '../macro';
import { be } from '../utils';

/**
 * 视图服务
 */
export class Gui extends Service implements IGui {
  screen: IGuiScreen;
  page: IGuiPage;
  popup: IGuiPopup;
  alert: IGuiAlert;
  toast: IGuiToast;
  drawer: IGuiDrawer;
  marquee: IGuiMarquee;
  guide: IGuiGuide;
  top: IGuiTop;

  /** 视图配置容器 */
  private _registry: Map<string, GuiConfig> = new Map();

  initialize(): IGuiRootLayers {
    const root = this.resolve<IAppLauncher>(SERVICES.APP_LAUNCHER).root;
    this.screen = new GuiScreen('screen');
    this.page = new GuiPage('page');
    this.popup = new GuiPopup('popup');
    this.alert = new GuiAlert('alert');
    this.toast = new GuiToast('toast');
    this.drawer = new GuiDrawer('drawer');
    this.marquee = new GuiMarquee('marquee');
    this.guide = new GuiGuide('guide');
    this.top = new GuiTop('top');
    const gui = new Node('gui');
    GuiHelper.createLayer(gui);
    gui.addChild(this.screen);
    gui.addChild(this.page);
    gui.addChild(this.popup);
    gui.addChild(this.alert);
    gui.addChild(this.toast);
    gui.addChild(this.drawer);
    gui.addChild(this.marquee);
    gui.addChild(this.guide);
    gui.addChild(this.top);
    root.addChild(gui);
    return {
      root: gui,
      screen: this.screen,
      page: this.page,
      popup: this.popup,
      alert: this.alert,
      toast: this.toast,
      drawer: this.drawer,
      marquee: this.marquee,
      guide: this.guide,
      top: this.top,
    };
  }

  register(config: GuiConfig): void {
    if (this._registry.has(config.token)) {
      if (this._registry.get(config.token) === config) {
        this.resolve<ILogger>(SERVICES.LOGGER).wf('📷 视图: {0} 重复注册, 已跳过', config.token);
      } else {
        this.resolve<ILogger>(SERVICES.LOGGER).wf('📷 视图: {0} 已经注册, 已替换', config.token);
        this._registry.set(config.token, config);
      }
    } else {
      this.resolve<ILogger>(SERVICES.LOGGER).df('📷 视图: {0} 注册成功', config.token);
      this._registry.set(config.token, config);
    }
  }

  registerBatch(configs: GuiConfig[]): void {
    configs.forEach((cfg) => this.register(cfg));
  }

  has(token: string) {
    return this._registry.has(token);
  }

  fetchConfig(keyOrClass: string | Constructor<IGuiController>): GuiConfig | undefined {
    if (be.isString(keyOrClass)) {
      return this._registry.get(keyOrClass as string);
    } else {
      for (const [_, cfg] of this._registry) {
        if (cfg.controller === keyOrClass) {
          return cfg;
        }
      }
      return undefined;
    }
  }

  async close(token: string) {
    if (this._registry.has(token)) {
      const cfg = this._registry.get(token);
      switch (cfg.interface) {
        case 'Alert':
          await this.alert.close(token);
          break;
        case 'Popup':
          await this.popup.close(token);
          break;
        case 'Page':
          await this.page.close(token);
          break;
        case 'Screen':
          if (this.screen.top === token) {
            await this.screen.close(true);
          }
          break;
      }
    }
  }

  async back(): Promise<void> {
    if (this.alert.depth > 0) {
      return this.alert.back();
    } else if (this.popup.depth > 0) {
      return this.popup.back();
    } else if (this.page.depth > 0) {
      return this.page.back();
    } else {
      return this.screen.back();
    }
  }

  debugStacks(tag: string): void {
    throw new Error('Method not implemented.');
  }

  debugSnapshots(tag: string): void {
    throw new Error('Method not implemented.');
  }

  focus() {
    if (this.alert.depth > 0) {
      this.alert.focus();
    } else if (this.popup.depth > 0) {
      this.popup.focus();
    } else if (this.page.depth > 0) {
      this.page.focus();
    } else {
      this.screen.focus();
    }
  }
}
