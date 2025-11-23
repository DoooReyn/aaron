/**
 * utils
 * @description utils 与 foundation 类似，都为框架提供了一系列基础能力的封装。
 * - 与 foundation 不同的是，utils 的能力体现为高内聚的一系列方法，由此对外暴露为一个针对特定领域的模块。
 * - 出于服务其他层的目的，utils 需严格遵守开闭原则，因此规定 utils 只能引用 interfaces，types，或第三方库。
 */
export * as literal from './Literal';
export * as list from './List';
export * as time from './Time';
export * as dict from './Dict';
export * as json from './Json';
export * as zson from './Zipson';
export * as lzstring from './LZstring';
export * as might from './Might';
