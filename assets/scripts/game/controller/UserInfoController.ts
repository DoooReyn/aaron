import { Button, _decorator } from 'cc';
import { aaron, GuiBindingMap, GuiController } from '../../aaron';

const { ccclass } = _decorator;

@ccclass('UserInfoController')
export class UserInfoController extends GuiController<typeof UserInfoController.UiSpec> {
  protected static readonly UiSpec = {
    btnClose: ['BtnClose', 'component', Button],
  } as const satisfies GuiBindingMap;

  onViewDidAppear(): void {
    super.onViewDidAppear();
    this.refs.btnClose.node.on(Button.EventType.CLICK, this.close, this);
  }

  onViewDidDisappear(): void {
    super.onViewDidDisappear();
    this.refs.btnClose.node.off(Button.EventType.CLICK, this.close, this);
  }
}
