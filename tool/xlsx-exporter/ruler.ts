import { ConvertStringToNumber } from '../lib';

/** 规则接口（所有规则都必须实现此接口） */
export interface IRule<RET> {
  /** 规则标识 */
  readonly rule: string;
  /** 规则解析器 */
  parse: (text: string, params?: string) => RET;
  /** 规则类型转换器 */
  transform: (params?: string) => string;
}

/**
 * 布尔规则
 * @param text 文本
 * @example 0 => false
 * @example 1 => true
 * @returns
 */
class BooleanRule implements IRule<boolean> {
  readonly rule: string = 'B';
  parse(text: string, params?: string): boolean {
    return [1, '1', 'T', 'true', 'TRUE'].includes(text);
  }
  transform(params?: string) {
    return 'boolean';
  }
}

/**
 * 整数规则
 * @param text 文本
 * @example 100
 * @returns
 */
class IntegerRule implements IRule<number> {
  readonly rule: string = 'I';

  parse(text: string): number {
    text ??= '0';
    const ret = ConvertStringToNumber(text);
    return Math.floor(ret);
  }

  transform(params?: string): string {
    return 'number';
  }
}

/**
 * 数值规则
 * @param text 文本
 * @example 52.0
 * @returns
 */
class NumberRule implements IRule<number> {
  readonly rule: string = 'N';

  parse(text: string): number {
    text ??= '0';
    return ConvertStringToNumber(text);
  }

  transform(params?: string): string {
    return 'number';
  }
}

/**
 * 字符串规则
 * @param text 文本
 * @example hello, world
 * @returns
 */
class StringRule implements IRule<string> {
  readonly rule: string = 'S';

  parse(text: string): string {
    return text ?? '';
  }

  transform(params?: string): string {
    return 'string';
  }
}

/**
 * 选择器规则
 * @param text 文本
 * @param params 参数
 * @example 0|1|2
 * @example 未知|男|女
 * @returns
 */
class PickRule implements IRule<number> {
  readonly rule: string = 'P';

  parse(text: string, params?: string): number {
    const values: Record<string, number> = {};
    params!.split(',').forEach((v, i) => {
      values[v] = i;
    });
    if (text == undefined) {
      throw new Error(`[OP] "${text}" Not a valid option`);
    }
    let ret = values[text];
    if (ret === undefined) {
      throw new Error(`[OP] "${text}" Not a valid option`);
    }
    return ret;
  }

  transform(params?: string): string {
    return params!
      .split('#')[0]!
      .split(',')
      .map((v, i) => i)
      .join('|');
  }
}

/**
 * 数组规则
 * @param text 文本
 * @param params 参数
 * @returns
 */
class ListRule implements IRule<any[]> {
  readonly rule: string = 'L';

  parse(text: string, params?: string): any[] {
    const pk = params!.split('#')[0]!;
    return text.split(',').map((v) => Ruler.parse(pk, v));
  }

  transform(params?: string): string {
    const t = Ruler.transform(params!.split('#')![0]!);
    return `Array<${t}>`;
  }
}

/**
 * 布尔数组规则
 * @param text 文本
 * @returns
 */
class ListBooleanRule implements IRule<boolean[]> {
  readonly rule: string = 'LB';

  parse(text: string): boolean[] {
    return text.split(',').map((v) => Ruler.parse('B', v));
  }

  transform(params?: string): string {
    return 'Array<boolean>';
  }
}

/**
 * 整数数组规则
 * @param text 文本
 * @returns
 */
class ListIntegerRule implements IRule<number[]> {
  readonly rule: string = 'LI';

  parse(text: string): number[] {
    return text.split(',').map((v) => Ruler.parse('I', v));
  }

  transform(params?: string): string {
    return 'Array<number>';
  }
}

/**
 * 数值数组规则
 * @param text 文本
 * @returns
 */
class ListNumberRule implements IRule<number[]> {
  readonly rule: string = 'LN';

  parse(text: string): number[] {
    return text.split(',').map((v) => Ruler.parse('N', v));
  }

  transform(params?: string): string {
    return 'Array<number>';
  }
}

/**
 * 字符串数组规则
 * @param text 文本
 * @returns
 */
class ListStringRule implements IRule<string[]> {
  readonly rule: string = 'LS';

  parse(text: string): string[] {
    return text.split(',').map((v) => Ruler.parse('S', v));
  }

  transform(params?: string): string {
    return 'Array<string>';
  }
}

/**
 * 数组逐项规则
 * @param text 文本
 * @param params 参数
 */
class ListItemRule implements IRule<any[]> {
  readonly rule: string = 'LE';

  parse(text: string, params?: string): any[] {
    const ps = params!.split('#')[0]!.split(',');
    return text.split(',').map((v, i) => Ruler.parse(ps[i]!, v));
  }

  transform(params?: string): string {
    const ts = params!.split('#')[0]!.split(',');
    const tbl = [];
    for (let i = 0; i < ts.length; i++) {
      tbl.push(Ruler.transform(ts[i]!));
    }
    return `[${tbl.join(', ')}]`;
  }
}

/**
 * 映射表规则
 * @param text 文本
 * @param params 参数
 * @returns
 */
class MapRule implements IRule<Record<string, any>> {
  readonly rule: string = 'M';

  parse(text: string, params?: string): Record<string, any> {
    const ret: Record<string, any> = {};
    const pk = params!.split('#')[0];
    text.split(';').forEach((sub) => {
      const [k, v] = sub.split(',');
      const key = Ruler.parse('S', k!);
      const val = Ruler.parse(pk!, v!);
      ret[key] = val;
    });
    return ret;
  }

  transform(params?: string): string {
    const t = Ruler.transform(params!.split('#')[0]!);
    return `Record<string, ${t}>`;
  }
}

/**
 * 布尔映射规则
 * @param text 文本
 * @returns
 */
class MapBooleanRule implements IRule<Record<string, boolean>> {
  readonly rule: string = 'MB';

  parse(text: string): Record<string, boolean> {
    const ret: Record<string, boolean> = {};
    text.split(';').forEach((sub) => {
      const [k, v] = sub.split(',');
      const key = Ruler.parse('S', k!);
      const val = Ruler.parse('B', v!);
      ret[key] = val;
    });
    return ret;
  }

  transform(params?: string): string {
    return 'Record<string, boolean>';
  }
}

/**
 * 整数映射规则
 * @param text 文本
 * @returns
 */
class MapIntegerRule implements IRule<Record<string, number>> {
  readonly rule: string = 'MI';

  parse(text: string): Record<string, number> {
    const ret: Record<string, number> = {};
    text.split(';').forEach((sub) => {
      const [k, v] = sub.split(',');
      const key = Ruler.parse('S', k!);
      const val = Ruler.parse('I', v!);
      ret[key] = val;
    });
    return ret;
  }

  transform(params?: string): string {
    return 'Record<string, number>';
  }
}

/**
 * 数值映射规则
 * @param text 文本
 * @returns
 */
class MapNumberRule implements IRule<Record<string, number>> {
  readonly rule: string = 'MN';

  parse(text: string): Record<string, number> {
    const ret: Record<string, number> = {};
    text.split(';').forEach((sub) => {
      const [k, v] = sub.split(',');
      const key = Ruler.parse('S', k!);
      const val = Ruler.parse('N', v!);
      ret[key] = val;
    });
    return ret;
  }

  transform(params?: string): string {
    return 'Record<string, number>';
  }
}

/**
 * 字符串映射规则
 * @param text 文本
 * @returns
 */
class MapStringRule implements IRule<Record<string, string>> {
  readonly rule: string = 'MS';

  parse(text: string): Record<string, string> {
    const ret: Record<string, string> = {};
    text.split(';').forEach((sub) => {
      const [k, v] = sub.split(',');
      const key = Ruler.parse('S', k!);
      const val = Ruler.parse('S', v!);
      ret[key] = val;
    });
    return ret;
  }

  transform(params?: string): string {
    return 'Record<string, string>';
  }
}

/**
 * 统一类型映射表规则
 * @param text 文本
 * @param params 参数
 * @returns
 */
class MapAllRule implements IRule<Record<string, any>> {
  readonly rule: string = 'MA';

  parse(text: string, params?: string): Record<string, any> {
    const ret: Record<string, any> = {};
    const pks = params!.split('#')[0]!.split(',');
    const ps = pks[0];
    text.split(',').forEach((sub, i) => {
      const key = pks[i + 1];
      const val = Ruler.parse(ps!, sub);
      ret[key!] = val;
    });
    return ret;
  }

  transform(params?: string): string {
    const map = [];
    const ts = params!.split('#')[0]!.split(',');
    const t1 = Ruler.transform(ts[0]!);
    for (let i = 1; i < ts.length; i++) {
      const t2 = ts[i];
      map.push(`${t2}: ${t1}`);
    }
    return `{ ${map.join('; ')} }`;
  }
}

/**
 * 映射表逐项规则
 * @param text 文本
 * @param params 参数
 * @returns
 */
class MapItemRule implements IRule<Record<string, any>> {
  readonly rule: string = 'ME';

  parse(text: string, params?: string): Record<string, any> {
    const ps = params!.split('#')[0]!.split(';');
    const ret: Record<string, any> = {};
    text.split(',').forEach((sub, i) => {
      const [pk, pv] = ps[i]!.split(',');
      const val = Ruler.parse(pv!, sub);
      ret[pk!] = val;
    });
    return ret;
  }

  transform(params?: string): string {
    const map = [];
    const ts = params!.split('#')[0]!.split(';');
    for (let i = 0; i < ts.length; i++) {
      const [k, v] = ts[i]!.split(',');
      const t = Ruler.transform(v!);
      map.push(`${k}: ${t}`);
    }
    return `{ ${map.join('; ')} }`;
  }
}

/**
 * 规则解析器
 */
export class Ruler {
  private static _rules: Map<string, IRule<any>> = new Map();

  public static initialize() {
    this.register(new BooleanRule());
    this.register(new IntegerRule());
    this.register(new NumberRule());
    this.register(new StringRule());
    this.register(new PickRule());
    this.register(new ListRule());
    this.register(new ListItemRule());
    this.register(new ListBooleanRule());
    this.register(new ListIntegerRule());
    this.register(new ListNumberRule());
    this.register(new ListStringRule());
    this.register(new MapRule());
    this.register(new MapBooleanRule());
    this.register(new MapIntegerRule());
    this.register(new MapNumberRule());
    this.register(new MapStringRule());
    this.register(new MapAllRule());
    this.register(new MapItemRule());
  }

  /**
   * 注册规则
   * @param rule 规则
   * @param replace 是否替换原规则（默认否）
   */
  public static register<RET>(rule: IRule<RET>, replace: boolean = false) {
    if (replace || !this._rules.has(rule.rule)) {
      this._rules.set(rule.rule, rule);
    } else {
      throw new Error('规则已存在，如需替换，请将 replace 置为真：' + rule.rule);
    }
  }

  /**
   * 根据规则解析文本
   * @param rule 规则文本
   * @param text 待解析文本
   * @returns
   */
  public static parse(rule: string, text: string) {
    const [identifier, params] = rule.split('=');
    const ruler = this._rules.get(identifier!);
    if (ruler) {
      return ruler.parse(text, params);
    } else {
      throw new Error('未注册的规则解析器：' + rule);
    }
  }

  /**
   * 根据规则转换文本类型
   * @param rule 规则文本
   * @returns
   */
  public static transform(rule: string) {
    const [identifier, params] = rule.split('=');
    const ruler = this._rules.get(identifier!);
    if (ruler) {
      return ruler.transform(params);
    } else {
      throw new Error('未注册的规则转换器：' + rule);
    }
  }
}
