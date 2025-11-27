import { ConvertStringToNumber } from '../lib';

/**
 * 将字符串转换为数字
 * @param text 待转换的字符串
 * @returns 数字
 */
function ConvertStringToNumberImpl(text: string): number {
  if (text === '') return 0;
  const num = parseFloat(text);
  return isNaN(num) ? 0 : num;
}

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
 * JSON风格复杂类型规则
 * 支持类似JSON语法定义复杂嵌套结构
 * @example JSON={"users": [{"name": "string", "age": "number"}], "active": "boolean"}
 */
class JsonRule implements IRule<any> {
  readonly rule: string = 'JSON';

  parse(text: string, params?: string): any {
    try {
      // 解析JSON格式的数据结构
      const schema = JSON.parse(params!);
      const data = JSON.parse(text);

      return this.parseBySchema(data, schema);
    } catch (error) {
      throw new Error(`JSON解析失败: ${error}`);
    }
  }

  transform(params?: string): string {
    try {
      const schema = JSON.parse(params!);
      return this.transformSchema(schema);
    } catch (error) {
      return 'any';
    }
  }

  private parseBySchema(data: any, schema: any): any {
    if (Array.isArray(schema)) {
      if (schema.length === 0) return [];
      const itemSchema = schema[0];
      return Array.isArray(data) ? data.map(item => this.parseBySchema(item, itemSchema)) : [];
    } else if (typeof schema === 'object' && schema !== null) {
      const result: any = {};
      for (const [key, type] of Object.entries(schema)) {
        if (typeof data === 'object' && data !== null && key in data) {
          result[key] = this.parseByValue(data[key], type as string);
        }
      }
      return result;
    } else {
      return data;
    }
  }

  private parseByValue(value: any, type: string): any {
    // 基础类型转换
    switch (type) {
      case 'boolean': return Ruler.parse('B', String(value));
      case 'number': return Ruler.parse('N', String(value));
      case 'integer': return Ruler.parse('I', String(value));
      case 'string': return Ruler.parse('S', String(value));
      default:
        // 假设是复杂类型，尝试递归处理
        try {
          return JSON.parse(String(value));
        } catch {
          return value;
        }
    }
  }

  private transformSchema(schema: any): string {
    if (Array.isArray(schema)) {
      if (schema.length === 0) return 'Array<any>';
      const itemType = this.transformSchema(schema[0]);
      return `Array<${itemType}>`;
    } else if (typeof schema === 'object' && schema !== null) {
      const fields = Object.entries(schema).map(([key, type]) => {
        const typeStr = this.transformSchema(type as any);
        return `${key}: ${typeStr}`;
      });
      return `{ ${fields.join('; ')} }`;
    } else {
      return String(schema);
    }
  }
}

/**
 * 对象类型规则
 * 支持类似TypeScript接口语法定义对象结构
 * @example OBJ={name:string,scores:number[],config:{x:number,y:number}}
 */
class ObjectRule implements IRule<any> {
  readonly rule: string = 'OBJ';

  parse(text: string, params?: string): any {
    try {
      const data = JSON.parse(text);
      const typeDef = params!.slice(params!.indexOf('{') + 1, params!.lastIndexOf('}'));
      return this.parseObject(data, typeDef);
    } catch (error) {
      throw new Error(`对象解析失败: ${error}`);
    }
  }

  transform(params?: string): string {
    try {
      const typeDef = params!.slice(params!.indexOf('{') + 1, params!.lastIndexOf('}'));
      return this.transformObject(typeDef);
    } catch (error) {
      return 'Record<string, any>';
    }
  }

  private parseObject(data: any, typeDef: string): any {
    const result: any = {};
    const fields = this.parseFieldDefinitions(typeDef);

    for (const field of fields) {
      if (field.name in data) {
        result[field.name] = this.parseFieldValue(data[field.name], field.type);
      }
    }
    return result;
  }

  private parseFieldDefinitions(typeDef: string): Array<{name: string, type: string}> {
    const fields: Array<{name: string, type: string}> = [];
    let currentField = '';
    let braceCount = 0;
    let bracketCount = 0;

    for (let i = 0; i < typeDef.length; i++) {
      const char = typeDef[i];

      if (char === '{') {
        braceCount++;
        currentField += char;
      } else if (char === '}') {
        braceCount--;
        currentField += char;
      } else if (char === '[') {
        bracketCount++;
        currentField += char;
      } else if (char === ']') {
        bracketCount--;
        currentField += char;
      } else if (char === ':' && braceCount === 0 && bracketCount === 0) {
        currentField += char;
      } else if (char === ',' && braceCount === 0 && bracketCount === 0) {
        if (currentField.trim()) {
          const field = this.parseField(currentField.trim());
          if (field) {
            fields.push(field);
          }
        }
        currentField = '';
      } else {
        currentField += char;
      }
    }

    if (currentField.trim()) {
      const field = this.parseField(currentField.trim());
      if (field) {
        fields.push(field);
      }
    }

    return fields;
  }

  private parseField(fieldDef: string): {name: string, type: string} | null {
    const colonIndex = fieldDef.indexOf(':');
    if (colonIndex === -1) return null;

    const name = fieldDef.slice(0, colonIndex).trim();
    const type = fieldDef.slice(colonIndex + 1).trim();

    if (!name || !type) return null;

    return { name, type };
  }

  private parseFieldValue(value: any, type: string): any {
    // 处理数组类型: Array<T> 或 T[]
    if (type === 'number[]' || type === 'Array<number>') {
      return Array.isArray(value) ? value.map(v => this.parseFieldValue(v, 'number')) : [];
    } else if (type === 'string[]' || type === 'Array<string>') {
      return Array.isArray(value) ? value.map(v => this.parseFieldValue(v, 'string')) : [];
    } else if (type === 'boolean[]' || type === 'Array<boolean>') {
      return Array.isArray(value) ? value.map(v => this.parseFieldValue(v, 'boolean')) : [];
    } else if (type.startsWith('Array<')) {
      const innerType = type.slice(type.indexOf('<') + 1, type.lastIndexOf('>'));
      return Array.isArray(value) ? value.map(v => this.parseFieldValue(v, innerType)) : [];
    } else if (type.startsWith('[') && type.endsWith(']')) {
      const innerType = type.slice(1, -1);
      return Array.isArray(value) ? value.map(v => this.parseFieldValue(v, innerType)) : [];
    } else if (type.startsWith('{')) {
      // 嵌套对象需要递归解析
      return this.parseObject(value, type.slice(1, -1));
    } else {
      switch (type) {
        case 'boolean': return Ruler.parse('B', String(value));
        case 'number': return Ruler.parse('N', String(value));
        case 'integer': return Ruler.parse('I', String(value));
        case 'string': return Ruler.parse('S', String(value));
        default: return value;
      }
    }
  }

  private transformObject(typeDef: string): string {
    const fields = this.parseFieldDefinitions(typeDef);
    const fieldStrings = fields.map(field => {
      const typeStr = this.transformFieldType(field.type);
      return `${field.name}: ${typeStr}`;
    });
    return `{ ${fieldStrings.join('; ')} }`;
  }

  private transformFieldType(type: string): string {
    // 处理数组类型
    if (type === 'number[]' || type === 'Array<number>') {
      return 'Array<number>';
    } else if (type === 'string[]' || type === 'Array<string>') {
      return 'Array<string>';
    } else if (type === 'boolean[]' || type === 'Array<boolean>') {
      return 'Array<boolean>';
    } else if (type.startsWith('Array<')) {
      const innerType = type.slice(type.indexOf('<') + 1, type.lastIndexOf('>'));
      return `Array<${this.transformFieldType(innerType)}>`;
    } else if (type.startsWith('[') && type.endsWith(']')) {
      const innerType = type.slice(1, -1);
      return `Array<${this.transformFieldType(innerType)}>`;
    } else if (type.startsWith('{')) {
      return this.transformObject(type.slice(1, -1));
    } else {
      return type;
    }
  }
}

/**
 * 增强数组规则
 * 支持指定数组元素类型的复杂结构
 * @example ARRAY=[{name:string,age:number}]
 */
class EnhancedArrayRule implements IRule<any[]> {
  readonly rule: string = 'ARRAY';

  parse(text: string, params?: string): any[] {
    try {
      const data = JSON.parse(text);
      const elementType = params!.slice(params!.indexOf('[') + 1, params!.lastIndexOf(']'));

      if (!Array.isArray(data)) {
        throw new Error('输入数据必须是数组');
      }

      return data.map(item => this.parseElement(item, elementType));
    } catch (error) {
      throw new Error(`增强数组解析失败: ${error}`);
    }
  }

  transform(params?: string): string {
    try {
      const elementType = params!.slice(params!.indexOf('[') + 1, params!.lastIndexOf(']'));
      const transformedType = this.transformElementType(elementType);
      return `Array<${transformedType}>`;
    } catch (error) {
      return 'Array<any>';
    }
  }

  private parseElement(item: any, type: string): any {
    if (type.startsWith('{')) {
      const objectRule = new ObjectRule();
      return objectRule.parse(JSON.stringify(item), type);
    } else if (type.startsWith('[')) {
      const innerType = type.slice(1, -1);
      return Array.isArray(item) ? item.map(sub => this.parseElement(sub, innerType)) : [];
    } else {
      switch (type) {
        case 'boolean': return Ruler.parse('B', String(item));
        case 'number': return Ruler.parse('N', String(item));
        case 'integer': return Ruler.parse('I', String(item));
        case 'string': return Ruler.parse('S', String(item));
        default: return item;
      }
    }
  }

  private transformElementType(type: string): string {
    if (type.startsWith('{')) {
      const objectRule = new ObjectRule();
      return objectRule.transform(type);
    } else if (type.startsWith('[')) {
      const innerType = type.slice(1, -1);
      return `[${this.transformElementType(innerType)}]`;
    } else {
      return type;
    }
  }
}

/**
 * 增强映射规则
 * 支持指定键值类型的复杂映射结构
 * @example MAP={user:{name:string},items:[{id:number}]}
 */
class EnhancedMapRule implements IRule<Record<string, any>> {
  readonly rule: string = 'MAP';

  parse(text: string, params?: string): Record<string, any> {
    try {
      const data = JSON.parse(text);
      const valueType = params!.slice(params!.indexOf('{') + 1, params!.lastIndexOf('}'));

      // 解析复杂类型定义，如 {user:{name:string,age:number},config:{theme:string}}
      const typeDefinition = this.parseTypeDefinition(valueType);

      const result: Record<string, any> = {};

      for (const [key, value] of Object.entries(data)) {
        // 根据具体的字段类型进行解析
        if (typeDefinition[key]) {
          result[key] = this.parseValue(value, typeDefinition[key]);
        } else {
          result[key] = value;
        }
      }

      return result;
    } catch (error) {
      throw new Error(`增强映射解析失败: ${error}`);
    }
  }

  transform(params?: string): string {
    try {
      const valueType = params!.slice(params!.indexOf('{') + 1, params!.lastIndexOf('}'));
      const typeDefinition = this.parseTypeDefinition(valueType);

      const fieldTypes = Object.entries(typeDefinition).map(([key, type]) => {
        const transformedType = this.transformValueType(type);
        return `${key}: ${transformedType}`;
      });

      return `{ ${fieldTypes.join('; ')} }`;
    } catch (error) {
      return 'Record<string, any>';
    }
  }

  private parseTypeDefinition(typeDef: string): Record<string, string> {
    const fields: Record<string, string> = {};
    let depth = 0;
    let currentField = '';
    let currentKey = '';

    for (let i = 0; i < typeDef.length; i++) {
      const char = typeDef[i];

      if (char === '{' || char === '[') {
        depth++;
        currentField += char;
      } else if (char === '}' || char === ']') {
        depth--;
        currentField += char;
      } else if (char === ':' && depth === 0) {
        currentKey = currentField.trim();
        currentField = '';
      } else if (char === ',' && depth === 0) {
        if (currentKey && currentField.trim()) {
          fields[currentKey] = currentField.trim();
        }
        currentKey = '';
        currentField = '';
      } else {
        currentField += char;
      }
    }

    // 处理最后一个字段
    if (currentKey && currentField.trim()) {
      fields[currentKey] = currentField.trim();
    }

    return fields;
  }

  private parseValue(value: any, type: string): any {
    if (type.startsWith('{')) {
      const objectRule = new ObjectRule();
      return objectRule.parse(JSON.stringify(value), type);
    } else if (type.startsWith('[')) {
      const innerType = type.slice(1, -1);
      return Array.isArray(value) ? value.map(sub => this.parseValue(sub, innerType)) : [];
    } else {
      switch (type) {
        case 'boolean': return Ruler.parse('B', String(value));
        case 'number': return Ruler.parse('N', String(value));
        case 'integer': return Ruler.parse('I', String(value));
        case 'string': return Ruler.parse('S', String(value));
        default: return value;
      }
    }
  }

  private transformValueType(type: string): string {
    if (type.startsWith('{')) {
      const objectRule = new ObjectRule();
      return objectRule.transform(type);
    } else if (type.startsWith('[')) {
      const innerType = type.slice(1, -1);
      return `[${this.transformValueType(innerType)}]`;
    } else {
      return type;
    }
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

    // 新增嵌套支持规则
    this.register(new JsonRule());
    this.register(new ObjectRule());
    this.register(new EnhancedArrayRule());
    this.register(new EnhancedMapRule());
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
   * 规则是否已注册
   * @param rule 规则
   * @returns 规则是否已注册
   */
  public static has(rule: string) {
    return this._rules.has(rule);
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
