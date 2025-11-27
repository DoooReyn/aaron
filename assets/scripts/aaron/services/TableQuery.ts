import { Service } from '../core';
import { ILogger, ITableQuery, Table } from '../interfaces';
import { SERVICES } from '../macro';
import { dict, list, lzj } from '../utils';

/**
 * 配置表数据注册与查询服务
 */
export class TableQuery extends Service implements ITableQuery {
  private _tables: Map<string, Table<unknown, unknown>> = new Map();

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
}
