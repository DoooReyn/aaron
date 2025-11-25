import { Service } from '../core';
import { ISensitives } from '../interfaces';

/** 默认干扰词 */
const DEFAULT_NOISE_WORDS =
  ' \t\r\n~!@#$%^&*()_+-=【】、{}|;\':"，。、《》？' +
  'αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ' +
  '。，、；：？！…—·ˉ¨‘’“”々～‖∶＂＇｀｜〃〔〕〈〉' +
  '《》「」『』．〖〗【】（）［］｛｝' +
  'ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ⒈⒉⒊⒋⒌⒍⒎⒏⒐⒑⒒⒓⒔⒕⒖⒗⒘⒙⒚⒛' +
  '㈠㈡㈢㈣㈤㈥㈦㈧㈨㈩①②③④⑤⑥⑦⑧⑨⑩' +
  '⑴⑵⑶⑷⑸⑹⑺⑻⑼⑽⑾⑿⒀⒁⒂⒃⒄⒅⒆⒇' +
  '≈≡≠＝≤≥＜＞≮≯∷±＋－×÷／∫∮∝∞∧∨∑∏∪∩∈∵∴⊥∥∠⌒⊙≌∽√§№☆★○●◎◇◆□℃‰€■△▲※' +
  '→←↑↓〓¤°＃＆＠＼︿＿￣―♂♀┌┍┎┐┑┒┓─┄┈├┝┞┟┠┡┢┣│┆┊' +
  '┬┭┮┯┰┱┲┳┼┽┾┿╀╁╂╃└┕┖┗┘┙┚┛━┅┉┤┥┦┧┨┩┪┫┃┇┋┴┵┶┷┸┹┺┻╋╊╉╈╇╆╅╄';

/** 用于标识敏感词结束位置的Symbol标记 */
const WORD_END_TAG: symbol = Symbol.for('WORD_END_TAG');

/** 敏感词映射树的节点接口 */
interface IWordMap {
  [property: string | symbol]: IWordMap | boolean;
}

/**
 * 生成干扰词字符映射表
 *
 * @param noiseWords - 干扰词字符串
 * @returns 字符编码到布尔值的映射表
 *
 * @example
 * ```typescript
 * const noiseMap = generateNoiseWordMap('.,!?');
 * console.log(noiseMap[44]); // true (字符 ',')
 * console.log(noiseMap[65]); // false (字符 'A')
 * ```
 */
function generateNoiseWordMap(noiseWords: string): Record<number, boolean> {
  const noiseWordMap: Record<number, boolean> = {};
  for (let i = 0, j = noiseWords.length; i < j; i++) {
    noiseWordMap[noiseWords.charCodeAt(i)] = true;
  }
  return noiseWordMap;
}

/**
 * 检查当前节点是否达到了敏感词的结束位置
 *
 * @param point - 敏感词映射树的节点
 * @returns 是否为敏感词结束节点
 *
 * @example
 * ```typescript
 * const isEnd = isWordEnd({ 'h': true, [Symbol.for('WORD_END_TAG')]: true });
 * // true - 表示这是一个完整的敏感词
 * ```
 */
function isWordEnd(point: IWordMap): boolean {
  return Reflect.has(point, WORD_END_TAG);
}

/**
 * 敏感词过滤器服务
 *
 * 基于Trie树算法的高性能敏感词检测和过滤服务，支持中英文敏感词匹配，
 * 自动过滤干扰字符（如标点符号、空格等），提供精确的敏感词替换功能。
 *
 * @example
 * ```typescript
 * // 创建敏感词过滤器实例
 * const sensitives = new Sensitives();
 *
 * // 初始化并添加敏感词
 * sensitives.initialize({
 *   wordList: ['违禁品', '敏感词', 'badword'],
 *   noiseWords: '.,!?'
 * });
 *
 * // 检测文本是否包含敏感词
 * const hasSensitive = sensitives.verify('这是一个测试');
 *
 * // 匹配文本中的所有敏感词
 * const matches = sensitives.match('包含违禁品的文本');
 *
 * // 过滤敏感词
 * const filtered = sensitives.filter('敏感词内容', '*');
 * ```
 */
export class Sensitives extends Service implements ISensitives {
  /** 敏感词Trie树映射表 */
  private __map: IWordMap = {};
  /** 干扰字符映射表 */
  private __noiseWordMap = generateNoiseWordMap(DEFAULT_NOISE_WORDS);

  /**
   * 初始化敏感词过滤器
   *
   * 设置干扰词集和初始敏感词列表。如果不提供参数，将使用默认干扰词集和空敏感词列表。
   * 初始化后可以通过相应的方法动态添加或管理敏感词。
   *
   * @param options - 初始化选项
   * @param options.wordList - 初始敏感词数组，可选
   * @param options.noiseWords - 自定义干扰词字符串，可选
   *
   * @example
   * ```typescript
   * // 使用默认配置初始化
   * sensitives.initialize();
   *
   * // 使用自定义敏感词列表初始化
   * sensitives.initialize({
   *   wordList: ['违禁品', '敏感词', 'badword']
   * });
   *
   * // 使用自定义干扰词和敏感词初始化
   * sensitives.initialize({
   *   wordList: ['违禁品'],
   *   noiseWords: '.,!?@#$%'
   * });
   * ```
   */
  public initialize(options: { wordList?: string[]; noiseWords?: string } = {}): any {
    const { wordList = [], noiseWords = '' } = options;

    noiseWords && this.setNoiseWords(noiseWords);
    this.addWords(wordList);
  }

  /**
   * 过滤掉字符串中的干扰字符
   *
   * 移除字符串中所有在干扰字符集中的字符，用于预处理敏感词或待检测文本。
   * 该方法在内部被广泛使用，确保敏感词匹配时忽略标点符号、空格等干扰字符。
   *
   * @param word - 待过滤的字符串
   * @returns 过滤后的字符串（移除了所有干扰字符）
   *
   * @example
   * ```typescript
   * // 过滤标点符号
   * sensitives.__filterNoiseChar('hello, world!'); // 'helloworld'
   *
   * // 过滤中英文标点和空格
   * sensitives.__filterNoiseChar('测试!@#内容'); // '测试内容'
   *
   * // 过滤多种干扰字符
   * sensitives.__filterNoiseChar('这@是#测$试%'); // '这是测试'
   * ```
   */
  private __filterNoiseChar(word: string): string {
    let ignoredWord = '';
    for (let i = 0, len = word.length; i < len; i++) {
      if (!this.__noiseWordMap[word.charCodeAt(i)]) {
        ignoredWord += word.charAt(i);
      }
    }
    return ignoredWord;
  }

  /**
   * 手动设置干扰词字符集
   *
   * 干扰词是指在敏感词匹配时需要忽略的字符，如标点符号、空格等。
   * 如果不设置，将使用内置的默认干扰词集，包含中英文标点、符号、表情等。
   *
   * @param noiseWords - 干扰词字符串，所有需要忽略的字符
   *
   * @example
   * ```typescript
   * // 设置只忽略基本标点符号和空格
   * sensitives.setNoiseWords(' ,.!?;:');
   *
   * // 设置只忽略中文标点
   * sensitives.setNoiseWords('。，、；：？！！');
   *
   * // 设置忽略特定符号
   * sensitives.setNoiseWords('@#$%^&*()');
   *
   * // 清空干扰词（不忽略任何字符）
   * sensitives.setNoiseWords('');
   * ```
   */
  public setNoiseWords(noiseWords: string): void {
    this.__noiseWordMap = generateNoiseWordMap(noiseWords);
  }

  /**
   * 清空所有敏感词
   *
   * 重置敏感词过滤器，删除所有已添加的敏感词。
   * 清空后过滤器不会匹配任何敏感词，但干扰词设置保持不变。
   *
   * @example
   * ```typescript
   * // 添加一些敏感词
   * sensitives.addWords(['word1', 'word2']);
   * console.log(sensitives.verify('word1')); // true
   *
   * // 清空所有敏感词
   * sensitives.clearWords();
   * console.log(sensitives.verify('word1')); // false
   * ```
   */
  public clearWords(): void {
    this.__map = {};
  }

  /**
   * 批量添加敏感词到过滤器
   *
   * 将敏感词数组中的每个词都添加到Trie树中，支持批量操作以提高性能。
   * 添加的敏感词会自动过滤干扰字符并转换为小写存储，确保匹配时的准确性。
   *
   * @param wordList - 敏感词数组，支持中英文敏感词
   *
   * @example
   * ```typescript
   * // 批量添加中文敏感词
   * sensitives.addWords(['违禁品', '敏感词', '不良信息']);
   *
   * // 批量添加英文敏感词
   * sensitives.addWords(['badword', 'illegal', 'prohibited']);
   *
   * // 混合添加
   * sensitives.addWords(['违禁品', 'badword', '敏感词']);
   *
   * // 包含干扰字符的敏感词会被自动过滤
   * sensitives.addWords(['违.禁.品', '敏!感词']); // 实际添加 '违禁品' 和 '敏感词'
   * ```
   */
  public addWords(wordList: string[]): void {
    for (let i = 0, len = wordList.length; i < len; i++) {
      let point = this.__map;
      // 对于配置的敏感词也过滤掉特殊符号
      const word = this.__filterNoiseChar(wordList[i]);
      for (let j = 0, wordLen = word.length; j < wordLen; j++) {
        const char = word.charAt(j).toLowerCase();
        const currentNode = (point[char] = (point[char] || {}) as IWordMap);
        if (j === wordLen - 1) {
          currentNode[WORD_END_TAG] = true;
        }
        point = currentNode;
      }
    }
  }

  /**
   * 添加单个敏感词到过滤器
   *
   * 将一个敏感词添加到Trie树中。敏感词会被自动过滤干扰字符并转换为小写存储。
   * 适用于需要动态添加单个敏感词的场景。
   *
   * @param word - 要添加的敏感词
   *
   * @example
   * ```typescript
   * // 添加单个中文敏感词
   * sensitives.addWord('违禁品');
   *
   * // 添加包含干扰字符的敏感词（会被自动过滤）
   * sensitives.addWord('敏!感词'); // 实际添加 '敏感词'
   *
   * // 添加英文敏感词（会被转为小写）
   * sensitives.addWord('BADWORD'); // 实际添加 'badword'
   *
   * // 添加混合敏感词
   * sensitives.addWord('Test违禁品'); // 实际添加 'test违禁品'
   * ```
   */
  public addWord(word: string): any {
    let point = this.__map;
    // 对于配置的敏感词也过滤掉特殊符号
    const wordNew = this.__filterNoiseChar(word);
    for (let j = 0, wordLen = wordNew.length; j < wordLen; j++) {
      const char = wordNew.charAt(j).toLowerCase();
      const currentNode = (point[char] = (point[char] || {}) as IWordMap);
      if (j === wordLen - 1) {
        currentNode[WORD_END_TAG] = true;
      }
      point = currentNode;
    }
  }

  /**
   * 在文本中匹配所有敏感词
   *
   * 扫描文本内容，找出其中包含的所有敏感词。返回去重后的敏感词列表，
   * 每个敏感词只返回一次，即使文本中多次出现该词。匹配时会自动忽略干扰字符。
   *
   * @param content - 待检测的文本内容
   * @returns 匹配到的敏感词数组（已去重和过滤干扰字符）
   *
   * @example
   * ```typescript
   * // 添加一些敏感词
   * sensitives.addWords(['违禁品', '敏感词', 'badword']);
   *
   * // 检测包含多个敏感词的文本
   * const matches = sensitives.match('这是一个包含违禁品和敏感词的测试文本');
   * console.log(matches); // ['违禁品', '敏感词']
   *
   * // 包含干扰字符的文本也会被正确匹配
   * const matches2 = sensitives.match('这个产品包含违.禁.品内容');
   * console.log(matches2); // ['违禁品']
   *
   * // 多次出现的敏感词只返回一次
   * const matches3 = sensitives.match('敏感词1 敏感词2 敏感词');
   * console.log(matches3); // ['敏感词']
   *
   * // 不包含敏感词的文本返回空数组
   * const matches4 = sensitives.match('这是正常的文本内容');
   * console.log(matches4); // []
   * ```
   */
  public match(content: string): string[] {
    const result = new Set<string>();
    let point = this.__map;
    const len = content.length;
    for (let left = 0; left < len; left++) {
      const code = content.charCodeAt(left);
      if (this.__noiseWordMap[code]) continue;

      for (let right = left; right < len; right++) {
        const code = content.charCodeAt(right);
        if (this.__noiseWordMap[code]) continue;

        const char = content.charAt(right);
        point = point[char.toLowerCase()] as IWordMap;

        if (!point) {
          point = this.__map;
          break;
        } else if (isWordEnd(point)) {
          const matchedWord = this.__filterNoiseChar(content.substring(left, right + 1));
          result.add(matchedWord);
        }
      }
    }
    return Array.from(result);
  }

  /**
   * 快速检测文本中是否包含敏感词
   *
   * 高效检测文本是否包含任何敏感词，一旦发现第一个敏感词就立即返回true，
   * 不需要获取所有匹配结果，性能优于match方法。适用于内容审核场景。
   *
   * @param content - 待检测的文本内容
   * @returns 是否包含敏感词
   *
   * @example
   * ```typescript
   * // 添加敏感词
   * sensitives.addWords(['违禁品', '敏感词', 'badword']);
   *
   * // 检测正常文本
   * const hasSensitive1 = sensitives.verify('这是正常文本'); // false
   *
   * // 检测包含敏感词的文本
   * const hasSensitive2 = sensitives.verify('这个包含违禁品'); // true
   *
   * // 检测包含干扰字符的敏感词
   * const hasSensitive3 = sensitives.verify('这里有敏!感词'); // true
   *
   * // 检测英文敏感词
   * const hasSensitive4 = sensitives.verify('This contains BADWORD'); // true
   *
   * // 用于内容审核
   * if (sensitives.verify(userInput)) {
   *   console.log('内容包含敏感词，请检查');
   *   // 拒绝提交或进行进一步处理
   * }
   * ```
   */
  public verify(content: string): boolean {
    let point = this.__map;
    const len = content.length;
    for (let left = 0; left < len; left++) {
      const code = content.charCodeAt(left);
      if (this.__noiseWordMap[code]) continue;

      for (let right = left; right < len; right++) {
        const code = content.charCodeAt(right);
        if (this.__noiseWordMap[code]) continue;

        const char = content.charAt(right);
        point = point[char.toLowerCase()] as IWordMap;

        if (!point) {
          point = this.__map;
          break;
        } else if (isWordEnd(point)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 对文本中的敏感词进行过滤替换
   *
   * 扫描文本并将所有敏感词替换为指定的字符（默认为'*'）。
   * 保持原文的格式和干扰字符不变，只替换敏感词部分，确保可读性。
   *
   * @param content - 待过滤的文本内容
   * @param filterChar - 用于替换敏感词的字符，默认为'*'
   * @returns 过滤后的文本内容
   *
   * @example
   * ```typescript
   * // 添加敏感词
   * sensitives.addWords(['违禁品', '敏感词', 'badword']);
   *
   * // 基本过滤（使用默认的'*'替换）
   * const filtered1 = sensitives.filter('这是包含违禁品的文本');
   * console.log(filtered1); // '这是包含***的文本'
   *
   * // 使用自定义替换字符
   * const filtered2 = sensitives.filter('这个敏感词会被过滤', '#');
   * console.log(filtered2); // '这个###会被过滤'
   *
   * // 保持原始格式和干扰字符
   * const filtered3 = sensitives.filter('这里有违.禁.品内容');
   * console.log(filtered3); // '这里有***内容'
   *
   * // 过滤多个敏感词
   * const filtered4 = sensitives.filter('违禁品和敏感词都是不允许的');
   * console.log(filtered4); // '***和###都是不允许的'
   *
   * // 过滤英文敏感词
   * const filtered5 = sensitives.filter('This text contains BADWORD content');
   * console.log(filtered5); // 'This text contains ******* content'
   *
   * // 不包含敏感词的文本保持不变
   * const filtered6 = sensitives.filter('这是正常的文本内容');
   * console.log(filtered6); // '这是正常的文本内容'
   * ```
   */
  public filter(content: string, filterChar: string = '*'): string {
    let filteredContent = '';
    let toReplaceCharLength = 0; // 接下来的多少个字符需要被替换
    let point = this.__map;
    const len = content.length;

    for (let left = 0; left < len; left++) {
      const code = content.charCodeAt(left);
      if (this.__noiseWordMap[code]) {
        filteredContent += content.charAt(left);
        toReplaceCharLength = Math.max(toReplaceCharLength - 1, 0);
        continue;
      }

      let isMatched = false;
      for (let right = left; right <= len; right++) {
        const code = content.charCodeAt(right);
        if (this.__noiseWordMap[code]) continue;

        const char = content.charAt(right);
        point = point[char.toLowerCase()] as IWordMap;

        if (point && isWordEnd(point)) {
          if (!isMatched) {
            filteredContent += filterChar;
          }
          toReplaceCharLength = Math.max(toReplaceCharLength - 1, right - left);
          isMatched = true;
        } else if (!point || right === len - 1) {
          if (!isMatched) {
            filteredContent += toReplaceCharLength > 0 ? filterChar : content.charAt(left);
            toReplaceCharLength = Math.max(toReplaceCharLength - 1, 0);
          }
          point = this.__map;
          break;
        }
      }
    }

    return filteredContent;
  }
}
