# Contributing to tuniu-cli

感谢你对 tuniu-cli 的关注！欢迎提交 Issue、Pull Request 或参与讨论。

## 开发环境

- Node.js 18+
- npm 11+

```bash
git clone https://github.com/tuniucorp/tuniu-cli.git
cd tuniu-cli
npm install
```

## 开发流程

```bash
# 运行源码（无需构建）
npm run dev -- list

# 构建
npm run build

# 运行测试
npm test

# 类型检查
npm run typecheck

# 代码规范检查
npm run lint

# 自动修复 lint 问题
npm run lint:fix
```

## 提交 Pull Request

1. Fork 本仓库并创建你的特性分支（`git checkout -b feature/my-feature`）
2. 确保所有检查通过：

```bash
npm run lint
npm run typecheck
npm test
```

3. 提交你的更改并推送到你的 Fork
4. 创建 Pull Request，描述你的更改内容与动机

## 提交规范

提交信息建议使用以下格式：

```
<type>: <简短描述>

<可选的详细说明>
```

常见 type：
- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `refactor`: 重构（不改变功能）
- `test`: 测试相关
- `chore`: 构建/工具链/依赖变更

## 报告问题

非安全问题建议优先通过 GitHub Issue 提交；安全漏洞请参考 [SECURITY.md](./SECURITY.md) 并通过 `agent@tuniu.com` 私密反馈。

提交 Bug 报告或功能建议时，尽量包含：
- 复现步骤
- 预期行为 vs 实际行为
- Node.js 版本与操作系统信息
