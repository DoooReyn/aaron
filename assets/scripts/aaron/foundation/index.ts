/**
 * foundation
 * @description foundation 与 utils 类似，都为框架提供了一系列基础能力的封装。
 * - 与 utils 不同的是，foundation 的能力体现为具体的类。
 * - 出于服务其他层的目的，foundation 需严格遵守开闭原则，因此规定 foundation 只能引用 core, interfaces，types，或自身。
 */
export * from './audio';
export * from './collections/LinkedList';
export * from './collections/CircularLinkedList';
export * from './extends/CenterLayout';
export * from './extends/SafeArea';
export * from './extends/Node';
export * from './gui';
export * from './refer';
export * from './tweener';
export * from './AutoAtlas';
export * from './Counter';
export * from './DeepProxy';
export * from './Group';
export * from './LoadTask';
export * from './Model';
export * from './NodePool';
export * from './Noise';
export * from './ObjectEntry';
export * from './ObjectPool';
export * from './RedDotPool';
export * from './ResLocal';
export * from './ResRemote';
export * from './Selector';
export * from './StateMachine';
export * from './StoreEntry';
export * from './Tick';
export * from './Trigger';
