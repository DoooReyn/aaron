import { GuiConfig, IGuiScreen } from '../../interfaces';

export class GuiScreen extends IGuiScreen {
  open(config: GuiConfig, params?: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
