import { aaron } from '../../core';
import { GuiStack } from './GuiStack';

/**
 * Page 层
 */
export class GuiPage extends GuiStack {
  protected focusNext(): void {
    aaron.gui.screen.focus();
  }
}
