import { aaron } from '../../core';
import { GuiStack } from './GuiStack';

export class GuiAlert extends GuiStack {
  protected focusNext(): void {
    aaron.gui.popup.focus();
  }
}
