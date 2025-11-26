/**
 * 规则解析器测试文件
 * 测试所有规则的解析和类型转换功能
 */

import { Ruler } from './ruler';

// 初始化规则解析器
beforeAll(() => {
  Ruler.initialize();
});

describe('基础类型规则测试', () => {
  describe('BooleanRule (B)', () => {
    test('应该解析布尔值', () => {
      expect(Ruler.parse('B', '1')).toBe(true);
      expect(Ruler.parse('B', '0')).toBe(false);
      expect(Ruler.parse('B', 'true')).toBe(true);
      expect(Ruler.parse('B', 'TRUE')).toBe(true);
      expect(Ruler.parse('B', 'T')).toBe(true);
    });

    test('应该转换布尔值类型', () => {
      expect(Ruler.transform('B')).toBe('boolean');
    });

    test('应该处理非布尔值', () => {
      expect(Ruler.parse('B', '2')).toBe(false);
      expect(Ruler.parse('B', 'false')).toBe(false);
      expect(Ruler.parse('B', 'test')).toBe(false);
    });
  });

  describe('IntegerRule (I)', () => {
    test('应该解析整数', () => {
      expect(Ruler.parse('I', '100')).toBe(100);
      expect(Ruler.parse('I', '-50')).toBe(-50);
      expect(Ruler.parse('I', '0')).toBe(0);
      expect(Ruler.parse('I', '3.14')).toBe(3);
      expect(Ruler.parse('I', '5.9')).toBe(5);
    });

    test('应该处理空值', () => {
      expect(Ruler.parse('I', '')).toBe(0);
      expect(Ruler.parse('I', undefined as any)).toBe(0);
      expect(Ruler.parse('I', null as any)).toBe(0);
    });

    test('应该转换整数类型', () => {
      expect(Ruler.transform('I')).toBe('number');
    });
  });

  describe('NumberRule (N)', () => {
    test('应该解析数值', () => {
      expect(Ruler.parse('N', '100')).toBe(100);
      expect(Ruler.parse('N', '-50.5')).toBe(-50.5);
      expect(Ruler.parse('N', '3.14159')).toBe(3.14159);
      expect(Ruler.parse('N', '0')).toBe(0);
    });

    test('应该处理空值', () => {
      expect(Ruler.parse('N', '')).toBe(0);
      expect(Ruler.parse('N', undefined as any)).toBe(0);
      expect(Ruler.parse('N', null as any)).toBe(0);
    });

    test('应该转换数值类型', () => {
      expect(Ruler.transform('N')).toBe('number');
    });
  });

  describe('StringRule (S)', () => {
    test('应该解析字符串', () => {
      expect(Ruler.parse('S', 'hello world')).toBe('hello world');
      expect(Ruler.parse('S', '123')).toBe('123');
      expect(Ruler.parse('S', 'true')).toBe('true');
      expect(Ruler.parse('S', '')).toBe('');
    });

    test('应该处理空值', () => {
      expect(Ruler.parse('S', undefined as any)).toBe('');
      expect(Ruler.parse('S', null as any)).toBe('');
    });

    test('应该转换字符串类型', () => {
      expect(Ruler.transform('S')).toBe('string');
    });
  });

  describe('PickRule (P)', () => {
    test('应该解析选择器选项', () => {
      expect(Ruler.parse('P=未知,男,女', '未知')).toBe(0);
      expect(Ruler.parse('P=未知,男,女', '男')).toBe(1);
      expect(Ruler.parse('P=未知,男,女', '女')).toBe(2);
      expect(Ruler.parse('P=0,1,2', '0')).toBe(0);
      expect(Ruler.parse('P=0,1,2', '1')).toBe(1);
      expect(Ruler.parse('P=0,1,2', '2')).toBe(2);
    });

    test('应该转换选择器类型', () => {
      expect(Ruler.transform('P=未知,男,女')).toBe('0|1|2');
      expect(Ruler.transform('P=选项A,选项B,选项C')).toBe('0|1|2');
    });

    test('应该抛出无效选项错误', () => {
      expect(() => Ruler.parse('P=未知,男,女', '其他')).toThrow('[OP] "其他" Not a valid option');
      expect(() => Ruler.parse('P=0,1,2', '3')).toThrow('[OP] "3" Not a valid option');
    });
  });
});

describe('数组类型规则测试', () => {
  describe('ListRule (L)', () => {
    test('应该解析布尔数组', () => {
      const result = Ruler.parse('L=B', 'true,false,true,false');
      expect(result).toEqual([true, false, true, false]);
    });

    test('应该解析整数数组', () => {
      const result = Ruler.parse('L=I', '1,2,3,4,5');
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    test('应该解析字符串数组', () => {
      const result = Ruler.parse('L=S', 'hello,world,test');
      expect(result).toEqual(['hello', 'world', 'test']);
    });

    test('应该转换数组类型', () => {
      expect(Ruler.transform('L=B')).toBe('Array<boolean>');
      expect(Ruler.transform('L=I')).toBe('Array<number>');
      expect(Ruler.transform('L=S')).toBe('Array<string>');
    });

    test('应该处理空数组', () => {
      expect(Ruler.parse('L=S', '')).toEqual(['']);
    });
  });

  describe('ListBooleanRule (LB)', () => {
    test('应该解析布尔数组', () => {
      expect(Ruler.parse('LB', '1,0,true,false')).toEqual([true, false, true, false]);
      expect(Ruler.parse('LB', 'T,T,F')).toEqual([true, true, false]);
    });

    test('应该转换布尔数组类型', () => {
      expect(Ruler.transform('LB')).toBe('Array<boolean>');
    });
  });

  describe('ListIntegerRule (LI)', () => {
    test('应该解析整数数组', () => {
      expect(Ruler.parse('LI', '1,2,3,4,5')).toEqual([1, 2, 3, 4, 5]);
      expect(Ruler.parse('LI', '-1,0,1')).toEqual([-1, 0, 1]);
      expect(Ruler.parse('LI', '3.14,2.71')).toEqual([3, 2]);
    });

    test('应该转换整数数组类型', () => {
      expect(Ruler.transform('LI')).toBe('Array<number>');
    });
  });

  describe('ListNumberRule (LN)', () => {
    test('应该解析数值数组', () => {
      expect(Ruler.parse('LN', '1,2.5,3.14,4')).toEqual([1, 2.5, 3.14, 4]);
      expect(Ruler.parse('LN', '-1.5,0,1.5')).toEqual([-1.5, 0, 1.5]);
    });

    test('应该转换数值数组类型', () => {
      expect(Ruler.transform('LN')).toBe('Array<number>');
    });
  });

  describe('ListStringRule (LS)', () => {
    test('应该解析字符串数组', () => {
      expect(Ruler.parse('LS', 'hello,world,test')).toEqual(['hello', 'world', 'test']);
      expect(Ruler.parse('LS', '123,true,false')).toEqual(['123', 'true', 'false']);
    });

    test('应该转换字符串数组类型', () => {
      expect(Ruler.transform('LS')).toBe('Array<string>');
    });
  });

  describe('ListItemRule (LE)', () => {
    test('应该解析逐项类型数组', () => {
      const result = Ruler.parse('LE=I,S,B', '1,hello,true');
      expect(result).toEqual([1, 'hello', true]);
    });

    test('应该转换逐项类型', () => {
      expect(Ruler.transform('LE=I,S,B')).toBe('[number, string, boolean]');
    });
  });
});

describe('映射类型规则测试', () => {
  describe('MapRule (M)', () => {
    test('应该解析布尔映射', () => {
      const result = Ruler.parse('M=B', 'key1,1;key2,0;key3,T;key4,F');
      expect(result).toEqual({ key1: true, key2: false, key3: true, key4: false });
    });

    test('应该解析整数映射', () => {
      const result = Ruler.parse('M=I', 'age,25;score,100');
      expect(result).toEqual({ age: 25, score: 100 });
    });

    test('应该解析字符串映射', () => {
      const result = Ruler.parse('M=S', 'name,张三;city,北京');
      expect(result).toEqual({ name: '张三', city: '北京' });
    });

    test('应该转换映射类型', () => {
      expect(Ruler.transform('M=B')).toBe('Record<string, boolean>');
      expect(Ruler.transform('M=I')).toBe('Record<string, number>');
      expect(Ruler.transform('M=S')).toBe('Record<string, string>');
    });
  });

  describe('MapBooleanRule (MB)', () => {
    test('应该解析布尔映射', () => {
      const result = Ruler.parse('MB', 'key1,1;key2,0;key3,1;key4,F');
      expect(result).toEqual({ key1: true, key2: false, key3: true, key4: false });
    });

    test('应该转换布尔映射类型', () => {
      expect(Ruler.transform('MB')).toBe('Record<string, boolean>');
    });
  });

  describe('MapIntegerRule (MI)', () => {
    test('应该解析整数映射', () => {
      const result = Ruler.parse('MI', 'age,25;score,100;level,5');
      expect(result).toEqual({ age: 25, score: 100, level: 5 });
    });

    test('应该转换整数映射类型', () => {
      expect(Ruler.transform('MI')).toBe('Record<string, number>');
    });
  });

  describe('MapNumberRule (MN)', () => {
    test('应该解析数值映射', () => {
      const result = Ruler.parse('MN', 'price,19.99;weight,2.5;height,1.75');
      expect(result).toEqual({ price: 19.99, weight: 2.5, height: 1.75 });
    });

    test('应该转换数值映射类型', () => {
      expect(Ruler.transform('MN')).toBe('Record<string, number>');
    });
  });

  describe('MapStringRule (MS)', () => {
    test('应该解析字符串映射', () => {
      const result = Ruler.parse('MS', 'name,张三;city,北京;job,工程师');
      expect(result).toEqual({ name: '张三', city: '北京', job: '工程师' });
    });

    test('应该转换字符串映射类型', () => {
      expect(Ruler.transform('MS')).toBe('Record<string, string>');
    });
  });

  describe('MapAllRule (MA)', () => {
    test('应该解析统一类型映射', () => {
      const result = Ruler.parse('MA=I,name,age,score', '25,18,95');
      expect(result).toEqual({ name: 25, age: 18, score: 95 });
    });

    test('应该解析字符串映射', () => {
      const result = Ruler.parse('MA=S,name,city,job', '张三,北京,工程师');
      expect(result).toEqual({ name: '张三', city: '北京', job: '工程师' });
    });

    test('应该转换映射类型', () => {
      expect(Ruler.transform('MA=I,name,age,score')).toBe('{ name: number; age: number; score: number }');
      expect(Ruler.transform('MA=S,name,city,job')).toBe('{ name: string; city: string; job: string }');
    });
  });

  describe('MapItemRule (ME)', () => {
    test('应该解析逐项映射', () => {
      const result = Ruler.parse('ME=name,S;age,I;active,B', '张三,25,true');
      expect(result).toEqual({ name: '张三', age: 25, active: true });
    });

    test('应该解析复杂逐项映射', () => {
      const result = Ruler.parse('ME=name,S;score,N;married,B', '张三,95.5,false');
      expect(result).toEqual({ name: '张三', score: 95.5, married: false });
    });

    test('应该转换映射类型', () => {
      expect(Ruler.transform('ME=name,S;age,I;active,B')).toBe('{ name: string; age: number; active: boolean }');
    });
  });
});

describe('Ruler 类方法测试', () => {
  describe('parse 方法', () => {
    test('应该正确解析带参数的规则', () => {
      expect(Ruler.parse('P=选项A,选项B,选项C', '选项A')).toBe(0);
      expect(Ruler.parse('L=B', 'true,false')).toEqual([true, false]);
      expect(Ruler.parse('M=I', 'key,100')).toEqual({ key: 100 });
    });

    test('应该抛出未注册规则错误', () => {
      expect(() => Ruler.parse('X', 'test')).toThrow('未注册的规则解析器：X');
    });

    test('应该处理空字符串参数', () => {
      expect(Ruler.parse('B', '1')).toBe(true);
      expect(Ruler.parse('I', '123')).toBe(123);
    });
  });

  describe('transform 方法', () => {
    test('应该正确转换带参数的规则', () => {
      expect(Ruler.transform('P=选项A,选项B')).toBe('0|1');
      expect(Ruler.transform('L=B')).toBe('Array<boolean>');
      expect(Ruler.transform('M=I')).toBe('Record<string, number>');
    });

    test('应该抛出未注册规则错误', () => {
      expect(() => Ruler.transform('X')).toThrow('未注册的规则转换器：X');
    });
  });

  describe('register 方法', () => {
    test('应该注册新规则', () => {
      const customRule = {
        rule: 'CUSTOM',
        parse: (text: string) => text.toUpperCase(),
        transform: () => 'string',
      };

      Ruler.register(customRule);
      expect(Ruler.parse('CUSTOM', 'hello')).toBe('HELLO');
      expect(Ruler.transform('CUSTOM')).toBe('string');
    });

    test('应该拒绝重复注册规则', () => {
      const duplicateRule = {
        rule: 'B',
        parse: () => true,
        transform: () => 'boolean',
      };

      expect(() => Ruler.register(duplicateRule)).toThrow('规则已存在，如需替换，请将 replace 置为真：B');
    });

    test('应该支持替换规则', () => {
      const replacementRule = {
        rule: 'CUSTOM',
        parse: (text: string) => text.toLowerCase(),
        transform: () => 'custom',
      };

      expect(() => Ruler.register(replacementRule, true)).not.toThrow();
      expect(Ruler.parse('CUSTOM', 'HELLO')).toBe('hello');
      expect(Ruler.transform('CUSTOM')).toBe('custom');
    });
  });
});

describe('边界情况和错误处理测试', () => {
  describe('空值和null处理', () => {
    test('应该正确处理空字符串', () => {
      expect(Ruler.parse('S', '')).toBe('');
      expect(Ruler.parse('I', '')).toBe(0);
      expect(Ruler.parse('N', '')).toBe(0);
    });

    test('应该正确处理undefined和null', () => {
      expect(Ruler.parse('S', undefined as any)).toBe('');
      expect(Ruler.parse('S', null as any)).toBe('');
      expect(Ruler.parse('I', undefined as any)).toBe(0);
      expect(Ruler.parse('N', null as any)).toBe(0);
    });
  });

  describe('特殊字符处理', () => {
    test('应该处理包含分隔符的字符串', () => {
      const result = Ruler.parse('LS', 'hello,world;test,data');
      expect(result).toEqual(['hello', 'world;test', 'data']);
    });

    test('应该处理包含空格的字符串', () => {
      const result = Ruler.parse('MS', 'name,张三;city,北京 上海;job,软件工程师');
      expect(result).toEqual({
        name: '张三',
        city: '北京 上海',
        job: '软件工程师',
      });
    });
  });

  describe('类型转换验证', () => {
    test('应该返回正确的类型字符串', () => {
      expect(Ruler.transform('B')).toBe('boolean');
      expect(Ruler.transform('I')).toBe('number');
      expect(Ruler.transform('N')).toBe('number');
      expect(Ruler.transform('S')).toBe('string');
      expect(Ruler.transform('LB')).toBe('Array<boolean>');
      expect(Ruler.transform('LS')).toBe('Array<string>');
      expect(Ruler.transform('MB')).toBe('Record<string, boolean>');
      expect(Ruler.transform('MS')).toBe('Record<string, string>');
    });
  });
});

describe('嵌套类型规则测试', () => {
  describe('JsonRule (JSON)', () => {
    test('应该解析JSON格式的嵌套数据', () => {
      const schema = JSON.stringify({
        users: [{ name: 'string', age: 'number' }],
        active: 'boolean',
      });
      const data = JSON.stringify({
        users: [
          { name: '张三', age: 25 },
          { name: '李四', age: 30 },
        ],
        active: true,
      });

      const result = Ruler.parse(`JSON=${schema}`, data);
      expect(result).toEqual({
        users: [
          { name: '张三', age: 25 },
          { name: '李四', age: 30 },
        ],
        active: true,
      });
    });

    test('应该转换JSON类型', () => {
      const schema = JSON.stringify({
        users: [{ name: 'string', age: 'number' }],
        active: 'boolean',
      });

      const result = Ruler.transform(`JSON=${schema}`);
      expect(result).toBe('{ users: Array<{ name: string; age: number }>; active: boolean }');
    });

    test('应该处理多层嵌套', () => {
      const schema = JSON.stringify({
        company: {
          name: 'string',
          employees: [{ name: 'string', department: { id: 'number', name: 'string' } }],
        },
      });

      const data = JSON.stringify({
        company: {
          name: 'TechCorp',
          employees: [{ name: '张三', department: { id: 1, name: '开发部' } }],
        },
      });

      const result = Ruler.parse(`JSON=${schema}`, data);
      expect(result.company.name).toBe('TechCorp');
      expect(result.company.employees[0].department.name).toBe('开发部');
    });
  });

  describe('ObjectRule (OBJ)', () => {
    test('应该解析对象类型定义', () => {
      const data = JSON.stringify({
        name: '张三',
        scores: [95, 87, 92],
        config: { x: 100, y: 200 },
      });

      const result = Ruler.parse('OBJ={name:string,scores:number[],config:{x:number,y:number}}', data);
      expect(result).toEqual({
        name: '张三',
        scores: [95, 87, 92],
        config: { x: 100, y: 200 },
      });
    });

    test('应该转换对象类型', () => {
      const result = Ruler.transform('OBJ={name:string,scores:number[],config:{x:number,y:number}}');
      expect(result).toBe('{ name: string; scores: Array<number>; config: { x: number; y: number } }');
    });

    test('应该处理复杂的嵌套对象', () => {
      const data = JSON.stringify({
        user: {
          profile: {
            name: '张三',
            contacts: [
              { type: 'email', value: 'zhangsan@example.com' },
              { type: 'phone', value: '13800138000' },
            ],
          },
          active: true,
        },
      });

      const result = Ruler.parse(
        'OBJ={user:{profile:{name:string,contacts:[{type:string,value:string}]},active:boolean}}',
        data
      );
      expect(result.user.profile.contacts[0].value).toBe('zhangsan@example.com');
      expect(result.user.active).toBe(true);
    });
  });

  describe('EnhancedArrayRule (ARRAY)', () => {
    test('应该解析增强数组类型', () => {
      const data = JSON.stringify([
        { name: '张三', age: 25 },
        { name: '李四', age: 30 },
      ]);

      const result = Ruler.parse('ARRAY=[{name:string,age:number}]', data);
      expect(result).toEqual([
        { name: '张三', age: 25 },
        { name: '李四', age: 30 },
      ]);
    });

    test('应该转换增强数组类型', () => {
      const result = Ruler.transform('ARRAY=[{name:string,age:number}]');
      expect(result).toBe('Array<{ name: string; age: number }>');
    });

    test('应该处理嵌套数组', () => {
      const data = JSON.stringify([
        [
          { id: 1, name: '任务1' },
          { id: 2, name: '任务2' },
        ],
        [{ id: 3, name: '任务3' }],
      ]);

      const result = Ruler.parse('ARRAY=[[{id:number,name:string}]]', data);
      expect(result[0][0].name).toBe('任务1');
      expect(result[1][0].id).toBe(3);
    });
  });

  describe('EnhancedMapRule (MAP)', () => {
    test('应该解析增强映射类型', () => {
      const data = JSON.stringify({
        user: { name: '张三', age: 25 },
        config: { theme: 'dark', language: 'zh' },
      });

      const result = Ruler.parse('MAP={user:{name:string,age:number},config:{theme:string,language:string}}', data);
      expect(result).toEqual({
        user: { name: '张三', age: 25 },
        config: { theme: 'dark', language: 'zh' },
      });
    });

    test('应该转换增强映射类型', () => {
      const result = Ruler.transform('MAP={user:{name:string,age:number},config:{theme:string}}');
      expect(result).toBe('{ user: { name: string; age: number }; config: { theme: string } }');
    });

    test('应该处理复杂映射值', () => {
      const data = JSON.stringify({
        departments: [
          { id: 1, name: '开发部', employees: [{ name: '张三' }, { name: '李四' }] },
          { id: 2, name: '产品部', employees: [{ name: '王五' }] },
        ],
        metadata: { version: '1.0', created: '2023-01-01' },
      });

      const result = Ruler.parse(
        'MAP={departments:[{id:number,name:string,employees:[{name:string}]}],metadata:{version:string,created:string}}',
        data
      );
      expect(result.departments[0].employees[0].name).toBe('张三');
      expect(result.metadata.version).toBe('1.0');
    });
  });
});

describe('性能测试', () => {
  test('应该处理大量数据', () => {
    // 生成大量测试数据
    const largeArray = Array.from({ length: 1000 }, (_, i) => i.toString()).join(',');
    const startTime = Date.now();

    const result = Ruler.parse('LI', largeArray);
    const endTime = Date.now();

    expect(result).toHaveLength(1000);
    expect(result[0]).toBe(0);
    expect(result[999]).toBe(999);
    expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
  });

  test('应该处理复杂的映射数据', () => {
    const largeMap = Array.from({ length: 100 }, (_, i) => `key${i},value${i}`).join(';');
    const startTime = Date.now();

    const result = Ruler.parse('MS', largeMap);
    const endTime = Date.now();

    expect(Object.keys(result)).toHaveLength(100);
    expect(result.key0).toBe('value0');
    expect(result.key99).toBe('value99');
    expect(endTime - startTime).toBeLessThan(50); // 应该在50ms内完成
  });

  test('嵌套规则性能测试', () => {
    const largeNestedData = JSON.stringify(
      Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `用户${i}`,
        profile: {
          age: 20 + (i % 50),
          active: i % 2 === 0,
        },
        tags: [`tag${i % 10}`, `type${i % 5}`],
      }))
    );

    const startTime = Date.now();
    const result = Ruler.parse(
      'ARRAY=[{id:number,name:string,profile:{age:number,active:boolean},tags:string[]}]',
      largeNestedData
    );
    const endTime = Date.now();

    expect(result).toHaveLength(100);
    expect(result[0].profile.active).toBe(true);
    expect(result[99].tags).toContain('tag9');
    expect(endTime - startTime).toBeLessThan(200); // 应该在200ms内完成
  });
});
