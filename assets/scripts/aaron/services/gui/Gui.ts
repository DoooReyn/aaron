import { Constructor, Node } from 'cc';
import { Service } from '../../core';
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
} from '../../interfaces';
import { GuiScreen } from './GuiScreen';
import { GuiPage } from './GuiPage';
import { GuiPopup } from './GuiPopup';
import { GuiAlert } from './GuiAlert';
import { GuiToast } from './GuiToast';
import { GuiDrawer } from './GuiDrawer';
import { GuiMarquee } from './GuiMarquee';
import { GuiGuide } from './GuiGuide';
import { GuiTop } from './GuiTop';
import { SERVICES } from '../../macro';

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
    throw new Error('Method not implemented.');
  }
  registerMBatch(configs: GuiConfig[]): void {
    throw new Error('Method not implemented.');
  }
  fetchConfig(keyOrClass: string | Constructor<IGuiController>, source: string): GuiConfig | undefined {
    throw new Error('Method not implemented.');
  }
  back(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  debugStacks(tag: string): void {
    throw new Error('Method not implemented.');
  }
  debugSnapshots(tag: string): void {
    throw new Error('Method not implemented.');
  }
}
