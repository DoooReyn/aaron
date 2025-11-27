import { Service } from '../core';
import { ILogger, IQuery, ITableEntry, ITableQuery, Table } from '../interfaces';
import { SERVICES } from '../macro';
import { Key } from '../types';
import { dict, lzj } from '../utils';

/**
 * 配置表数据注册与查询服务
 * @example
 * ```typescript
 * const tableQuery = aaron.tableQuery;
 * tableQuery.register({ token: 'table1', header: ['id', 'name']);
 * await tableQuery.parse('table1', xxx);
 * // fetch one record
 * tableQuery.one('table1', 1); // { id: 1, name: 'a' }
 * // fetch field's value
 * tableQuery.field('table1', 1, 'name'); // 'a'
 * // fetch fields's value dictionary
 * tableQuery.fields('table1', 1, ['id', 'name']); // [1, 'a']
 * // search records with fields
 * tableQuery.query('table1', { fields: { id: 1 }, matchType: 'every', amountType: 'one' }); // [{ id: 1, name: 'a' }]
 * // search records with filter
 * tableQuery.query('table1', { filter: (id, data) => data.name === 'a' }); // [{ id: 1, name: 'a' }]
 * ```
 */
export class TableQuery extends Service implements ITableQuery {
  /** 配置表容器 */
  private _tables: Map<string, Table<unknown, unknown>> = new Map();
  /** 配置表查询缓存 */
  private _caches: Map<string, any> = new Map();

  /**
   * 是否匹配字段
   * @param record 表格条目
   * @param query 查询条件
   * @returns
   */
  private matchFields<T extends ITableEntry>(record: T, query: IQuery<T>) {
    if (query.matchType == 'every') {
      return Object.entries(query.fields).every(([key, value]) => record[key] === value);
    } else {
      return Object.entries(query.fields).some(([key, value]) => record[key] === value);
    }
  }

  register<R, I>(table: Table<R, I>) {
    if (!this._tables.has(table.token)) {
      this._tables.set(table.token, table);
    }
  }

  registerBatch(...tables: Table<unknown, unknown>[]) {
    tables.forEach((t) => this.register(t));
  }

  has(token: string) {
    return this._tables.has(token);
  }

  async parse<R = [], I = object>(token: string, input: string | Uint8Array) {
    return new Promise<Table<R, I>>((resolve, reject) => {
      if (!this._tables.has(token)) {
        reject(`配置表: ${token} 未注册`);
      }

      const table = this._tables.get(token)!;
      const listings = typeof input === 'string' ? lzj.decode<R[][]>(input) : lzj.decodeU8<R[][]>(input);
      const mappings = {};
      listings.forEach((record) => {
        const item = {};
        record.forEach((field, index) => (item[table.header[index]] = field));
        mappings[item['id']] = item as I;
      });
      table.listings = listings;
      table.mappings = mappings;
      this.resolve<ILogger>(SERVICES.LOGGER).d(`配置表：${token} 解析完成`);

      resolve(table as Table<R, I>);
    });
  }

  one<T extends ITableEntry>(token: string, id: string | number): T | undefined {
    if (!this._tables.has(token)) {
      this.resolve<ILogger>(SERVICES.LOGGER).ef('配置表: {0} 未注册', token);
      return undefined;
    }

    const cacheKey = `${token}-record-${id}`;
    if (this._caches.has(cacheKey)) {
      return this._caches.get(cacheKey) as T;
    }

    const table = this._tables.get(token)!;
    if (table.mappings == undefined) {
      this.resolve<ILogger>(SERVICES.LOGGER).ef('配置表: {0} 无数据', token);
      return undefined;
    }

    const result = table.mappings[id] as T | undefined;
    if (result) {
      this._caches.set(cacheKey, result);
    }

    return result;
  }

  field<T extends ITableEntry, K extends keyof T = keyof T>(
    token: string,
    id: string | number,
    key: K
  ): T[K] | undefined {
    const entry = this.one<T>(token, id);
    if (!entry) {
      return undefined;
    }
    return entry[key];
  }

  fields<T extends ITableEntry, K extends keyof T = keyof T>(
    token: string,
    id: string | number,
    keys: K[]
  ): Pick<T, K> | undefined {
    const entry = this.one<T>(token, id);

    if (!entry) {
      return undefined;
    }

    return dict.pick(entry, keys as unknown as Key[]) as Pick<T, K>;
  }

  query<T extends ITableEntry>(token: string, query: IQuery<T>): T[] {
    if (!this._tables.has(token)) {
      this.resolve<ILogger>(SERVICES.LOGGER).ef('配置表: {0} 未注册', token);
      return [];
    }

    query.matchType ??= 'every';
    query.amountType ??= 'one';
    const fetchOne = query.amountType === 'one';
    const cacheKey = `${token}-${JSON.stringify(query)}`;
    if (this._caches.has(cacheKey)) {
      return this._caches.get(cacheKey) as T[];
    }

    const table = this._tables.get(token)!;
    if (table.mappings == undefined) {
      this.resolve<ILogger>(SERVICES.LOGGER).ef('配置表: {0} 无数据', token);
      return [];
    }

    const result = [];

    if (query.fields) {
      if (query.fields.id != undefined) {
        const record = table.mappings[query.fields.id];
        if (record) {
          if (this.matchFields(record as ITableEntry, query)) {
            result.push(this.one(token, query.fields.id));
          }
        }
      } else {
        for (const id in table.mappings) {
          const record = table.mappings[+id];
          const matched = this.matchFields(record as ITableEntry, query);
          if (matched) {
            result.push(this.one(token, id));
            if (fetchOne) break;
          }
        }
      }
    } else if (query.filter) {
      for (const id in table.mappings) {
        const record = table.mappings[id];
        const matched = query.filter(+id, record as ITableEntry);
        if (matched) {
          result.push(this.one(token, id));
          if (fetchOne) break;
        }
      }
    }

    if (query.cache && query.filter == undefined) {
      // 使用过滤器时不启用缓存，因为过滤器无法序列化
      this._caches.set(cacheKey, result);
    }

    return result as T[];
  }

  invalidateCache(cacheKey?: string) {
    if (cacheKey) {
      this._caches.delete(cacheKey);
    } else {
      this._caches.clear();
    }
  }
}
