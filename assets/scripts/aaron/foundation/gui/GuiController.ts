import { Node, Component, EventTouch, _decorator } from 'cc';
import { GuiBindingMap, GuiBindingRefs, GuiBindingSpec, GuiBindingType, IGuiController } from '../../interfaces';
import { aaron } from '../../core';
import { Atom } from '../../atom';
import { be } from '../../utils';

const { ccclass } = _decorator;

/**
 * 视图控制器
 * @note 请配置静态属性 Config 方便自动注册视图
 * @note 请配置静态属性 Spec 方便自动解析视图绑定的节点或组件
 */
@ccclass('GuiController')
export class GuiController<M extends GuiBindingMap = {}> extends Atom implements IGuiController<M> {
  /** 视图标识 */
  private _token: string;
  /** 输入参数 */
  protected $params: any;

  /** 视图引用字典（根据绑定配置自动生成） */
  refs!: GuiBindingRefs<M>;

  /**
   * 根据绑定配置解析节点/组件引用
   * @param root 根节点
   * @param spec 绑定配置
   * @returns 引用字典
   */
  private bindView(root: Node, spec: GuiBindingMap): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(spec)) {
      const entry = spec[key];

      // 支持元组与对象两种写法，统一规范为对象配置
      let conf: GuiBindingSpec;
      if (Array.isArray(entry)) {
        const [path, kindOrUndefined, component] = entry as any[];
        const kind = (kindOrUndefined ?? 'node') as GuiBindingType;
        if (kind === 'node') {
          conf = { kind: 'node', path };
        } else if (kind === 'nodes') {
          conf = { kind: 'nodes', path };
        } else if (kind === 'component') {
          conf = { kind: 'component', path, component: component as any };
        } else {
          conf = { kind: 'components', path, component: component as any };
        }
      } else {
        conf = entry;
      }
      const required = conf.required ?? true;

      // 1. 特殊语法：前缀匹配节点（仅对 kind === "nodes" 生效）
      if (conf.kind === 'nodes') {
        const segments = conf.path.split('/').filter(Boolean);
        const last = segments[segments.length - 1];
        if (last && last.endsWith('#')) {
          const prefix = last.slice(0, -1);
          const parentPath = segments.slice(0, -1).join('/') || '.';
          const parentNode = this.resolveNode(root, parentPath);
          if (!parentNode) {
            if (required) {
              aaron.logger.w(`视图:解析绑定配置,索引节点未找到, key=${key}, path=${conf.path}`);
            }
            result[key] = [];
            continue;
          }

          const matches = parentNode.children.filter((child) => child.name.startsWith(prefix));
          result[key] = matches;
          continue;
        }
      }

      // 2. 普通路径：解析到单个节点
      const node = this.resolveNode(root, conf.path);
      if (!node) {
        if (required) {
          // 必需但未找到：给出警告，方便调试
          aaron.logger.w(`视图:解析绑定配置,节点未找到, key=${key}, path=${conf.path}`);
        }
        // 根据 kind 返回 null 或空数组
        result[key] = conf.kind === 'components' || conf.kind === 'nodes' ? [] : null;
        continue;
      }

      // 3. 根据 kind 绑定
      switch (conf.kind) {
        case 'node': {
          result[key] = node;
          break;
        }
        case 'nodes': {
          result[key] = [node];
          break;
        }
        case 'component': {
          result[key] = node.getComponent(conf.component) ?? null;
          if (result[key] == null && required) {
            aaron.logger.w(`视图:解析绑定配置,组件未找到, key=${key}, path=${conf.path}`);
          }
          break;
        }
        case 'components': {
          result[key] = node.getComponents(conf.component);
          if ((result[key] as Component[]).length === 0 && required) {
            aaron.logger.w(`视图:解析绑定配置,组件未找到, key=${key}, path=${conf.path}`);
          }
          break;
        }
      }
    }

    return result;
  }

  /**
   * 简单路径解析："." 或 "A/B/C"
   * @param root 根节点
   * @param path 路径
   * @returns 节点
   */
  private resolveNode(root: Node, path: string): Node | null {
    if (!path || path === '.') {
      return root;
    }

    const segments = path.split('/').filter(Boolean);
    let current: Node | null = root;
    for (const name of segments) {
      if (!current) {
        return null;
      }
      current = current.getChildByName(name);
    }
    return current;
  }

  protected onBodyClicked(event: EventTouch): void {
    // 处理点击事件
  }

  get token() {
    return this._token;
  }

  onViewCreated(token: string): void {
    this._token = token;
    const spec = (this.constructor as unknown as { Spec: GuiBindingMap }).Spec ?? {};
    this.refs = this.bindView(this.node, spec) as GuiBindingRefs<M>;
  }

  onViewWillAppear(params?: any): void {
    this.$params = params;
    if (be.isCCNode(this.refs.body)) {
      (<Node>this.refs.body).on(Node.EventType.TOUCH_END, this.onBodyClicked, this);
    }
  }

  onViewDidAppear(): void {}

  onViewWillDisappear(): void {
    if (be.isCCNode(this.refs.body)) {
      (<Node>this.refs.body).off(Node.EventType.TOUCH_END, this.onBodyClicked, this);
    }
  }

  onViewDidDisappear(): void {}

  onViewDisposed(): void {}

  onViewFocus(): void {}

  close() {
    aaron.gui.close(this.token);
  }

  back(): void {}

  onInit(): void {}

  onLaunch(): void {}

  onRegisterEvent(): void {}

  onActivate(): void {}

  onUpdate(dt: number): void {}

  onPostUpdate(dt: number): void {}

  onUnregisterEvent(): void {}

  onDeactivate(): void {}

  onPreTerminate(): void {}

  onTerminate(): void {}
}
