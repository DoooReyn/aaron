# 依赖注入系统

Aaron 框架依赖注入系统是基于接口的配置驱动型 IoC 容器，提供轻量级、类型安全的依赖管理。

## 目录

- [概述](#概述)
- [快速入门](#快速入门)
- [核心概念](#核心概念)
- [使用指南](#使用指南)
- [高级特性](#高级特性)
- [最佳实践](#最佳实践)
- [API 参考](#api-参考)
- [更多资源](#更多资源)

## 概述

### 设计理念

Aaron 的依赖注入系统遵循以下设计原则：

1. **接口驱动**: 所有服务基于接口定义，实现与接口分离
2. **配置驱动**: 依赖关系通过配置而非装饰器声明
3. **类型安全**: 完整的 TypeScript 类型支持
4. **生命周期管理**: 支持单例和瞬态两种生命周期
5. **循环依赖检测**: 自动检测并防止循环依赖

### 特性优势

- ✅ **零反射**: 不依赖 reflect-metadata，性能更优
- ✅ **轻量级**: 核心代码精简，无冗余依赖
- ✅ **易调试**: 清晰的依赖链路，便于问题排查
- ✅ **可测试**: 便于单元测试和模块替换
- ✅ **命名规范**: 严格的命名约定确保代码一致性

## 快速入门

### 1. 定义服务接口

```typescript
// assets/scripts/interfaces/services.ts
export interface IConfigService {
    get(key: string): any;
    set(key: string, value: any): void;
}

export interface ILoggerService {
    log(message: string): void;
    getLogs(): string[];
}
```

### 2. 实现服务类

```typescript
// assets/scripts/services/config-service.ts
export class ConfigService implements IConfigService {
    private _config: Record<string, any> = {};

    get(key: string): any {
        return this._config[key];
    }

    set(key: string, value: any): void {
        this._config[key] = value;
    }
}
```

### 3. 注册和使用服务

```typescript
// 导入 DI 系统
import { DIManager, ServiceLifetime } from '../aaron';
import { IConfigService, ILoggerService, ConfigService } from './interfaces';

const diManager = DIManager.GetInstance();

// 注册服务
diManager.registerServices([
    {
        token: 'IConfigService',
        implementation: ConfigService,
        lifetime: ServiceLifetime.SINGLETON,
        dependencies: []
    }
]);

// 解析服务
const config = diManager.resolve<IConfigService>('IConfigService');
config.set('app.name', 'Aaron Framework');
```

## 核心概念

### 服务生命周期

| 生命周期 | 描述 | 适用场景 |
|---------|------|----------|
| `SINGLETON` | 整个应用生命周期中只创建一个实例 | 配置服务、日志服务、数据库连接 |
| `TRANSIENT` | 每次请求都创建新实例 | 临时的业务对象、状态服务 |

### 依赖注入方式

#### 1. 构造器注入（推荐）

```typescript
export class UserService implements IUserService {
    constructor(
        private _config: IConfigService,
        private _logger: ILoggerService
    ) {}

    getUser(id: string): IUser {
        const config = this._config.get('app');
        this._logger.log(`获取用户: ${id}`);
        // ...
    }
}
```

#### 2. 属性设置注入（特殊情况）

```typescript
export class LoggerService implements ILoggerService {
    private _db: IDatabaseConnection;
    private _config: IConfigService;

    // 手动设置依赖的方法
    setDependencies(db: IDatabaseConnection, config: IConfigService): void {
        this._db = db;
        this._config = config;
    }
}
```

### 命名规范

Aaron 框架采用严格的命名规范：

- **接口**: 必须使用 `I` 前缀，如 `IUserService`
- **私有成员**: 必须使用下划线前缀，如 `_config`
- **静态方法**: 首字母必须大写，如 `GetInstance()`
- **私有静态成员**: 使用 `$` 前缀，如 `$Instance`

## 使用指南

### 基本注册和解析

```typescript
// 1. 注册单个服务
diManager.registerService(
    'IUserService',
    UserService,
    ['IConfigService', 'ILoggerService'], // 依赖列表
    ServiceLifetime.SINGLETON
);

// 2. 批量注册服务
diManager.registerServices([
    {
        token: 'IConfigService',
        implementation: ConfigService,
        lifetime: ServiceLifetime.SINGLETON,
        dependencies: []
    },
    {
        token: 'IUserService',
        implementation: UserService,
        lifetime: ServiceLifetime.SINGLETON,
        dependencies: ['IConfigService', 'ILoggerService']
    }
]);

// 3. 注册实例
const configInstance = new ConfigService();
diManager.registerInstance('IConfigService', configInstance);

// 4. 注册工厂函数
diManager.registerFactory(
    'ILoggerService',
    (container) => new LoggerService(),
    ServiceLifetime.TRANSIENT
);
```

### 服务解析

```typescript
// 安全解析
try {
    const userService = diManager.resolve<IUserService>('IUserService');
    const user = userService.getUser('123');
} catch (error) {
    console.error('服务解析失败:', error);
}

// 尝试解析（不抛出异常）
const userService = diManager.tryResolve<IUserService>('IUserService');
if (userService) {
    // 使用服务
}
```

### 依赖验证

```typescript
// 验证所有依赖关系
const validation = diManager.validateDependencies();
if (validation.isValid) {
    console.log('✅ 所有依赖关系正确');
} else {
    console.error('❌ 依赖关系错误:');
    validation.errors.forEach(error => console.log(`  - ${error}`));
}
```

### 容器管理

```typescript
// 检查服务是否已注册
const isRegistered = diManager.isRegistered('IUserService');

// 获取统计信息
const stats = diManager.getStats();
console.log(`已注册服务: ${stats.registeredServices}`);
console.log(`单例实例: ${stats.singletonInstances}`);

// 移除服务
const removed = diManager.remove('IUserService');

// 清除所有服务
diManager.clear();
```

## 高级特性

### 循环依赖检测

系统自动检测循环依赖：

```typescript
// 如果 A 依赖 B，B 依赖 A
// 解析时会抛出错误: "检测到循环依赖: A -> B -> A"
```

### 复杂依赖链

```typescript
// 依赖链: AuthService -> UserService -> DatabaseConnection
diManager.registerServices([
    {
        token: 'IDatabaseConnection',
        implementation: DatabaseConnection,
        lifetime: ServiceLifetime.SINGLETON,
        dependencies: []
    },
    {
        token: 'IUserService',
        implementation: UserService,
        lifetime: ServiceLifetime.SINGLETON,
        dependencies: ['IDatabaseConnection']
    },
    {
        token: 'IAuthService',
        implementation: AuthService,
        lifetime: ServiceLifetime.SINGLETON,
        dependencies: ['IUserService']
    }
]);
```

### 条件注册

```typescript
// 根据环境条件注册不同实现
const isDebug = process.env.NODE_ENV === 'development';

diManager.registerService(
    'ILoggerService',
    isDebug ? DebugLoggerService : ProductionLoggerService,
    [],
    ServiceLifetime.SINGLETON
);
```

## 最佳实践

### 1. 接口设计原则

- **小而专注**: 每个接口职责单一明确
- **稳定定义**: 接口定义应保持稳定，避免频繁变更
- **版本兼容**: 重大变更时考虑接口版本管理

```typescript
// ✅ 好的设计
export interface ICacheService {
    get<T>(key: string): T | null;
    set<T>(key: string, value: T, ttl?: number): void;
    delete(key: string): boolean;
    clear(): void;
}

// ❌ 避免的设计
export interface IMegaService {
    // 混合多种职责
    getUser(id: string): IUser;
    saveToCache(key: string, value: any): void;
    sendEmail(to: string, content: string): void;
}
```

### 2. 依赖管理原则

- **最小依赖**: 服务只依赖必要的接口
- **避免深层依赖**: 依赖层级不宜过深（建议不超过 3 层）
- **明确声明**: 所有依赖关系必须在注册时明确声明

### 3. 生命周期选择

- **单例适用**: 无状态服务、配置服务、共享资源
- **瞬态适用**: 有状态对象、临时计算、需要隔离的场景

### 4. 错误处理

```typescript
// ✅ 优雅的错误处理
export class RobustService implements IRobustService {
    constructor(private _logger: ILoggerService) {}

    doSomething(): void {
        try {
            // 业务逻辑
        } catch (error) {
            this._logger.log(`操作失败: ${error.message}`);
            // 优雅降级或重新抛出
        }
    }
}
```

### 5. 测试策略

```typescript
// 单元测试时使用模拟实现
describe('UserService', () => {
    let userService: IUserService;
    let mockConfig: IConfigService;
    let mockLogger: ILoggerService;

    beforeEach(() => {
        const diManager = DIManager.GetInstance();

        // 注册模拟服务
        mockConfig = {
            get: jest.fn(),
            set: jest.fn()
        };

        mockLogger = {
            log: jest.fn(),
            getLogs: jest.fn().mockReturnValue([])
        };

        diManager.registerInstance('IConfigService', mockConfig);
        diManager.registerInstance('ILoggerService', mockLogger);
        diManager.registerService('IUserService', UserService,
            ['IConfigService', 'ILoggerService']);

        userService = diManager.resolve<IUserService>('IUserService');
    });

    it('should get user correctly', () => {
        // 测试逻辑
    });
});
```

## API 参考

### DIManager

DI 管理器的主要接口：

```typescript
export class DIManager {
    // 获取单例实例
    static GetInstance(): DIManager;

    // 注册服务
    registerService(token: string, implementation: Constructor, dependencies?: string[], lifetime?: ServiceLifetime): void;
    registerServices(registrations: IServiceRegistration[]): void;
    registerInstance<T>(token: string, instance: T): void;
    registerFactory<T>(token: string, factory: (container: Container) => T, lifetime?: ServiceLifetime): void;

    // 解析服务
    resolve<T>(token: string): T;
    tryResolve<T>(token: string): T | null;

    // 容器管理
    isRegistered(token: string): boolean;
    remove(token: string): boolean;
    clear(): void;

    // 工具方法
    validateDependencies(): ValidationResult;
    getStats(): ContainerStats;
}
```

### ServiceLifetime

```typescript
export enum ServiceLifetime {
    TRANSIENT = 'transient',  // 瞬态
    SINGLETON = 'singleton'   // 单例
}
```

### IServiceRegistration

```typescript
export interface IServiceRegistration {
    token: string;
    implementation: new (...args: any[]) => any;
    lifetime?: ServiceLifetime;
    dependencies?: string[];
}
```

## 更多资源

- **[快速参考](./quick-reference.md)** - 常用 API 和操作速查
- **[示例代码](./examples.md)** - 完整的实际应用示例
- **[测试示例](./examples.md#测试示例)** - 单元测试和集成测试示例
- **[最佳实践](#最佳实践)** - 开发建议和设计模式

---

*最后更新: 2025-11-21*