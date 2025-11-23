/**
 * macro
 * @description macro 为框架提供了一系列内置的常量。
 * - 开发者可以修改常量值以适配项目需求。
 * - 出于服务其他层的目的，macro 需严格遵守开闭原则，因此规定 macro 只能引用 interfaces，types。
 */

export * from './LaunchOptions';
export * from './Preset';
export * from './Events';
export * from './Services';
