# Aaron 框架架构设计
## 概述

Aaron 是一个基于 Cocos Creator 3.8 开发的通用 2D 游戏框架，采用模块化、可扩展的设计理念，旨在提供高性能、低耦合、易用的游戏开发解决方案。

## 设计理念

### 核心原则

1. **分层架构**：框架层与业务层清晰分离，确保代码的可维护性和可扩展性
2. **模块化设计**：每个功能模块独立，便于单独开发、测试和维护
3. **类型安全**：充分利用 TypeScript 的类型系统，提供完整的智能提示支持
4. **性能优先**：采用对象池、资源引用计数等技术，避免内存泄漏和性能问题
5. **易用性**：提供简洁直观的 API，降低学习成本

### 技术栈

- **引擎**: Cocos Creator 3.8.x
- **语言**: TypeScript (Strict Mode)
- **平台**: Web, Android, iOS, 微信小游戏
- **架构模式**: MVC + 依赖倒置原则
- **UI架构**: 栈管理 + 层级分离

## 目录结构

### 基于依赖倒置原则的分层架构

```
assets/
├── scripts/
│   ├── aaron/                          # Aaron 核心框架
│   │   ├── interfaces/                 # 🏁 接口定义层（最抽象层）
│   │   │   ├── index.ts               # 统一导出接口
│   │   │   ├── services/              # 服务接口
│   │   │   │   ├── index.ts
│   │   │   │   ├── ILoggerService.ts
│   │   │   │   ├── IResourceManager.ts
│   │   │   │   ├── IUIManager.ts
│   │   │   │   ├── IAudioManager.ts
│   │   │   │   ├── INetworkManager.ts
│   │   │   │   └── ISceneManager.ts
│   │   │   ├── managers/              # 管理器接口
│   │   │   │   ├── index.ts
│   │   │   │   ├── IResourceManager.ts
│   │   │   │   ├── IUIManager.ts
│   │   │   │   └── ...
│   │   │   ├── components/            # 组件接口
│   │   │   │   ├── index.ts
│   │   │   │   ├── IView.ts
│   │   │   │   ├── IPanel.ts
│   │   │   │   └── IModel.ts
│   │   │   └── types/                 # 基础类型定义
│   │   │       ├── index.ts
│   │   │       ├── common.ts
│   │   │       └── events.ts
│   │   │
│   │   ├── implementations/            # 🏗️ 实现层（依赖接口层）
│   │   │   ├── index.ts              # 统一导出实现
│   │   │   ├── services/             # 服务实现
│   │   │   │   ├── index.ts
│   │   │   │   ├── LoggerService.ts
│   │   │   │   ├── ResourceManager.ts
│   │   │   │   └── ...
│   │   │   ├── managers/             # 管理器实现
│   │   │   │   ├── index.ts
│   │   │   │   ├── ResourceManager.ts
│   │   │   │   ├── UIManager.ts
│   │   │   │   └── ...
│   │   │   └── components/           # 组件实现
│   │   │       ├── index.ts
│   │   │       ├── BaseView.ts
│   │   │       ├── BasePanel.ts
│   │   │       └── ...
│   │   │
│   │   ├── core/                     # 🎯 核心业务逻辑层（只依赖接口）
│   │   │   ├── index.ts             # 核心模块导出
│   │   │   ├── Application.ts       # 应用主入口
│   │   │   ├── ServiceLocator.ts    # 简化的服务定位器
│   │   │   ├── object-pool.ts       # 对象池管理
│   │   │   └── event-manager.ts     # 事件管理器
│   │   │
│   │   ├── ui/                       # UI 框架模块（依赖接口）
│   │   │   ├── index.ts
│   │   │   ├── ui-layer.ts          # UI 层级管理
│   │   │   ├── ui-stack.ts          # UI 栈管理
│   │   │   ├── ui-view.ts           # UI 视图组件
│   │   │   ├── ui-animation.ts      # UI 动画系统
│   │   │   └── components/          # UI 组件库
│   │   │       ├── button.ts        # 增强按钮
│   │   │       ├── list-view.ts      # 列表视图
│   │   │       ├── scroll-view.ts    # 滚动视图
│   │   │       └── progress-bar.ts   # 进度条
│   │   │
│   │   ├── res/                      # 资源管理模块（依赖接口）
│   │   │   ├── index.ts
│   │   │   ├── res-loader.ts         # 资源加载器
│   │   │   ├── res-cache.ts          # 资源缓存
│   │   │   ├── res-ref.ts            # 资源引用计数
│   │   │   └── bundle-manager.ts     # Bundle 管理
│   │   │
│   │   ├── utils/                    # 🛠️ 工具层（无依赖，被所有层使用）
│   │   │   ├── index.ts
│   │   │   ├── math-utils.ts         # 数学工具
│   │   │   ├── time-utils.ts         # 时间工具
│   │   │   ├── string-utils.ts       # 字符串工具
│   │   │   ├── array-utils.ts        # 数组工具
│   │   │   ├── object-utils.ts       # 对象工具
│   │   │   ├── node-utils.ts         # 节点工具
│   │   │   ├── pool-utils.ts         # 对象池工具
│   │   │   └── validator-utils.ts    # 验证工具
│   │   │
│   │   ├── config/                   # 配置管理
│   │   │   ├── index.ts
│   │   │   ├── game-config.ts        # 游戏配置
│   │   │   ├── ui-config.ts          # UI 配置
│   │   │   ├── network-config.ts     # 网络配置
│   │   │   ├── res-config.ts         # 资源配置
│   │   │   └── platform-config.ts    # 平台配置
│   │   │
│   │   ├── constant/                 # 常量定义
│   │   │   ├── index.ts
│   │   │   ├── event-const.ts        # 事件常量
│   │   │   ├── ui-layer-const.ts      # UI 层级常量
│   │   │   ├── res-path-const.ts      # 资源路径常量
│   │   │   └── game-const.ts         # 游戏常量
│   │   │
│   │   ├── enum/                     # 枚举定义
│   │   │   ├── index.ts
│   │   │   ├── ui-enum.ts            # UI 枚举
│   │   │   ├── game-state-enum.ts     # 游戏状态枚举
│   │   │   ├── network-enum.ts       # 网络枚举
│   │   │   └── res-enum.ts           # 资源枚举
│   │   │
│   │   └── types/                    # 类型定义
│   │       ├── index.ts
│   │       ├── global-types.ts       # 全局类型
│   │       ├── ui-types.ts           # UI 类型
│   │       └── network-types.ts      # 网络类型
│   │
│   └── game/                         # 游戏业务逻辑（依赖框架接口）
│       ├── index.ts
│       ├── app/                      # 应用层
│       ├── scene/                    # 场景模块
│       ├── view/                     # 视图层
│       ├── model/                    # 数据模型层
│       ├── controller/               # 控制器层
│       ├── data/                     # 数据层
│       ├── service/                  # 服务层
│       └── config/                   # 游戏配置
```

### 架构层次说明

1. **接口层 (interfaces/)** - 定义所有抽象接口，最抽象层
2. **实现层 (implementations/)** - 具体实现，依赖接口层
3. **核心层 (core/)** - 核心业务逻辑，只依赖接口层
4. **工具层 (utils/)** - 工具函数，无外部依赖
5. **模块层 (ui/, res/)** - 功能模块，依赖接口层

### 依赖关系图

```
🎯 核心层 (core/)
    ↓ 依赖
🏁 接口层 (interfaces/)
    ↑ 被实现
🏗️ 实现层 (implementations/)

🛠️ 工具层 (utils/) ← 被所有层使用
📦 模块层 (ui/, res/) ← 依赖接口层
```

## 核心模块说明

### 1. 核心模块 (core/)

#### application.ts
- 游戏应用主入口，负责初始化各个管理器
- 处理应用生命周期
- 提供全局访问接口

#### event-manager.ts
- 统一的事件管理系统
- 支持全局事件和局部事件
- 提供事件的优先级和一次性监听

#### object-pool.ts
- 对象池管理，避免频繁创建和销毁对象
- 支持不同类型的对象池
- 自动扩容和缩容机制

#### logger.ts
- 统一的日志系统
- 支持不同级别的日志输出
- 可配置的日志输出目标

### 2. 基础模块 (base/)

提供基础类和组件，所有业务代码都应该继承自这些基础类：

- **base-component**: 组件基类，提供生命周期管理和通用方法
- **base-view**: 视图基类，提供视图的通用功能
- **base-panel**: 面板基类，继承自 base-view，专门用于面板类 UI
- **base-model**: 数据模型基类，提供数据绑定和通知机制
- **singleton**: 单例基类，提供单例模式实现

### 3. 管理器模块 (manager/)

各个管理器负责游戏中的特定功能：

- **ui-manager**: UI 界面管理，负责界面的打开、关闭、层级管理
- **resource-manager**: 资源管理，负责资源的加载、缓存和释放
- **audio-manager**: 音频管理，负责背景音乐和音效的播放
- **network-manager**: 网络管理，负责网络通信和协议处理
- **scene-manager**: 场景管理，负责场景的切换和预加载
- **data-manager**: 数据管理，负责游戏数据的存储和读取
- **timer-manager**: 计时器管理，提供定时任务功能
- **localization-manager**: 本地化管理，支持多语言切换

### 4. UI 框架模块 (ui/)

提供完整的 UI 解决方案：

- **ui-layer**: UI 层级管理，定义 UI 的显示层级
- **ui-stack**: UI 栈管理，实现界面的入栈和出栈
- **ui-view**: UI 视图组件，提供视图的基础功能
- **ui-animation**: UI 动画系统，提供丰富的界面动画效果
- **components/**: UI 组件库，提供常用的 UI 组件

### 5. 资源管理模块 (res/)

完善的资源管理系统：

- **res-loader**: 资源加载器，支持同步和异步加载
- **res-cache**: 资源缓存，提供资源缓存机制
- **res-ref**: 资源引用计数，自动管理资源的生命周期
- **bundle-manager**: Bundle 管理，支持多个资源包的管理

### 6. 工具函数库 (utils/)

提供常用的工具函数：

- **math-utils**: 数学计算相关工具
- **time-utils**: 时间处理相关工具
- **string-utils**: 字符串处理相关工具
- **array-utils**: 数组操作相关工具
- **object-utils**: 对象操作相关工具
- **node-utils**: 节点操作相关工具
- **pool-utils**: 对象池相关工具
- **validator-utils**: 数据验证相关工具

## 设计模式应用

### 1. 依赖倒置原则 (DIP)
- **核心原则**: 高层模块不依赖低层模块，都依赖于抽象
- **接口分离**: 接口定义与具体实现物理分离
- **抽象稳定**: 接口层保持稳定，实现层可以自由变化

### 2. 单例模式
- Application: 游戏应用主入口，提供全局访问点
- ServiceLocator: 简化的服务定位器，管理服务实例

### 3. 工厂模式
- ServiceLocator: 使用工厂函数创建服务实例
- 资源加载器: 根据类型创建不同的加载策略
- UI 管理器: 根据配置创建不同类型的 UI 组件

### 4. 观察者模式
- EventManager: 事件的发布和订阅
- 数据模型: 数据变化的观察和通知机制

### 5. 策略模式
- 平台适配: 不同平台的实现策略
- 资源加载: 不同资源类型的加载策略
- UI 动画: 不同的动画实现策略

### 6. 服务定位器模式
- **简化替代**: 替代复杂的依赖注入容器
- **手动装配**: 在应用启动时手动注册和装配依赖
- **类型安全**: 基于 TypeScript 接口的安全访问

## 性能优化策略

### 1. 对象池
- 避免频繁创建和销毁对象
- 减少 GC 压力

### 2. 资源引用计数
- 自动管理资源的生命周期
- 避免内存泄漏

### 3. 异步加载
- 资源的异步加载
- 场景的预加载

### 4. 批量操作
- UI 的批量更新
- 事件的批量处理

## 使用示例

### 1. 接口定义示例

```typescript
// interfaces/services/IResourceManager.ts
export interface IResourceManager {
    load<T>(path: string): Promise<T>;
    loadBatch(paths: string[]): Promise<any[]>;
    release(path: string): void;
}

// interfaces/services/ILoggerService.ts
export interface ILoggerService {
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}
```

### 2. 实现类示例

```typescript
// implementations/services/ResourceManager.ts
export class ResourceManager implements IResourceManager {
    constructor(private _logger: ILoggerService) {}

    async load<T>(path: string): Promise<T> {
        this._logger.info(`Loading resource: ${path}`);
        // 具体实现...
    }

    async loadBatch(paths: string[]): Promise<any[]> {
        this._logger.info(`Loading batch resources: ${paths.join(', ')}`);
        // 具体实现...
    }

    release(path: string): void {
        this._logger.info(`Releasing resource: ${path}`);
        // 具体实现...
    }
}
```

### 3. 服务装配示例

```typescript
// core/Application.ts
export class Application {
    private static _instance: Application;
    private _serviceLocator: IServiceLocator;

    private constructor() {
        this._serviceLocator = new ServiceLocator();
        this.registerServices();
    }

    static GetInstance(): Application {
        if (!Application._instance) {
            Application._instance = new Application();
        }
        return Application._instance;
    }

    private registerServices(): void {
        // 注册日志服务
        this._serviceLocator.register<ILoggerService>(
            'ILoggerService',
            () => new LoggerService()
        );

        // 注册资源管理器（依赖日志服务）
        this._serviceLocator.register<IResourceManager>(
            'IResourceManager',
            () => new ResourceManager(
                this._serviceLocator.get<ILoggerService>('ILoggerService')
            )
        );
    }

    getService<T>(token: string): T {
        return this._serviceLocator.get<T>(token);
    }
}
```

### 4. 使用服务示例

```typescript
// 在游戏业务代码中使用
const app = Application.GetInstance();
const resourceManager = app.getService<IResourceManager>('IResourceManager');
const logger = app.getService<ILoggerService>('ILoggerService');

// 加载资源
const texture = await resourceManager.load<Texture>('textures/player');

// 批量加载
const resources = await resourceManager.loadBatch([
    'textures/player',
    'audio/background',
    'prefabs/enemy'
]);

// 记录日志
logger.info('Game started successfully');
```

### 5. UI 管理示例

```typescript
// interfaces/managers/IUIManager.ts
export interface IUIManager {
    open<T>(viewName: string, data?: any): Promise<T>;
    close(viewName: string): void;
    getView<T>(viewName: string): T | null;
}

// 在业务代码中使用
const uiManager = app.getService<IUIManager>('IUIManager');

// 打开 UI 界面
const view = await uiManager.open('MainView', { data: 'test' });

// 关闭界面
uiManager.close('MainView');

// 获取界面实例
const viewInstance = uiManager.getView('MainView');
```

### 6. 事件系统示例

```typescript
// interfaces/services/IEventService.ts
export interface IEventService {
    on(event: string, handler: Function, context?: any): void;
    off(event: string, handler: Function, context?: any): void;
    emit(event: string, data?: any): void;
}

// 在业务代码中使用
const eventService = app.getService<IEventService>('IEventService');

// 监听事件
eventService.on('PLAYER_DIE', this.onPlayerDie, this);

// 触发事件
eventService.emit('PLAYER_DIE', { score: 100 });

// 取消监听
eventService.off('PLAYER_DIE', this.onPlayerDie, this);
```

### 7. 测试友好示例

```typescript
// 单元测试中可以轻松模拟依赖
describe('GameLogic', () => {
    let gameLogic: GameLogic;
    let mockResourceManager: IResourceManager;
    let mockLogger: ILoggerService;

    beforeEach(() => {
        mockResourceManager = {
            load: jest.fn(),
            loadBatch: jest.fn(),
            release: jest.fn()
        };

        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        gameLogic = new GameLogic(mockResourceManager, mockLogger);
    });

    it('should load resources correctly', async () => {
        mockResourceManager.load.mockResolvedValue({});
        await gameLogic.loadGameAssets();
        expect(mockResourceManager.load).toHaveBeenCalledWith('textures/player');
    });
});
```

## 扩展性设计

### 1. 插件系统
- 支持第三方插件的集成
- 提供插件的生命周期管理

### 2. 模块热更新
- 支持模块的动态加载和卸载
- 便于功能的扩展和维护

### 3. 配置驱动
- 通过配置文件控制框架行为
- 支持运行时配置修改

## 架构对比分析

### 依赖注入 vs 依赖倒置对比

| 方面 | 旧架构（依赖注入） | 新架构（依赖倒置） |
|------|------------------|-------------------|
| **复杂度** | 高（容器、生命周期、循环依赖检测） | 低（简单的服务注册表） |
| **性能** | 中等（反射、解析开销） | 高（直接工厂调用） |
| **可维护性** | 中等（配置复杂、调试困难） | 高（清晰的层次结构、易调试） |
| **可测试性** | 高（依赖注入） | 高（接口分离，易Mock） |
| **学习曲线** | 陡峭（DI概念、装饰器） | 平缓（简单接口、工厂函数） |
| **内存占用** | 较高（容器元数据、反射数据） | 较低（简单Map存储） |
| **错误排查** | 复杂（依赖链、循环依赖） | 简单（直接的调用栈） |
| **代码生成** | 可能影响（装饰器元数据） | 无影响 |

### 新架构的核心优势

1. **简化复杂性**
   - 移除复杂的依赖注入容器
   - 无需循环依赖检测机制
   - 简化的服务定位器模式

2. **提高性能**
   - 直接的工厂函数调用
   - 无反射和元数据开销
   - 更少的内存占用

3. **增强可维护性**
   - 清晰的物理分层结构
   - 接口与实现完全分离
   - 更容易理解和调试

4. **保持灵活性**
   - 仍然支持依赖替换
   - 易于单元测试
   - 支持运行时服务注册

5. **遵循SOLID原则**
   - 单一职责：每个服务职责明确
   - 开闭原则：通过接口扩展功能
   - 里氏替换：实现可以替换接口
   - 接口隔离：小而专注的接口
   - 依赖倒置：依赖抽象而非具体实现

### 迁移建议

1. **渐进式迁移**
   - 保留现有接口定义
   - 逐步替换实现类
   - 最后移除DI容器代码

2. **优先级排序**
   - 先迁移核心服务（日志、配置）
   - 再迁移业务管理器
   - 最后迁移UI和资源管理

3. **测试保证**
   - 为每个迁移的模块编写测试
   - 确保功能不退化
   - 性能基准测试

## 总结

Aaron 框架通过从复杂的依赖注入系统转向简洁的依赖倒置架构，实现了：

- **降低复杂性**：移除了过度设计的DI容器，采用简单的服务定位器模式
- **提高性能**：避免了反射和运行时解析的开销，使用直接的工厂调用
- **增强可维护性**：清晰的物理分层和接口分离，使代码更容易理解和维护
- **保持灵活性**：通过接口优先的设计，仍然支持依赖替换和单元测试

新的架构设计更加符合"实用至上"的设计理念，避免了过度工程化，同时保持了类型安全、模块化和可扩展性的优势。这为 Cocos Creator 3.8 游戏开发提供了一个更加简洁、高效、易维护的基础架构。

---

*文档版本: 1.1.0*
*作者: DoooReyn*
*更新日期: 2025-11-21*
*架构重构: 从依赖注入转向依赖倒置原则*
