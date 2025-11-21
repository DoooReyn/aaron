# Aaron 框架文档
## 框架简介

Aaron 是一个基于 Cocos Creator 3.8 开发的轻量级 2D 游戏框架，采用依赖倒置架构设计。框架遵循"实用至上"的设计理念，专注于提供游戏开发的核心基础服务，避免过度工程化。

## 核心特性

- 🏗️ **依赖倒置架构**: 基于接口的分层设计，高层模块不依赖低层模块
- 🎯 **轻量级设计**: 专注核心功能，提供必要的基础服务
- 📦 **服务容器模式**: 简洁的服务管理和依赖注入机制
- 🔧 **类型安全**: 完整的 TypeScript 类型支持，启用装饰器
- 🌐 **多平台支持**: 全面支持 Web、移动端、小游戏平台检测
- 🛠️ **实用工具**: 提供常用的字符串处理等工具函数
- 📝 **详细日志**: 多级别日志系统，支持格式化输出

## 核心服务

Aaron 框架提供以下核心服务：

- **Logger** - 日志服务，支持多级别日志输出
- **GlobalAdapter** - 全局对象适配服务，跨环境兼容
- **ArgParser** - 参数解析服务，URL 查询参数处理
- **Platform** - 平台鉴定服务，全面的平台检测能力
- **Catcher** - 异常捕获服务，错误处理机制

## 快速开始

### 框架初始化

```typescript
// game/index.ts
import { init, Aaron, LogLevel } from '../aaron';

// 异步初始化框架
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

### 基本使用

```typescript
// 获取框架单例
const aaron = Aaron.Shared;

// 使用日志服务
aaron.logger.i('游戏启动');
aaron.logger.w('警告信息');
aaron.logger.e('错误信息');

// 平台检测
if (aaron.platform.isWeiXin) {
  console.log('微信小游戏环境');
}

// 获取 URL 参数
const args = aaron.argParser.args;
console.log('URL 参数:', args);
```

## 文档导航

### 核心文档

- [架构设计](./architecture/design.md) - 框架整体架构和设计理念

### API 文档

#### 核心模块
- [Aaron](./api/core/Aaron.md) - 框架主入口类
- [ServiceContainer](./api/core/ServiceContainer.md) - 服务容器实现

#### 服务接口
- [ILogger](./api/interfaces/ILogger.md) - 日志服务接口
- [IGlobalAdapter](./api/interfaces/IGlobalAdapter.md) - 全局对象适配接口
- [IArgParser](./api/interfaces/IArgParser.md) - 参数解析接口
- [IPlatform](./api/interfaces/IPlatform.md) - 平台鉴定接口
- [ICatcher](./api/interfaces/ICatcher.md) - 异常捕获接口

#### 服务实现
- [Logger](./api/implementations/Logger.md) - 日志服务实现
- [GlobalAdapter](./api/implementations/GlobalAdapter.md) - 全局对象适配实现
- [ArgParser](./api/implementations/ArgParser.md) - 参数解析实现
- [Platform](./api/implementations/Platform.md) - 平台鉴定实现
- [Catcher](./api/implementations/Catcher.md) - 异常捕获实现

#### 工具函数
- [Literal](./api/utils/Literal.md) - 字符串处理工具

### 开发指南

- [服务扩展](./guides/service-extension.md) - 如何扩展自定义服务
- [平台适配](./guides/platform-adaptation.md) - 平台适配最佳实践
- [调试技巧](./guides/debugging.md) - 调试和问题排查

## 版本信息

- **当前版本**: 1.1.0
- **引擎版本**: Cocos Creator 3.8.x
- **TypeScript 版本**: 4.x+ (支持装饰器)
- **架构模式**: 依赖倒置原则 + 服务容器模式
- **目标平台**: Web, Android, iOS, 微信小游戏等多平台

## 贡献指南

欢迎为 Aaron 框架贡献代码和建议！请阅读 [贡献指南](./contributing.md) 了解详细信息。

## 许可证

本项目采用 MIT 许可证，详情请查看 [LICENSE](../LICENSE) 文件。

---

*最后更新: 2025-11-22*
*版本: 1.1.0*
