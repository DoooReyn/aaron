import { Node } from 'cc';
import { aaron } from '../../core';
import { be, literal } from '../../utils';
import { GuiConfig, IGuiInstance, IGuiStack } from '../../interfaces';

/**
 * 拥栈层
 */
export class GuiStack extends Node implements IGuiStack {
  /** 实例栈 */
  private _instances: IGuiInstance[] = [];

  constructor(name: string) {
    super(name);

    this.once(Node.EventType.PARENT_CHANGED, () => aaron.gui.createLayer(this), this);
  }

  /** 视图栈深度变化回调 */
  onViewDepthChanged() {}

  /**
   * 关闭指定深度的视图
   * @note 一般来说,此深度即顶层
   * @param index 深度
   * @param skipAnimation 是否跳过动画
   * @returns
   */
  private async closeOne(index: number, skipAnimation: boolean): Promise<void> {
    const page = this._instances[index];
    if (!page) {
      aaron.logger.wf('📷 视图: 关闭无效,视图不存在,深度 {0}', index);
      return Promise.resolve();
    }

    this._instances.splice(index, 1);
    page.controller.onViewWillDisappear();
    if (!skipAnimation) await aaron.gui.playExit(page.config, page.node);
    page.controller.onViewDidDisappear();
    aaron.gui.closeInstance(page);

    if (this._instances.length === 0) {
      aaron.gui.focus();
    } else {
      this._instances[this._instances.length - 1].controller.onViewFocus();
    }

    this.onViewDepthChanged();
  }

  /**
   * 关闭到指定深度(包括自己)
   * @param index 深度
   * @returns
   */
  private async closeToDepth(index: number): Promise<void> {
    if (index < 0 || index >= this._instances.length) {
      if (index < 0) {
        aaron.logger.w('📷 视图: 关闭无效,深度小于0');
      } else {
        aaron.logger.w('📷 视图: 关闭无效,深度大于栈内深度');
      }
      return Promise.resolve();
    }

    if (this._instances.length === 0) {
      aaron.logger.w('📷 视图: 关闭无效,栈内已无视图');
      return Promise.resolve();
    }

    const depth = this._instances.length;
    for (let i = depth - 1; i >= index; i--) {
      await this.closeOne(i, true);
    }
  }

  /**
   * 内部检查是否对应层级
   * @param cfg Gui 配置
   * @returns
   */
  protected internalInpsect(cfg: GuiConfig): boolean {
    return false;
  }

  async open(config: GuiConfig | string, params?: any): Promise<void> {
    // 打开前检查
    const cfg: GuiConfig = aaron.gui.inspect(config);
    if (cfg === undefined) return;

    if (!this.internalInpsect(cfg)) {
      aaron.logger.wf(
        '📷 视图: {0} 层级不符 {1} != {2}，请检查',
        cfg.token,
        literal.capitalize(this.name),
        cfg.interface,
      );
      return;
    }

    // 1. 如果已经是顶层视图了,则跳过
    if (this._instances.length > 0) {
      const top = this._instances[this._instances.length - 1];
      if (top.config.token === cfg.token) {
        aaron.logger.wf('📷 视图: {0} 已经打开,请勿重复操作', cfg.token);
        return;
      }
    }

    // 2.1 如果不是顶层视图，则判断是否中间视图；
    // 2.2 如果是中间视图，则将原本在它上面的视图全部关闭，相当于将中间视图置顶
    const index = this._instances.findIndex((page) => page.config.token === cfg.token);
    if (index > -1) {
      await this.closeToDepth(index + 1);
      this._instances[index].controller.onViewFocus();
      return;
    }

    // 3. 如果未打开过,则添加为顶层视图
    const inst = await aaron.gui.createInstance(this, cfg);
    if (!inst) return;

    this._instances.push(inst);
    inst.controller.onViewCreated(cfg.token);
    inst.controller.onViewWillAppear(params);
    await aaron.gui.playEnter(cfg, inst.node);
    inst.controller.onViewDidAppear();

    this.onViewDepthChanged();
  }

  async close(config?: GuiConfig | number | string): Promise<void> {
    if (config === undefined) {
      // 关闭全部
      await this.closeToDepth(0);
    } else if (be.isNumber(config)) {
      // 按深度关闭
      const index = config as number;
      const depth = this._instances.length;
      if (index < 0) {
        // 关闭全部
        await this.closeToDepth(0);
      } else if (index === depth - 1) {
        // 关闭顶层视图
        await this.closeOne(index, false);
      } else {
        // 关闭到指定深度
        await this.closeToDepth(index);
      }
    } else if (be.isString(config)) {
      // 关闭到指定视图
      const index = this._instances.findIndex((page) => page.config.token === config);
      if (index > -1) {
        await this.close(index);
      } else {
        aaron.logger.w('📷 视图: 关闭无效,未找到指定视图', config);
      }
    } else if (be.isObject(config) && (config as GuiConfig).token) {
      // 关闭到指定视图
      const token = (config as GuiConfig).token;
      const index = this._instances.findIndex((page) => page.config.token === token);
      if (index > -1) {
        await this.close(index);
      } else {
        aaron.logger.w('📷 视图: 关闭无效,未找到指定视图', config);
      }
    } else {
      aaron.logger.w('📷 视图: 关闭无效,请检查参数', config);
    }
  }

  async back(): Promise<void> {
    if (this._instances.length > 0) {
      await this.closeOne(this._instances.length - 1, false);
    }
  }

  focus(): void {
    if (this._instances.length > 0) {
      this._instances[this._instances.length - 1].controller.onViewFocus();
    }
  }

  get depth() {
    return this._instances.length;
  }

  get top() {
    if (this._instances.length > 0) {
      return this._instances[this._instances.length - 1].config.token;
    }
    return undefined;
  }

  exists(token: string) {
    return this._instances.findIndex((instance) => instance.config.token === token) > -1;
  }
}
