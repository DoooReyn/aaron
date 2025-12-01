import { aaron } from '../../core';
import { GuiStack } from './GuiStack';

export class GuiPopup extends GuiStack {
  protected focusNext(): void {
    aaron.gui.page.focus();
  }
}
