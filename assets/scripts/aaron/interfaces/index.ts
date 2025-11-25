/**
 * interfaces
 * @description interfaces 为框架提供了一系列接口，包括但不限于各类服务。
 * - 根据分工设计，interfaces 负责提供接口，services 负责具体的实现，因此开发者可以根据需要替换内置的服务。
 * - 出于服务其他层的目的，interfaces 需严格遵守开闭原则，因此规定 interfaces 只能引用 types 或自身。
 */
export * from './services';
export * from './IAutoAtlas';
export * from './IDeepProxy';
export * from './ILaunchOptions';
export * from './IModel';
export * from './IStateMachine';
export * from './IService';
export * from './ITrigger';
