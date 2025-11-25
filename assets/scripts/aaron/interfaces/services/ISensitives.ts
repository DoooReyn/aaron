import { IService } from '../IService';

/**
 * 敏感词过滤器依赖项
 */
export interface ISensitives extends IService {
  /**
   * @description: 初始化
   * @param {IOptions} options
   * @return {*}
   */
  initialize(options: { wordList?: string[]; noiseWords?: string }): void;
  /**
   * @description: 手动设置干扰词，不设置时将采用默认干扰词
   * @param {string} noiseWords
   * @return {*}
   */
  setNoiseWords(noiseWords: string): void;
  /**
   * @description: 清空敏感词
   * @return {*}
   */
  clearWords(): void;
  /**
   * @description: 添加敏感词
   * @param {string[]} wordList 敏感词数组
   * @return {*}
   */
  addWords(wordList: string[]): void;
  /**
   * @description: 添加敏感词
   * @param word 敏感词
   * @return {*}
   */
  addWord(word: string): void;
  /**
   * @description: 在内容中匹配敏感词
   * @param {string} content 待匹配文本内容
   * @return {string[]} 匹配到的敏感词数组
   */
  match(content: string): string[];
  /**
   * @description: 检测文本中是否包含敏感词
   * @param {string} content 待匹配文本内容
   * @return {boolean}
   */
  verify(content: string): boolean;
  /**
   * @description: 对文本中的敏感词进行过滤替代
   * @param {string} content 待匹配文本内容
   * @param {string} filterChar 敏感词替代符，默认为'*'
   * @return {*}
   */
  filter(content: string, filterChar: string): string;
}
