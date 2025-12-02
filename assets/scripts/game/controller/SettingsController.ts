import { Label, Button } from 'cc';
import { GuiBindingMap, GuiConfig, GuiController } from '../../aaron';

export class SettingsController extends GuiController<typeof SettingsController.Spec> {
  public static readonly Config: GuiConfig = {
    interface: 'Popup',
    token: 'PopupSettings',
    path: 'l:resources@PopupSettings',
    cachePolicy: 'Expires',
    cacheExpires: 60_000,
    controller: SettingsController,
    modal: false,
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
