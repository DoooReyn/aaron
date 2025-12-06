import { GuiConfig } from '../../interfaces';
import { GuiStack } from './GuiStack';

/**
 * Page
 * @description 二级页面（一般为全屏带返回按钮的页面）
 */
export class GuiPage extends GuiStack {
  protected internalInspect(config: GuiConfig) {
    return config.interface === 'Page';
  }
}
