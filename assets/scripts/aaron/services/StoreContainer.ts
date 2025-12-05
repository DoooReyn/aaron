import { Service } from '../core';
import { StoreEntry } from '../foundation';
import { IArgParser, IPlatform, IStoreContainer, IStoreModem } from '../interfaces';
import { MESSAGES, SERVICES } from '../macro';
import { Dict } from '../types';
import { json, lz4, zson } from '../utils';

/**
 * 本地存储容器服务
 */
export class StoreContainer extends Service implements IStoreContainer {
  readonly token: string = MESSAGES.STORE.CATEGORY;
  /** 存储条目容器 */
  private readonly _container: Map<string, StoreEntry<Dict>> = new Map();

  public readonly modem: IStoreModem;

  constructor() {
    super();

    const argParser = this.resolve<IArgParser>(SERVICES.ARG_PARSER);
    const isBrowser = this.resolve<IPlatform>(SERVICES.PLATFORM).browser;
    this.modem = {
      makeKey(token: string) {
        if (argParser.isDev && isBrowser) {
          const user = argParser.args.user ?? 'guest';
          return `[${argParser.args.appName}]@${user}:${token}`;
        } else {
          return `[${argParser.args.appName}]:${token}`;
        }
      },
      encode<T extends Dict>(data: T) {
        if (argParser.isProd) {
          return lz4.encode(zson.encode(data));
        } else {
          return json.encode(data);
        }
      },
      decode<T extends Dict>(data: string) {
        if (argParser.isProd) {
          return zson.decode(lz4.decode(data)) as T;
        } else {
          return json.decode(data) as T;
        }
      },
    };
  }

  public register<T extends object>(alias: string, template: T) {
    if (!this._container.has(alias)) {
      this._container.set(alias, new StoreEntry(alias, template, this.modem));
    }
  }

  public unregister(alias: string) {
    this._container.delete(alias);
  }

  public save(alias?: string) {
    if (alias === undefined) {
      this._container.forEach((v) => v.save());
    } else {
      this._container.get(alias)?.save();
    }
  }

  public load(alias?: string) {
    if (alias === undefined) {
      this._container.forEach((v) => v.load());
    } else {
      this._container.get(alias)?.load();
    }
  }

  public itemOf<T extends object>(alias: string): StoreEntry<T> | undefined {
    return this._container.get(alias) as StoreEntry<T> | undefined;
  }
}
