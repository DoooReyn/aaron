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
- **架构模式**: MVC + 依赖注入
- **UI架构**: 栈管理 + 层级分离

## 目录结构

```
assets/
├── scripts/
│   ├── aaron/                          # Aaron 核心框架
│   │   ├── index.ts                    # 框架统一导出入口
│   │   ├── core/                       # 核心基础模块
│   │   │   ├── application.ts              # 游戏应用主入口（单例）
│   │   │   ├── object-pool.ts           # 对象池管理
│   │   │   ├── event-manager.ts         # 事件管理器
│   │   │   └── logger.ts               # 日志系统
│   │   ├── base/                       # 基础组件和类
│   │   │   ├── base-component.ts        # 组件基类
│   │   │   ├── base-view.ts             # 视图基类
│   │   │   ├── base-panel.ts            # 面板基类
│   │   │   ├── base-model.ts            # 数据模型基类
│   │   │   └── singleton.ts            # 单例基类
│   │   ├── manager/                    # 管理器模块
│   │   │   ├── ui-manager.ts            # UI 管理器
│   │   │   ├── resource-manager.ts      # 资源管理器
│   │   │   ├── audio-manager.ts         # 音频管理器
│   │   │   ├── network-manager.ts       # 网络管理器
│   │   │   ├── scene-manager.ts         # 场景管理器
│   │   │   ├── data-manager.ts          # 数据管理器
│   │   │   ├── timer-manager.ts         # 计时器管理器
│   │   │   └── localization-manager.ts   # 本地化管理器
│   │   ├── ui/                         # UI 框架模块
│   │   │   ├── ui-layer.ts              # UI 层级管理
│   │   │   ├── ui-stack.ts              # UI 栈管理
│   │   │   ├── ui-view.ts               # UI 视图组件
│   │   │   ├── ui-animation.ts          # UI 动画系统
│   │   │   └── components/             # UI 组件库
│   │   │       ├── button.ts           # 增强按钮
│   │   │       ├── list-view.ts         # 列表视图
│   │   │       ├── scroll-view.ts       # 滚动视图
│   │   │       └── progress-bar.ts      # 进度条
│   │   ├── res/                        # 资源管理模块
│   │   │   ├── res-loader.ts            # 资源加载器
│   │   │   ├── res-cache.ts             # 资源缓存
│   │   │   ├── res-ref.ts               # 资源引用计数
│   │   │   └── bundle-manager.ts        # Bundle 管理
│   │   ├── utils/                      # 工具函数库
│   │   │   ├── math-utils.ts            # 数学工具
│   │   │   ├── time-utils.ts            # 时间工具
│   │   │   ├── string-utils.ts          # 字符串工具
│   │   │   ├── array-utils.ts           # 数组工具
│   │   │   ├── object-utils.ts          # 对象工具
│   │   │   ├── node-utils.ts            # 节点工具
│   │   │   ├── pool-utils.ts            # 对象池工具
│   │   │   └── validator-utils.ts       # 验证工具
│   │   ├── config/                     # 配置管理
│   │   │   ├── game-config.ts           # 游戏配置
│   │   │   ├── ui-config.ts             # UI 配置
│   │   │   ├── network-config.ts        # 网络配置
│   │   │   ├── res-config.ts            # 资源配置
│   │   │   └── platform-config.ts       # 平台配置
│   │   ├── constant/                   # 常量定义
│   │   │   ├── event-const.ts           # 事件常量
│   │   │   ├── ui-layer-const.ts         # UI 层级常量
│   │   │   ├── res-path-const.ts         # 资源路径常量
│   │   │   └── game-const.ts            # 游戏常量
│   │   ├── enum/                       # 枚举定义
│   │   │   ├── ui-enum.ts               # UI 枚举
│   │   │   ├── game-state-enum.ts        # 游戏状态枚举
│   │   │   ├── network-enum.ts          # 网络枚举
│   │   │   └── res-enum.ts              # 资源枚举
│   │   ├── interface/                  # 接口定义
│   │   │   ├── i-manager.ts             # 管理器接口
│   │   │   ├── i-view.ts                # 视图接口
│   │   │   ├── i-model.ts               # 模型接口
│   │   │   ├── i-network.ts             # 网络接口
│   │   │   └── i-config.ts              # 配置接口
│   │   ├── decorator/                  # 装饰器模块
│   │   │   ├── auto-bind.ts             # 自动绑定装饰器
│   │   │   ├── dependency-inject.ts     # 依赖注入装饰器
│   │   │   └── resource.ts             # 资源装饰器
│   │   └── types/                      # 类型定义
│   │       ├── global-types.ts          # 全局类型
│   │       ├── ui-types.ts              # UI 类型
│   │       └── network-types.ts         # 网络类型
│   └── game/                           # 游戏业务逻辑
│       ├── app/                        # 应用层
│       ├── scene/                      # 场景模块
│       ├── view/                       # 视图层
│       ├── model/                      # 数据模型层
│       ├── controller/                 # 控制器层
│       ├── data/                       # 数据层
│       ├── service/                    # 服务层
│       └── config/                     # 游戏配置
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

### 1. 单例模式
- application: 游戏应用主入口（单例），管理器使用依赖注入方式挂载到该实例，由该类提供接口，确保获取到全局唯一的管理器实例

### 2. 工厂模式
- res-loader: 资源加载的工厂
- ui-manager: UI 创建的工厂

### 3. 观察者模式
- event-manager: 事件的发布和订阅
- base-model: 数据变化的观察和通知

### 4. 策略模式
- 不同平台的适配策略
- 不同资源类型的加载策略

### 5. 依赖注入
- 通过装饰器实现依赖注入
- 降低模块间的耦合度

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

### UI 管理示例

```typescript
// 打开一个 UI 界面
const view = await aaron.ui.open('MainView', { data: 'test' });

// 关闭界面
aaron.ui.close('MainView');

// 获取界面实例
const viewInstance = aaron.ui.getView('MainView');
```

### 资源加载示例

```typescript
// 加载单个资源
const texture = await aaron.res.load('textures/player');

// 批量加载资源
const resources = await aaron.res.loadBatch([
  'textures/player',
  'audio/background',
  'prefabs/enemy'
]);

// 释放资源
aaron.res.release('textures/player');
```

### 事件系统示例

```typescript
// 监听事件
aaron.event.on('PLAYER_DIE', this.onPlayerDie, this);

// 触发事件
aaron.event.emit('PLAYER_DIE', { score: 100 });

// 取消监听
aaron.event.off('PLAYER_DIE', this.onPlayerDie, this);
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

## 总结

Aaron 框架通过清晰的模块划分、完善的设计模式应用、以及性能优化策略，为 Cocos Creator 3.8 游戏开发提供了一个坚实的基础架构。框架的设计理念是"实用至上"，避免过度封装，同时确保代码的可读性和智能提示支持，让开发者能够快速上手并高效开发。

---

*文档版本: 1.0.0*  
*作者: DoooReyn*  
*更新日期: 2025-11-20*
