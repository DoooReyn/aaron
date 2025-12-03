import { Label, Button, _decorator } from 'cc';
import { GuiBindingMap, GuiConfig, GuiController } from '../../aaron';

const { ccclass } = _decorator;

@ccclass('SettingsController')
export class SettingsController extends GuiController<typeof SettingsController.Spec> {
  public static readonly Config: GuiConfig = {
    interface: 'Popup',
    token: 'GuiSettings',
    path: 'l:resources@GuiSettings',
    cachePolicy: 'Expires',
    cacheExpires: 60_000,
    enterTweenLib: ['popup-in'],
    exitTweenLib: ['popup-out'],
    controller: SettingsController,
    closeOnMaskClick: true,
  };

  public static readonly Spec = {
    body: ['Bkg', 'node'],
    title: ['Title', 'component', Label],
    btnClose: ['BtnClose', 'component', Button],
  } as const satisfies GuiBindingMap;

  onViewWillAppear(): void {
    super.onViewWillAppear();
    this.refs.btnClose.node.on(Button.EventType.CLICK, this.close, this);
  }

  onViewWillDisappear(): void {
    super.onViewWillDisappear();
    this.refs.btnClose.node.off(Button.EventType.CLICK, this.close, this);
  }
}
