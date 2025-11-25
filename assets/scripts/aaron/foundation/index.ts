/**
 * foundation
 * @description foundation 与 utils 类似，都为框架提供了一系列基础能力的封装。
 * - 与 utils 不同的是，foundation 的能力体现为具体的类。
 * - 出于服务其他层的目的，foundation 需严格遵守开闭原则，因此规定 foundation 只能引用 interfaces，types，或自身。
 */
export * from './collections/LinkedList';
export * from './collections/CircularLinkedList';
export * from './extends/CenterLayout';
export * from './extends/SafeArea';
export * from './extends/Node';
export * from './AutoAtlas';
export * from './Counter';
export * from './DeepProxy';
export * from './Group';
export * from './Model';
export * from './NodePool';
export * from './ObjectEntry';
export * from './ObjectPool';
export * from './Selector';
export * from './StateMachine';
export * from './StoreEntry';
export * from './Trigger';
