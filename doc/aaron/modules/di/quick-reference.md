# 依赖注入快速参考

## 快速开始

```typescript
import { DIManager, ServiceLifetime } from '../aaron';

const di = DIManager.GetInstance();
```

## 服务注册

### 基本注册
```typescript
// 单个服务
di.registerService('IUserService', UserService, ['IConfigService'], ServiceLifetime.SINGLETON);

// 批量注册
di.registerServices([
    { token: 'IConfigService', implementation: ConfigService },
    { token: 'IUserService', implementation: UserService, dependencies: ['IConfigService'] }
]);
```

### 实例注册
```typescript
const config = new ConfigService();
di.registerInstance('IConfigService', config);
```

### 工厂注册
```typescript
di.registerFactory('ILoggerService',
    (container) => new LoggerService(container.resolve('IConfigService')),
    ServiceLifetime.TRANSIENT
);
```

## 服务解析

```typescript
// 基本解析
const userService = di.resolve<IUserService>('IUserService');

// 安全解析
const logger = di.tryResolve<ILoggerService>('ILoggerService');
if (logger) {
    logger.log('服务存在');
}
```

## 生命周期

| 类型 | 说明 | 用法 |
|------|------|------|
| `SINGLETON` | 单例，整个应用生命周期只创建一次 | `ServiceLifetime.SINGLETON` |
| `TRANSIENT` | 瞬态，每次解析都创建新实例 | `ServiceLifetime.TRANSIENT` |

## 常用操作

```typescript
// 检查注册状态
if (di.isRegistered('IUserService')) {
    console.log('服务已注册');
}

// 验证依赖
const result = di.validateDependencies();
if (!result.isValid) {
    console.error('依赖错误:', result.errors);
}

// 获取统计信息
const stats = di.getStats();
console.log(`已注册: ${stats.registeredServices}, 单例: ${stats.singletonInstances}`);

// 移除服务
di.remove('IUserService');

// 清空容器
di.clear();
```

## 命名规范速查

| 类型 | 规范 | 示例 |
|------|------|------|
| 接口 | I + 名称 | `IUserService` |
| 私有成员 | 下划线前缀 | `_config` |
| 静态方法 | 首字母大写 | `GetInstance()` |
| 私有静态 | $ 前缀 | `$Instance` |

## 错误处理

```typescript
try {
    const service = di.resolve<INonExistentService>('INonExistentService');
} catch (error) {
    if (error.message.includes('未注册')) {
        console.log('服务未注册');
    }
    if (error.message.includes('循环依赖')) {
        console.log('检测到循环依赖');
    }
}
```

## 测试模式

```typescript
// 重置容器用于测试
DIManager.ResetInstance();

// 注册模拟对象
const mockService = new MockConfigService();
const di = DIManager.GetInstance();
di.registerInstance('IConfigService', mockService);
```

---

*快速参考 - Aaron 框架依赖注入系统*