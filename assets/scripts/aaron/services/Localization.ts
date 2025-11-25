import { sys } from "cc";
import { aaron, Service } from "../core";
import { ILocalization, IStoreEntryOfLang, Language, LanguageDictionary } from "../interfaces";
import { EVENTS, STORE } from "../macro";
import { literal } from "../utils";

/**
 * 国际化工具
 */
export class Localization extends Service implements ILocalization {
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
    return name + '@' + id;
  }

  get language() {
    return this._current;
  }
  set language(lang: Language) {
    this._current = lang;
    aaron.store.itemOf<IStoreEntryOfLang>(STORE.LANGUAGE)!.data!.language = lang;
    aaron.eventBus.app.emit(EVENTS.APP.LANGUAGE_CHANGED, this._current);
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
    aaron.store.register<IStoreEntryOfLang>(STORE.LANGUAGE, { language: this._current });
    const preset = aaron.store.itemOf<IStoreEntryOfLang>(STORE.LANGUAGE);
    if (preset) {
      // 使用缓存语言
      this.language = preset.data!.language;
    } else {
      const lang = sys.language;
      if (this._supported.has(lang)) {
        // 使用系统语言
        this.language = lang;
      } else {
        // 使用传入语言
        this.language = options.language;
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
    } else {
      const dictionaries = new Map();
      this._container.set(language, dictionaries);
      dictionaries.set(name, dictionary);
    }
  }

  del(language: Language, name: string) {
    if (this._container.has(language)) {
      const dictionary = this._container.get(language)!;
      dictionary.delete(name);
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
