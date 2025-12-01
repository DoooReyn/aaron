# Git MCP 服务配置说明

## 概述

本文档说明如何在 Aaron 框架项目中配置和使用 Git MCP（Model Context Protocol）服务，使 AI 助手能够执行 Git 操作命令。

## 配置状态

✅ **已配置完成** - 项目已成功配置 Git MCP 服务

## 配置详情

### 1. MCP 服务器配置

配置文件：`F:\cocos\aaron\.claude_config.json`

```json
{
  "mcpServers": {
    "git": {
      "command": "npx",
      "args": ["@cyanheads/git-mcp-server", "--repository", "."],
      "description": "Git操作服务器，支持执行git命令"
    }
  },
  "rules": [
    {
      "description": "为Aaron框架项目配置中文git commit消息",
      "pattern": "**",
      "actions": [
        {
          "type": "git_commit",
          "template": "feat({scope}): {description}\n\n{body}",
          "conventionalCommits": true,
          "language": "zh-CN"
        }
      ]
    }
  ],
  "preferences": {
    "language": "zh-CN",
    "git": {
      "autoStage": false,
      "requireConfirmation": true,
      "defaultBranch": "main",
      "commitMessageStyle": "conventional"
    }
  }
}
```

### 2. 依赖包

已安装的 MCP Git 服务器：
- **包名**: `@cyanheads/git-mcp-server`
- **版本**: 2.5.6
- **安装位置**: `node_modules/@cyanheads/git-mcp-server`

## 功能特性

### Git 操作支持

MCP Git 服务器提供 27 个 Git 工具，包括：

- **基础操作**: `git_init`, `git_clone`, `git_status`, `git_log`
- **分支操作**: `git_branch`, `git_checkout`, `git_merge`
- **提交操作**: `git_add`, `git_commit`, `git_push`, `git_pull`
- **历史操作**: `git_log`, `git_show`, `git_diff`, `git_blame`
- **远程操作**: `git_fetch`, `git_remote`, `git_push`, `git_pull`
- **高级操作**: `git_rebase`, `git_cherry_pick`, `git_stash`, `git_worktree`

### 中文支持

- 配置文件设置为中文环境 (`"language": "zh-CN"`)
- 支持中文 commit 消息
- 遵循 Conventional Commits 规范

### 安全设置

- `autoStage: false` - 不自动暂存文件
- `requireConfirmation: true` - 需要用户确认
- `defaultBranch: "main"` - 默认主分支为 main

## 使用方法

### 1. 基本操作

AI 助手现在可以直接执行 Git 命令：

```bash
# 检查状态
git status

# 查看历史
git log --oneline -5

# 添加文件
git add <file>

# 提交更改
git commit -m "feat(scope): 功能描述"
```

### 2. 分支操作

```bash
# 创建新分支
git checkout -b feature/new-feature

# 合并分支
git merge feature/new-feature

# 删除分支
git branch -d feature/new-feature
```

### 3. 远程操作

```bash
# 推送更改
git push origin main

# 拉取更新
git pull origin main

# 查看远程仓库
git remote -v
```

## Commit 消息规范

项目使用 Conventional Commits 规范，支持中文：

### 格式

```
<type>(<scope>): <description>

<body>

<footer>
```

### 类型说明

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 重构代码
- `test`: 测试相关
- `chore`: 构建或辅助工具变动

### 示例

```bash
git commit -m "feat(aaron): 添加音频播放服务

- 实现音频资源管理器
- 添加音效播放接口
- 支持背景音乐循环播放

Closes #123"
```

## 故障排除

### 常见问题

1. **MCP 服务器无法启动**
   - 检查 `@cyanheads/git-mcp-server` 是否正确安装
   - 确认 Node.js 版本 >= 16
   - 验证 git 命令在系统 PATH 中

2. **权限问题**
   - 确保对仓库目录有读写权限
   - 检查 git 用户配置

3. **网络问题**
   - 如果使用镜像源，尝试切换到官方源
   - 检查防火墙设置

### 重置配置

如果配置出现问题，可以：

1. 删除 `.claude_config.json`
2. 重新运行配置脚本
3. 重新安装依赖包

## 版本信息

- **MCP 协议版本**: 2025-06-18
- **Git MCP 服务器版本**: 2.5.6
- **Node.js 要求**: >= 16.0.0
- **Git 要求**: >= 2.0.0

## 参考资源

- [MCP 官方文档](https://modelcontextprotocol.io)
- [@cyanheads/git-mcp-server](https://github.com/cyanheads/git-mcp-server)
- [Conventional Commits 规范](https://conventionalcommits.org/)

## 注意事项

1. **备份重要数据** - 在执行重要 Git 操作前建议备份
2. **确认操作** - MCP 配置要求确认，避免误操作
3. **定期更新** - 定期更新 MCP 服务器包以获取最新功能
4. **日志监控** - 关注 MCP 服务器日志，及时发现问题

---

*最后更新：2025-12-01*