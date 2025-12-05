import { sys } from 'cc';

import { Service } from '../core';
import {
  IEventBus,
  ILocalization,
  IStoreContainer,
  IStoreEntryOfLang,
  Language,
  LanguageDictionary
} from '../interfaces';
import { EVENTS, MESSAGES, SERVICES, STORE } from '../macro';
import { literal } from '../utils';

/**
 * 国际化工具
 */
export class Localization extends Service implements ILocalization {
  readonly token: string = MESSAGES.LOCALIZATION.CATEGORY;
  /** 当前语言 */
  private _current: Language = sys.Language.CHINESE;

  /** 支持的语言列表 */
  private readonly _supported: Set<Language> = new Set();

  /** 字典容器 */
  private readonly _container: Map<Language, Map<string, LanguageDictionary>> = new Map();

  /**
   * 使用文本编号获取多语言文本
   * @param id 文本编号
   * @returns
   */
  private getTextById(id: string) {
    if (this._container.has(this._current)) {
      const dictionaries = this._container.get(this._current)!;
      for (let [, dictionary] of dictionaries) {
        if (dictionary[id] != undefined) {
          return dictionary[id];
        }
      }
    }

    this.logger.wf(MESSAGES.LOCALIZATION.ID_NOT_FOUND, id);

    return 'xxx@' + id;
  }

  /**
   * 从字典中获取多语言文本
   * @param name 字典名称
   * @param id 文本编号
   * @returns
   */
  private getTextFromDict(name: string, id: string) {
    if (this._container.has(this._current)) {
      const dictionaries = this._container.get(this._current)!;
      if (dictionaries.has(name)) {
        const dictionary = dictionaries.get(name)!;
        const text = dictionary[id];
        if (text != undefined) {
          return text;
        }
      }
    }

    this.logger.wf(MESSAGES.LOCALIZATION.ID_NOT_FOUND_IN_DICT, name, id);

    return name + '@' + id;
  }

  get language() {
    return this._current;
  }
  set language(lang: Language) {
    this._current = lang;
    this.resolve<IStoreContainer>(SERVICES.STORE).itemOf<IStoreEntryOfLang>(STORE.LANGUAGE)!.data!.language = lang;
    this.resolve<IEventBus>(SERVICES.EVENT_BUS).app.emit(EVENTS.APP.LANGUAGE_CHANGED, this._current);
  }

  initialize(options: { language?: Language; supported?: Language[] }) {
    // 添加支持的语言
    this._supported.add(options.language);
    if (options.supported) {
      for (let i = 0; i < options.supported.length; i++) {
        this._supported.add(options.supported[i]);
      }
    }

    // 设置当前语言
    // 1. 如果本地已经有记录，则使用本地缓存的语言
    // 2. 如果没有本地记录，则使用当前系统的语言
    // 3. 如果系统语言不在支持列表中，则使用传入的语言
    const store = this.resolve<IStoreContainer>(SERVICES.STORE);
    store.register<IStoreEntryOfLang>(STORE.LANGUAGE, { language: this._current });
    const preset = store.itemOf<IStoreEntryOfLang>(STORE.LANGUAGE);
    if (preset) {
      // 使用缓存语言
      this.language = preset.data!.language;
      this.logger.df(MESSAGES.LOCALIZATION.USE_CACHE, this.language);
    } else {
      const lang = sys.language;
      if (this._supported.has(lang)) {
        // 使用系统语言
        this.language = lang;
        this.logger.df(MESSAGES.LOCALIZATION.USE_SYSTEM, this.language);
      } else {
        // 使用传入语言
        this.language = options.language;
        this.logger.df(MESSAGES.LOCALIZATION.USE_PASS_IN, this.language);
      }
    }
  }

  isSupported(language: Language) {
    return this._supported.has(language);
  }

  text(nameOrId: string, id?: string): string {
    if (id === undefined) {
      return this.getTextById(nameOrId);
    } else {
      return this.getTextFromDict(nameOrId, id);
    }
  }

  fmt(nameOrId: string, id?: string, ...args: []): string {
    const text = this.text(nameOrId, id);
    return literal.fmt(text, ...args);
  }

  add(language: Language, name: string, dictionary: LanguageDictionary) {
    this._supported.add(language);
    if (this._container.has(language)) {
      const dictionaries = this._container.get(language)!;
      dictionaries.set(name, dictionary);
      this.logger.wf(MESSAGES.LOCALIZATION.UPDATE_DICT, name);
    } else {
      const dictionaries = new Map();
      this._container.set(language, dictionaries);
      dictionaries.set(name, dictionary);
      this.logger.df(MESSAGES.LOCALIZATION.ADD_DICT, name);
    }
  }

  del(language: Language, name: string) {
    if (this._container.has(language)) {
      const dictionary = this._container.get(language)!;
      dictionary.delete(name);
      this.logger.df(MESSAGES.LOCALIZATION.DEL_DICT, name);
      if (dictionary.size === 0) {
        this._container.delete(language);
      }
    }
  }

  clear(language: Language) {
    if (this._container.has(language)) {
      this._container.delete(language);
    }
  }

  clearAll() {
    this._supported.clear();
    this._container.clear();
  }
}
