import { Button, Label, _decorator } from 'cc';
import { aaron, GuiBindingMap, GuiConfig, GuiController } from '../../aaron';
import { ResPath } from '../data/ResPath';
import { SettingsController } from './SettingsController';

const { ccclass } = _decorator;

@ccclass('UserInfoController')
export class UserInfoController extends GuiController<typeof UserInfoController.Spec> {
  public static readonly Config: GuiConfig = {
    interface: 'Popup',
    token: 'GuiUserInfo',
    path: 'l:resources@GuiUserInfo',
    cachePolicy: 'Expires',
    cacheExpires: 60_000,
    controller: UserInfoController,
    closeOnMaskClick: true,
  };

  public static readonly Spec = {
    body: ['Bkg', 'node'],
    btnClose: ['BtnClose', 'component', Button],
    btnSettings: ['BtnSettings', 'component', Button],
    title: ['Title', 'component', Label],
  } as const satisfies GuiBindingMap;

  onViewWillAppear(): void {
    super.onViewWillAppear();
    this.refs.btnClose.node.on(Button.EventType.CLICK, this.close, this);
    this.refs.btnSettings.node.on(Button.EventType.CLICK, this.openSettings, this);
  }

  onViewWillDisappear(): void {
    super.onViewWillDisappear();
    this.refs.btnClose.node.off(Button.EventType.CLICK, this.close, this);
    this.refs.btnSettings.node.off(Button.EventType.CLICK, this.openSettings, this);
  }

  private openSettings(): void {
    aaron.gui.open(SettingsController.Config);
  }
}
