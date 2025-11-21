# Aaron 框架架构设计
## 概述

Aaron 是一个基于 Cocos Creator 3.8 开发的轻量级 2D 游戏框架，采用依赖倒置架构设计，提供核心基础服务，旨在为游戏开发提供简洁、高效、可扩展的基础架构。

## 设计理念

### 核心原则

1. **依赖倒置原则**：高层模块不依赖低层模块，都依赖于抽象接口
2. **分层架构**：框架层与业务层清晰分离，确保代码的可维护性和可扩展性
3. **模块化设计**：每个功能模块独立，便于单独开发、测试和维护
4. **类型安全**：充分利用 TypeScript 的类型系统，提供完整的智能提示支持
5. **实用至上**：避免过度工程化，专注于游戏开发的核心需求

### 技术栈

- **引擎**: Cocos Creator 3.8.x
- **语言**: TypeScript (装饰器支持)
- **平台**: Web, Android, iOS, 微信小游戏等多平台
- **架构模式**: 依赖倒置原则 + 服务容器模式
- **版本**: 1.1.0

## 目录结构

### 实际实现的分层架构

```
assets/
├── scripts/
│   ├── aaron/                          # Aaron 核心框架 v1.1.0
│   │   ├── interfaces/                 # 🏁 接口定义层（最抽象层）
│   │   │   ├── index.ts               # 统一导出接口
│   │   │   └── services/              # 核心服务接口
│   │   │       ├── index.ts
│   │   │       ├── ILogger.ts         # 日志服务接口
│   │   │       ├── IGlobalAdapter.ts  # 全局对象适配接口
│   │   │       ├── IArgParser.ts      # 参数解析接口
│   │   │       ├── IPlatform.ts       # 平台鉴定接口
│   │   │       └── ICatcher.ts        # 异常捕获接口
│   │   │
│   │   ├── implementations/            # 🏗️ 实现层（依赖接口层）
│   │   │   ├── index.ts              # 统一导出实现
│   │   │   └── services/             # 核心服务实现
│   │   │       ├── index.ts
│   │   │       ├── Logger.ts         # 日志服务实现
│   │   │       ├── GlobalAdapter.ts  # 全局对象适配实现
│   │   │       ├── ArgParser.ts      # 参数解析实现
│   │   │       ├── Platform.ts       # 平台鉴定实现
│   │   │       └── Catcher.ts        # 异常捕获实现
│   │   │
│   │   ├── core/                     # 🎯 核心层（只依赖接口）
│   │   │   ├── index.ts             # 核心模块导出
│   │   │   ├── Aaron.ts             # 框架主入口类
│   │   │   └── ServiceContainer.ts  # 服务容器实现
│   │   │
│   │   ├── macro/                    # 🔧 宏定义和常量
│   │   │   ├── index.ts
│   │   │   └── Services.ts          # 服务标识符常量
│   │   │
│   │   ├── types/                    # 📝 类型定义
│   │   │   └── index.ts             # 基础类型定义
│   │   │
│   │   ├── utils/                    # 🛠️ 工具层（无依赖）
│   │   │   ├── index.ts             # 工具模块统一导出
│   │   │   └── Literal.ts           # 字符串处理工具
│   │   │
│   │   ├── index.ts                 # 框架主入口文件
│   │   └── Init.ts                  # 框架初始化器
│   │
│   └── game/                         # 🎮 游戏业务逻辑
│       └── index.ts                 # 游戏入口和初始化
```

### 架构层次说明

1. **接口层 (interfaces/)** - 定义所有抽象接口，最抽象层
2. **实现层 (implementations/)** - 具体实现，依赖接口层
3. **核心层 (core/)** - 框架核心逻辑，只依赖接口层
4. **工具层 (utils/)** - 工具函数，无外部依赖
5. **宏定义 (macro/)** - 常量和标识符定义
6. **类型定义 (types/)** - TypeScript 类型定义

### 依赖关系图

```
🎯 核心层 (core/)
    ↓ 依赖
🏁 接口层 (interfaces/)
    ↑ 被实现
🏗️ 实现层 (implementations/)

🛠️ 工具层 (utils/) ← 被所有层使用
🔧 宏定义 (macro/) ← 被所有层使用
📝 类型定义 (types/) ← 被所有层使用
```

## 核心模块说明

### 1. 核心模块 (core/)

#### Aaron.ts - 框架主入口类
- 采用单例模式设计，提供全局访问点
- 负责服务的注册和获取
- 提供内置服务的便捷访问器（logger, globalAdapter, argParser, platform, catcher）
- 基于依赖倒置原则，不直接依赖具体实现

#### ServiceContainer.ts - 服务容器
- 实现 IServiceContainer 接口
- 支持工厂方法和实例注册两种方式
- 提供服务查询、统计和管理功能
- 包含 Service 基类，提供服务解析能力
- 支持 InjectProperty 装饰器（可选）

### 2. 核心服务

#### Logger - 日志服务
- **接口**: ILogger
- **功能**: 支持多级别日志（DEBUG, INFO, WARN, ERROR）
- **特性**: 格式化和非格式化日志方法，可配置日志级别

#### GlobalAdapter - 全局对象适配服务
- **接口**: IGlobalAdapter
- **功能**: 跨环境全局对象访问适配
- **平台**: 支持 globalThis, window, self, 微信小游戏等环境

#### ArgParser - 参数解析服务
- **接口**: IArgParser
- **功能**: URL 查询参数解析和自定义参数合并
- **集成**: 与 GlobalAdapter 协作获取环境信息

#### Platform - 平台鉴定服务
- **接口**: IPlatform
- **功能**: 全面的平台检测能力
- **支持**: 操作系统、运行环境、小游戏平台等多维度检测

#### Catcher - 异常捕获服务
- **接口**: ICatcher
- **功能**: 异常处理和错误捕获机制

### 3. 服务标识符 (macro/Services.ts)

定义所有内置服务的字符串标识符：
```typescript
export const SERVICES = {
  GLOBAL_ADAPTER: 'GlobalAdapter',
  LOGGER: 'Logger',
  ARG_PARSER: 'ArgParser',
  PLATFORM: 'Platform',
  CATCHER: 'Catcher'
};
```

### 4. 工具函数库 (utils/)

#### Literal - 字符串处理工具
- **fmt()**: 模板格式化（支持位置参数和命名参数）
- **isBlank()**: 空字符串检查
- **isLiteral()**: 字符串类型检查
- **truncate()**: 字符串截断

### 5. 类型定义 (types/)

提供基础类型定义：
- **Dict**: 字典类型 `Record<string | symbol, any>`
- **Global**: 全局变量类型，兼容多种环境

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

### 1. 框架初始化

```typescript
// game/index.ts
import { Aaron, init, LogLevel } from '../aaron';

// 根据环境配置初始化
init({
  logLevel: DEBUG ? LogLevel.DEBUG : LogLevel.INFO
})
.then(() => {
  Aaron.Shared.logger.i('✅ 游戏框架初始化完成');
})
.catch((error) => {
  console.error('❌ 游戏框架初始化失败:', error);
});
```

### 2. 服务使用

```typescript
// 获取框架单例
const aaron = Aaron.Shared;

// 使用便捷访问器
aaron.logger.i('应用启动');
aaron.logger.w('警告信息');
aaron.logger.e('错误信息');

// 平台检测
if (aaron.platform.isWeiXin) {
  console.log('当前在微信小游戏环境');
}

// 参数解析
const args = aaron.argParser.args;
console.log('URL参数:', args);

// 全局对象访问
const globalInfo = aaron.globalAdapter.get('aaron');
```

### 3. 服务注册

```typescript
// 注册自定义服务
interface ICustomService {
  doSomething(): void;
}

class CustomService implements ICustomService {
  doSomething(): void {
    console.log('Doing something...');
  }
}

// 注册服务实例
aaron.registerServiceInstance<ICustomService>('CustomService', new CustomService());

// 注册服务工厂
aaron.registerServiceFactory<ICustomService>('CustomService', () => new CustomService());

// 使用服务
const customService = aaron.serviceOf<ICustomService>('CustomService');
customService.doSomething();
```

### 4. 继承 Service 基类

```typescript
import { Service } from '../aaron/core';
import { IGlobalAdapter } from '../aaron/interfaces';
import { SERVICES } from '../aaron/macro';

class GameService extends Service {
  private get globalAdapter(): IGlobalAdapter {
    return this.resolve<IGlobalAdapter>(SERVICES.GLOBAL_ADAPTER);
  }

  startGame(): void {
    const globalInfo = this.globalAdapter.get('gameConfig');
    console.log('游戏开始，配置:', globalInfo);
  }
}

const gameService = new GameService();
gameService.startGame();
```

### 5. 使用工具函数

```typescript
import { literal } from '../aaron/utils';

// 字符串格式化
const message = literal.fmt('Hello {0}, your score is {score}', 'Player', { score: 100 });
console.log(message); // "Hello Player, your score is 100"

// 字符串检查
if (!literal.isBlank(inputText)) {
  console.log('输入有效');
}

// 字符串截断
const shortText = literal.truncate(longText, 20);
```

### 6. 平台适配

```typescript
const aaron = Aaron.Shared;

// 操作系统检测
switch (true) {
  case aaron.platform.isMacOS:
    console.log('macOS 平台');
    break;
  case aaron.platform.isWindows:
    console.log('Windows 平台');
    break;
  case aaron.platform.isAndroid:
    console.log('Android 平台');
    break;
  case aaron.platform.isiOS:
    console.log('iOS 平台');
    break;
}

// 小游戏平台检测
if (aaron.platform.isWeiXin) {
  // 微信小游戏特定逻辑
  wx.login();
} else if (aaron.platform.isHuawei) {
  // 华为小游戏特定逻辑
  hwsdk.login();
}

// 运行环境检测
if (aaron.platform.isNative) {
  console.log('原生环境');
} else if (aaron.platform.isBrowser) {
  console.log('浏览器环境');
}
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
