# Changelog

本项目的所有重要变更记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [1.0.6] - 2026-04-09

### Added
- 新增 `tuniu skill version` 命令：遍历所有内置 Agent 目录，查看已安装的 skill 版本信息；检测到多个安装时列出全部，版本不一致时提示更新
- 新增 skill 动态下载能力：`tuniu skill install` 优先从途牛开放平台下载最新 skill，失败时自动 fallback 到内置文件

### Changed
- 优化 `tuniu skill install` 输出：简化提示信息，详细使用说明移至 `--help`
- 度假服务（`holiday`）示例参数更新：`destinationName` 改为 `keyWord`

## [1.0.5] - 2026-04-08

### Changed
- `SKILL.md` 内置版本升至 `1.0.1`
- 优化度假服务（`holiday`）参数说明：`searchHolidayList` 无单一必填参数，建议传 `keyWord` 或结构化条件，出游日期需成对传入
- 邮轮服务（`cruise`）补充三条 LLM 行为约束：
  - 筛选说明：仅有日期时直接查询，不为补齐可选条件而额外追问
  - 翻页说明：翻页时保持筛选条件不变，仅更新 `pageNum`
  - 列表展示：`data.rows` 需逐条展示，不应只列少量样例
- `getCruiseProductDetail` 参数规则强化：所有参数须来自同一条 `searchCruiseList` 返回记录，新增团期规则说明（需展示全部可售团期）

## [1.0.4] - 2026-04-03

### Added
- npm 安装时新增 `postinstall`：自动检测本机已安装的 Agent 目录并写入 Skill；若未检测到任何 Agent，则回退写入 `~/.agents/skills/tuniu-cli/`
- `skill` 内置支持的 Agent 扩展为：`agents,claude,cursor,qoder,codex,opencode,openclaw,copaw`
- 接入 holiday（度假产品） MCP 服务

### Security
- `postinstall` 安装前校验 `SKILL.md` 与 `scripts/.skill.sha256`（发布包由 `prepack` 生成）一致，不一致则跳过安装，降低被替换文件静默落盘的风险
- `postinstall` 仅从包内路径解析 `SKILL.md`，不再回退到 `process.cwd()`，避免误用工作目录下同名的非发布文件

### Changed
- 优化 `tuniu skill install` 默认行为：不传参数时仅安装到 `~/.agents/skills/tuniu-cli/`，降低侵入性
- `tuniu skill install` 支持位置参数（单个 Agent），并支持 `--agent all` 覆盖所有内置支持的 Agent 目录

### Supported Services
- holiday（度假产品）

## [1.0.3] - 2026-04-01

### Changed
- 降级 `commander`、`eslint`、`vitest` 等工具链版本，减少 Node 18 环境下的 engine 告警，提升开箱兼容性
- 将 Agent 接入说明收敛为统一的 `SKILL.md` 分发方案，精简对外发布物

### Added
- 新增 `tuniu skill install` 命令，支持将内置 Skill 安装到 Cursor、Claude、OpenClaw、CoPaw、Agents 等主流 Agent 目录
- 新增 `tests/skill.test.ts`，补齐 Skill 安装路径解析与参数处理测试

## [1.0.2] - 2026-03-26

### Added
- 开源发布链路加固：补齐 `LICENSE`、`CHANGELOG.md`、`CONTRIBUTING.md`、`SECURITY.md`
- 新增 GitHub Actions CI，覆盖 lint、typecheck、test、build 与 `npm pack --dry-run`
- 新增 ESLint v9 flat config，并将 lint 纳入标准开发流程
- 发布产物补充 `agent-manifest.json` 与文档文件，提升 Agent 集成可用性

### Changed
- 增强 `npm pack` 与发布前校验流程，确保 `dist/` 正确进入 npm 包
- 对齐 README、发布说明和配置示例，降低外部用户首次接入门槛

## [1.0.1] - 2026-03-25

### Added
- 新增 `discovery` 命令：MCP 服务动态发现与缓存管理
- Discovery 模块：动态发现 MCP 服务 + 本地缓存 + 降级策略

## [1.0.0] - 2026-03-13

### Added
- CLI 核心框架：基于 Commander 的命令行解析
- `list` 命令：列出 MCP 服务与工具
- `call` 命令：调用 MCP 工具（支持 JSON 参数、dry-run、超时控制）
- `health` 命令：MCP 服务健康检查（支持并行）
- `schema` 命令：导出工具 Schema（支持 JSON/Markdown/YAML）
- `config` 命令：配置管理（init/show/set）
- `completion` 命令：Bash/Zsh/Fish 自动补全脚本生成与安装
- `help` 命令：分层帮助系统（命令/服务/工具级）
- 多 Profile 支持：production / development 环境切换
- Agent 集成支持：agent-manifest.json 元数据、意图映射
- ESLint 代码规范检查（ESLint v9 flat config + typescript-eslint）
- 单元测试（Vitest，129 个测试用例）
- Docker 支持（Dockerfile + docker-compose）

### Supported Services
- ticket（门票）
- hotel（酒店）
- flight（机票）
- train（火车票）
- cruise（邮轮）
