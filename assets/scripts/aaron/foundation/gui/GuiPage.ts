import { GuiConfig } from '../../interfaces';
import { GuiStack } from './GuiStack';

/**
 * Page 页面层
 * @description 二级页面（全屏，带返回按钮）
 */
export class GuiPage extends GuiStack {
  protected internalInpsect(config: GuiConfig) {
    return config.interface === 'Page';
  }
}
