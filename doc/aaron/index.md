# Aaron 框架文档
## 框架简介

Aaron 是一个基于 Cocos Creator 3.8 开发的通用 2D 游戏框架，采用 TypeScript 严格模式开发。框架遵循"实用至上"的设计理念，提供高性能、低耦合、可扩展的游戏开发解决方案。

## 核心特性

- ✨ **模块化架构**: 框架与业务层清晰分离，便于维护和扩展
- 🚀 **高性能设计**: 对象池、资源引用计数、异步加载等优化策略
- 🎯 **类型安全**: 完整的 TypeScript 类型支持，提供智能提示
- 🎨 **UI 框架**: 基于栈管理的 UI 系统，支持层级分离和动画效果
- 🔧 **易用性**: 简洁直观的 API，降低学习成本
- 📦 **依赖注入**: 通过装饰器实现依赖注入，降低模块耦合

## 快速开始

### 目录结构

```
assets/
├── scripts/
│   ├── aaron/    # 框架核心代码
│   └── game/     # 业务逻辑代码
├── resources/    # 资源文件
└── scenes/       # 场景文件
```

### 基本使用

```typescript
// 初始化框架
await aaron.init();

// 打开 UI 界面
const view = await aaron.ui.open('MainView');

// 加载资源
const texture = await aaron.res.load('textures/player');

// 监听事件
aaron.event.on('GAME_START', this.onGameStart, this);
```

## 文档导航

### 核心文档

- [架构设计](./architecture/design.md) - 框架整体架构和设计理念
- [API 参考](./api/) - 详细的 API 文档
- [最佳实践](./best-practices/) - 开发建议和最佳实践

### 模块文档

- [核心模块](./modules/core/) - 核心功能模块
- [管理器模块](./modules/managers/) - 各类管理器
- [依赖注入](./modules/di/) - 依赖注入系统
- [UI 框架](./modules/ui/) - UI 系统文档
- [资源管理](./modules/resources/) - 资源管理系统
- [工具函数](./modules/utils/) - 工具函数库

### 开发指南

- [快速入门](./guides/getting-started.md)
- [项目配置](./guides/project-setup.md)
- [开发规范](./guides/coding-standards.md)
- [性能优化](./guides/performance.md)

## 版本信息

- **当前版本**: 1.0.0
- **引擎版本**: Cocos Creator 3.8.x
- **TypeScript 版本**: 4.x+
- **目标平台**: Web, Android, iOS, 微信小游戏

## 贡献指南

欢迎为 Aaron 框架贡献代码和建议！请阅读 [贡献指南](./contributing.md) 了解详细信息。

## 许可证

本项目采用 MIT 许可证，详情请查看 [LICENSE](../LICENSE) 文件。

---

*最后更新: 2025-11-20*
