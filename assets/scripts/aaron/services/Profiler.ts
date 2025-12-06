import { director, game, profiler, Director, DynamicAtlasManager, Texture2D } from 'cc';

import { Service } from '../core';
import { IArgParser, IPlatform, IProfiler } from '../interfaces';
import { MESSAGES, SERVICES } from '../macro';
import { misc } from '../utils';

/**
 * 性能分析器
 */
export class Profiler extends Service implements IProfiler {
  readonly token: string = MESSAGES.PROFILER.CATEGORY;
  /** 当前纹理映射 */
  private _texturesMap: Map<number, Texture2D> = new Map();
  /** 纹理日志记录 */
  private _texturesLog: Map<number, string[]> = new Map();

  constructor() {
    super();

    this.initDebugPanel();
    this.monitorTextures();

    if (!this.debuggerAllowed) {
      misc.ban();
    }
  }

  /**
   * 是否允许被调试（发布版需要禁止调试）
   */
  private get debuggerAllowed() {
    const platform = this.resolve<IPlatform>(SERVICES.PLATFORM);
    const argParser = this.resolve<IArgParser>(SERVICES.ARG_PARSER);
    return platform.desktopBrowser && argParser.isDev;
  }

  /**
   * 监控纹理数量
   */
  private monitorTextures() {
    if (this.debuggerAllowed) {
      const that = this;
      // @ts-ignore
      const construct: any = Texture2D.prototype._createTexture;
      const destruct: any = Texture2D.prototype.destroy;
      // @ts-ignore
      Texture2D.prototype._createTexture = function () {
        const self = this as Texture2D;
        const hash = self.getHash();
        that._texturesMap.set(this.getHash(), this);
        that.appendTextureLog('创建纹理', hash);
        return construct.apply(self, arguments);
      };
      Texture2D.prototype.destroy = function () {
        const self = this as Texture2D;
        const hash = self.getHash();
        that._texturesMap.delete(hash);
        that.appendTextureLog('销毁纹理', hash);
        return destruct.apply(self, arguments);
      };
      director.on(Director.EVENT_AFTER_DRAW, debugPanel.update, debugPanel);
    }
  }

  /** 初始化调试信息 */
  private initDebugPanel() {
    if (this.debuggerAllowed) {
      profiler.hideStats();
      const dam = DynamicAtlasManager.instance;
      debugPanel.addItem('device', '设备信息', () => director.root!.device.renderer);
      debugPanel.addItem('triangles', '三角面数', () => `${director.root!.device.numTris}`);
      debugPanel.addItem('fps', '实时帧率', () => `${director.root!.fps || (1.0 / game.deltaTime) | 0}`);
      debugPanel.addItem('drawcalls', '绘制调用', () => `${director.root!.device.numDrawCalls}`);
      debugPanel.addItem('textures', '纹理数量', () => `${this.textureCount}`);
      debugPanel.addItem(
        'texSize',
        '纹理内存',
        () => `${(director.root!.device.memoryStatus.textureSize / 1024 / 1024).toFixed(2)}M`
      );
      debugPanel.addItem(
        'bufSize',
        '纹理缓冲',
        () => `${(director.root!.device.memoryStatus.bufferSize / 1024 / 1024).toFixed(2)}M`
      );
      debugPanel.addItem('dynamicAtlas', '动态图集', () => {
        return [
          `开关: ${dam.enabled ? 'On' : 'Off'}`,
          `当前图集数量: ${dam.atlasCount}`,
          `最大图集数量: ${dam.maxAtlasCount}`,
          `单图集的尺寸: ${dam.textureSize}x${dam.textureSize}`,
          `可入图集的最大纹理尺寸: ${dam.maxFrameSize}x${dam.maxFrameSize}`,
        ].join('\n');
      });
    }
  }

  /**
   * 添加纹理日志
   * @param header 日志头
   * @param hash 纹理哈希值
   */
  private appendTextureLog(header: string, hash: number) {
    if (this.debuggerAllowed) {
      const head = `${header}<${hash}>`;
      const stack = [head, this.getErrorStack(6)].join('\n');
      if (this._texturesLog.has(hash)) {
        this._texturesLog.get(hash)!.push(stack);
      } else {
        this._texturesLog.set(hash, [stack]);
      }
    }
  }

  /**
   * 获取错误堆栈内容
   * @param depth 深度
   */
  private getErrorStack(depth: number) {
    return new Error().stack!.split('\n').slice(depth).join('\n');
  }

  public get textureCount() {
    return this._texturesMap.size;
  }

  public dumpTextureLog(hashOrTexture: number | Texture2D) {
    let hash: number;
    if (hashOrTexture instanceof Texture2D) {
      hash = hashOrTexture.getHash();
    } else {
      hash = hashOrTexture;
    }

    if (this._texturesLog.has(hash)) {
      this.logger.d(MESSAGES.PROFILER.TEXTURE_DETAILS, hash);
      console.table(this._texturesLog.get(hash)!);
    }
  }

  public getTextureCache(hash: number): Texture2D | undefined {
    return this._texturesMap.get(hash);
  }

  public dumpTextures() {
    if (this.debuggerAllowed) {
      let textures = [] as { hash: number; width: number; height: number; memoryUsage: string }[];
      let totalMemory = 0;
      this._texturesMap.forEach((v) => {
        const memory = (v.width * v.height * 4) / 1024;
        textures.push({
          hash: v.getHash(),
          width: v.width,
          height: v.height,
          memoryUsage: memory.toFixed(2) + 'K',
        });
        totalMemory += memory / 1024;
      });
      this.logger.df(MESSAGES.PROFILER.MEMORY_OCCUPY, totalMemory.toFixed(2));
      console.table(
        textures.sort((a, b) => b.width * b.height - a.width * a.height),
        ['hash', 'width', 'height', 'memoryUsage']
      );
    }
  }

  public reload() {
    this.resolve<IPlatform>(SERVICES.PLATFORM).browser && window.location.reload();
  }

  public addDebugItem(
    key: string,
    title: string,
    getter: () => string | number | undefined | null
  ): HTMLElement | undefined {
    if (this.debuggerAllowed) {
      return debugPanel.addItem(key, title, getter);
    }
  }

  public removeDebugItem(key: string): void {
    if (this.debuggerAllowed) {
      debugPanel.removeItem(key);
    }
  }
}
