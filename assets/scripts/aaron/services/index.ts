/**
 * services
 * @description services 为框架提供了一系列强大的内置服务。
 * - 根据分工设计，interfaces 负责提供服务接口，services 负责具体服务的实现，因此开发者可以根据需要替换内置的服务。
 * - 根据框架设计，services 需严格遵守开闭原则，规定 services 只对 Init 开放，对其他层完全封闭。
 */
export * from "./AscendingId";
export * from "./Logger";
export * from "./GlobalAdapter";
export * from "./ArgParser";
export * from "./Platform";
export * from "./Catcher";
export * from "./EventBus";
export * from './ObjectPool';
export * from './NodePool';