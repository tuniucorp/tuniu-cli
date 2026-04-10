# 途牛 CLI 操作指南

## 概述

途牛 CLI 是将 [途牛开放平台](https://open.tuniu.com/mcp/) 提供的旅行服务封装而成的命令行工具，支持通过 Shell 命令调用门票、酒店、机票、火车票、邮轮、度假产品等相关能力，适用于 AI Agent 集成、自动化脚本及本地调试场景。

## 快速开始

如果你是第一次接触这个项目，推荐先走这 4 步：

```bash
# 1) 安装
npm install -g tuniu-cli@latest

# 2) 配置 API Key
export TUNIU_API_KEY=your_api_key

# 3) 看看有哪些服务
tuniu list

# 4) 试一次真实调用
tuniu call ticket query_cheapest_tickets -a '{"scenic_name":"中山陵"}'
```

如果你更偏向临时使用或在 CI 中调用，也可以直接：

```bash
npx tuniu-cli list
```

常见上手入口：

- 查看所有服务：`tuniu list`
- 查看某个服务的工具：`tuniu list ticket`
- 导出 Schema 给 Agent 初始化：`tuniu schema --output json`
- 安装/更新 Skill：`tuniu skill install`


**术语约定**：
- **命令（command）**：`tuniu` 的一级能力入口，如 `list`、`call`、`schema`
- **服务（server）**：业务域标识，如 `ticket`、`hotel`、`flight`、`train`、`cruise`、`holiday`
- **工具（tool）**：服务下可调用的方法，如 `query_cheapest_tickets`、`searchCruiseList`、`searchHolidayList`
- **工具输入参数（args）**：通过 `-a/--args` 传入的 JSON 字符串
- **Schema**：工具能力定义（包含工具列表、参数结构、必填项）
- **Skill**：本文提到的 Skill 均指 `tuniu-cli` 对应的 `SKILL.md`

**核心特性**：
- 🚀 **统一入口**：使用同一套命令（`list/call/health/schema`）调用不同业务服务，减少“每个服务一套 SDK/调用方式”的维护成本，便于 Agent 和自动化脚本快速复用。
- 🔐 **API Key 认证**：通过环境变量 `TUNIU_API_KEY` 注入凭证，避免在代码中硬编码密钥，降低泄露风险；同时便于在本地、CI、容器环境统一管理认证。
- 📦 **标准协议**：底层兼容 JSON-RPC 2.0，输出支持 JSON / Table / YAML；其中 JSON 统一输出适合 LLM/Agent 解析，Table 适合人工排查，兼顾“机器可读 + 人可读”。
- 🤖 **支持 AI Agent 动态集成**：可通过 `tuniu schema --output json` 动态获取工具能力，通过 `tuniu discovery` 子命令刷新/查看服务状态，帮助 Agent 在运行时适配新增服务。
- 🧩 **支持 Skill 分发与安装**：内置 `SKILL.md` 会在 npm 安装时自动检测并安装到现存的 Agent 目录，一键完成 Skill 注册；也可通过 `tuniu skill install` 显式安装/更新。
- 🐳 **安装便捷灵活**：支持 `npm install -g`、`npx` 安装，适合个人开发、团队协作和生产部署场景。

---

## 一、安装 CLI

### 1.1 前置条件

| 条件 | 说明 |
|------|------|
| **运行环境** | Node.js 18+ |
| **API Key** | 调用途牛服务前需配置 TUNIU_API_KEY，从 [途牛开放平台](https://open.tuniu.com/mcp/login) 注册登录后申请 |
| **网络** | 需能访问途牛服务端点（如 `https://openapi.tuniu.cn/mcp/hotel`） |

### 1.2 安装方式

#### 方式一：npm 全局安装（推荐）

```bash
npm install -g tuniu-cli@latest
```

若提示需要 sudo 权限，则使用下列命令进行安装：

```bash
sudo npm install -g tuniu-cli@latest
```

安装后，可使用下列命令验证安装是否成功：

```bash
tuniu --version
```

若输出类似 `tuniu version 1.0.0`，则说明安装成功。

#### 方式二：npx 临时使用

无需全局安装，直接执行：

```bash
npx tuniu-cli --version
npx tuniu-cli list
```

适合一次性使用或 CI 环境中临时调用。

#### 方式三：从源码安装

```bash
git clone https://github.com/tuniucorp/tuniu-cli.git
cd tuniu-cli
npm install
sudo npm link
```

### 1.3 安装 Skill 到 Agent 目录（可选）

**注意：安装 CLI 与 Skill 注册是两条路径：**

- 通过 npm 安装时，`postinstall` 会自动检测本机已安装的 Agent（例如 `~/.claude/`、`~/.cursor/` 等），并将内置 Skill 安装到对应目录；若未检测到任何 Agent，则默认 `~/.agents/skills/tuniu-cli/`。
- 通过 CLI 命令注册 Skill 时，可用 `tuniu skill install` 显式安装/更新 Skill（更可控，适合 CI、容器或多 Agent 环境）。

如果希望显式安装/更新 Skill（不依赖 npm 自动检测），可执行：

```bash
tuniu skill install
```

该命令**默认仅安装到**：

- `~/.agents/skills/tuniu-cli/`

也支持以下用法：

```bash
# 位置参数：单个 Agent（更简洁）
tuniu skill install claude

# 选项参数：多个 Agent（逗号分隔）或 all
tuniu skill install --agent cursor,claude
tuniu skill install --agent all

# 自定义目录
tuniu skill install --dir ~/.custom-agent/skills
```

---

## 二、配置 CLI

调用途牛服务需要配置 API Key。若您未注册使用过途牛服务，可前往 [途牛开放平台](https://open.tuniu.com/mcp/login) 注册并登录账号，在控制台申请 API Key。将 API Key 配置到环境变量 `TUNIU_API_KEY` 中即可使用完整服务。可配置环境变量示例如下：

| 变量 | 说明 | 示例 |
|------|------|------|
| `TUNIU_API_KEY` | API 认证密钥 | `export TUNIU_API_KEY=your_api_key` |
| `MCP_TIMEOUT` | 请求超时秒数，可选 | `30` |
| `TUNIU_DISCOVERY_ENABLED` | 途牛服务动态发现开关（`true` 开启，`false` 关闭） | `export TUNIU_DISCOVERY_ENABLED=true` |

---

## 三、使用 CLI

### 3.1 快速入门（3 步上手）

以门票查询 CLI 为例：

```bash
# ① 查看有哪些服务
tuniu list

# ② 查看门票服务下的工具列表
tuniu list ticket

# ③ 查询景点门票
tuniu call ticket query_cheapest_tickets -a '{"scenic_name": "中山陵"}'
```

### 3.2 命令分类速查

| 类型 | 命令 | 说明 |
|:-----|------|------|
| 🔍 **查询** | `tuniu list` | 列出所有可用的服务（ticket、hotel、flight、train、cruise、holiday 等） |
| | `tuniu list <server>` | 列出指定服务下的工具清单及简介，如 `tuniu list ticket` 可查看门票相关工具 |
| | `tuniu health` | 检查服务连通性与健康状态，支持指定服务或并行检查全部 |
| 🧭 **服务发现** | `tuniu discovery status` | 查看服务发现启用状态、Discovery URL 及缓存状态 |
| | `tuniu discovery list` | 从 Discovery 获取当前可用服务列表（失败时会自动回退静态配置/缓存） |
| | `tuniu discovery refresh` | 强制刷新 Discovery 缓存 |
| 🚀 **调用** | `tuniu call <server> <tool> -a '<JSON>'` | 调用指定服务的工具，详见下方 3.3 |
| ⚙️ **配置** | `tuniu config init` | 初始化配置文件，在默认路径生成配置文件 `~/.tuniu-mcp/config.json` |
| | `tuniu config show` | 查看当前加载的配置内容 |
| 🧩 **Skill** | `tuniu skill install` | 将内置 `SKILL.md` 安装到 Agent 可识别目录 |
| ℹ️ **帮助** | `tuniu help` | 查看 CLI 使用帮助 |
| | `tuniu help <server> <tool>` | 查看指定工具的功能说明与参数详情 |
| 🔧 **调试** | `tuniu call ... -d` | 调试模式，打印完整请求/响应 |
| | `tuniu schema --output json` | 导出所有工具的能力定义（Schema），供 Agent 或自动化脚本初始化时使用 |

### 3.3 调用工具（核心用法）

`tuniu call` 集成了调用多种途牛服务的功能，命令格式如下：

```bash
tuniu call <server> <tool> --args '<JSON>'
# 或简写
tuniu call <server> <tool> -a '<JSON>'
```

| 参数 | 说明 |
|------|------|
| `server` | 服务名称，如 ticket（门票）、hotel（酒店）、flight（机票）、train（火车票）、cruise（邮轮）、holiday（度假产品） |
| `tool` | 工具名称，如 query_cheapest_tickets、tuniu_hotel_search、searchHolidayList 等 |
| `--args` 或 `-a` | 工具的输入参数，必须是合法的 JSON 字符串 |

**⚠️ 参数注意事项：**

- `--args` 的值必须是 JSON 格式，且用引号包裹，避免 Shell 解析错误
- 中文可直接写入 JSON 中，无需转义
- 无参数时用空对象：`-a '{}'`

**常用服务速查**

| 服务 | 功能 | 可用工具 | 详细说明 |
|------|------|----------|----------|
| `ticket` | 景点门票查询与预订，支持查询票型价格并在线下单 | `query_cheapest_tickets`（门票查询）<br>`create_ticket_order`（创建订单） | [门票服务](https://open.tuniu.com/mcp/docs/apidoc/mcp/ticketMCP.html) |
| `hotel` | 酒店搜索、详情查询与在线预订，支持城市/日期/关键词筛选 | `tuniu_hotel_search`（酒店搜索）<br>`tuniu_hotel_detail`（酒店详情）<br>`tuniu_hotel_create_order`（创建订单） | [酒店服务](https://open.tuniu.com/mcp/docs/apidoc/mcp/hotelMCP.html) |
| `flight` | 国内航班搜索与预订，支持低价/时段/价格区间等 6 种查询模式 | `searchLowestPriceFlight`（航班搜索）<br>`multiCabinDetails`（舱位查询）<br>`getBookingRequiredInfo`（预订信息）<br>`saveOrder`（创建订单）<br>`cancelOrder`（取消订单） | [机票服务](https://open.tuniu.com/mcp/docs/apidoc/mcp/flightMCP.html) |
| `train` | 火车票车次查询与预订，支持搜索车次列表并在线下单 | `searchLowestPriceTrain`（查询车次）<br>`queryTrainDetail`（车次详情）<br>`bookTrain`（预订下单）<br>`queryTrainOrderDetail`（订单详情）<br>`cancelOrder`（取消订单） | [火车票服务](https://open.tuniu.com/mcp/docs/apidoc/mcp/trainMCP.html) |
| `cruise` | 邮轮产品搜索与预订，支持按日期/航线/品牌筛选，兼容"游轮"说法 | `searchCruiseList`（邮轮搜索）<br>`getCruiseProductDetail`（产品详情）<br>`getCruiseBookingRequiredInfo`（预订信息）<br>`saveCruiseOrder`（创建订单） | [邮轮服务](https://open.tuniu.com/mcp/docs/apidoc/mcp/cruiseMCP.html) |
| `holiday` | 度假产品搜索与预订，支持目的地/出游日期/品类筛选，兼容跟团、自助游、自驾游、当地游等表述 | `searchHolidayList`（度假列表搜索）<br>`getHolidayProductDetail`（产品详情与团期日历）<br>`getHolidayBookingRequiredInfo`（预订说明）<br>`saveHolidayOrder`（创建订单） | [度假服务](https://open.tuniu.com/mcp/docs/apidoc/mcp/holidayMCP.html) |

> 建议：Agent 在运行前先执行 `tuniu schema --output json` 获取最新工具参数定义；当服务侧新增/变更工具时，可配合 `tuniu discovery refresh` 做动态更新。

### 3.4 场景示例：

**🎫 门票完整预订流程**

以"查询中山陵门票并下单"为例，展示从查询到下单的完整流程。其他服务（酒店、机票、火车票、邮轮、度假产品）的完整流程请参考上方表格中各服务文档。

**第一步：查询景点门票**

```bash
tuniu call ticket query_cheapest_tickets -a '{"scenic_name": "中山陵"}'
```

返回门票列表，记录结果中的 `productId` 和 `resId`（下单时必需）：

```json
{
  "scenic_name": "南京中山陵",
  "tickets": [
    { "productId": 12345, "resId": "res001", "price": "50", "ticketType": "成人票" }
  ]
}
```

**第二步：创建订单**

将上一步获取的 `productId`（对应 `product_id`）和 `resId`（对应 `resource_id`）传入下单：

```bash
tuniu call ticket create_ticket_order -a '{
  "product_id": 12345,
  "resource_id": "res001",
  "depart_date": "2026-04-01",
  "adult_num": 1,
  "contact_name": "张三",
  "contact_mobile": "***********",
  "tourist_1_name": "张三",
  "tourist_1_mobile": "***********",
  "tourist_1_cert_type": "身份证",
  "tourist_1_cert_no": "*****************"
}'
```

返回订单号与支付链接：

```json
{
  "success": true,
  "orderId": "ORD2026040100001",
  "paymentUrl": "https://m.tuniu.com/u/gt/order/ORD2026040100001?orderType=75",
  "message": "订单创建成功"
}
```

> ⚠️ 下单成功后请将 `paymentUrl` 发给用户，提醒用户点击链接完成支付。

### 3.5 全局选项

可在命令后添加以下选项：

| 选项 | 短选项 | 说明 | 示例 |
|------|--------|------|------|
| `--detail` | `-d` | 调试模式，打印完整请求/响应 | `tuniu call ... -d` |
| `--output` | `-o` | 输出格式：json/table/yaml | `tuniu list -o table` |
| `--profile` | `-p` | 环境配置（默认 production） | `tuniu list -p development` |
| `--config` | `-c` | 指定配置文件路径 | `tuniu config show -c ./config.json` |
| `--timeout` | `-t` | 设置请求超时时间（秒） | `tuniu call ... -t 60` |
| `--version` | `-V` | 显示版本号 | `tuniu -V` |

---

## 四、常见问题

**Q1: 如何获取 API Key？**

前往 [途牛开放平台](https://open.tuniu.com/mcp/login) 注册并登录账号，获取 API Key。具体流程可参考平台文档或联系项目负责人。

**Q2: 提示「未配置 API Key」怎么办？**

确保已设置环境变量：`export TUNIU_API_KEY=your_api_key`。若使用配置文件，需确保其中占位符为 `${TUNIU_API_KEY}`，与代码中的变量名一致。可执行 `tuniu config init --force` 重新初始化配置。

**Q3: 如何更换 API Key？**

```bash
# 将环境变量 TUNIU_API_KEY 覆盖为新的 API Key
export TUNIU_API_KEY=your_new_api_key
```

**Q4: 如何查看工具参数说明？**

以查询门票工具参数为例：

```bash
tuniu help ticket query_cheapest_tickets
```

响应如下：

```bash
query_cheapest_tickets
描述: 查询指定景点的门票详情信息，包括门票的类型和价格等
参数:
  scenic_name (必填): string - 
```

**Q5: 如何做 dry-run 测试？**

```bash
tuniu call ticket query_cheapest_tickets --args '{"scenic_name":"上海迪士尼"}' --dry-run
```

**Q6: 退出码含义？**

| 退出码 | 含义 |
|--------|------|
| 0 | 成功 |
| 101 | 连接失败 |
| 102 | 工具不存在 |
| 103 | 参数错误 |
| 104 | 认证失败 |
| 105 | 超时 |
| 106 | 服务器错误 |
| 107 | 配置错误 |
| 108 | 未配置 API Key（需设置 TUNIU_API_KEY） |
| 199 | 未知错误 |

**Q7: 如何让 AI Agent 使用途牛 CLI？**

推荐按“**准备环境 → 初始化能力 → 动态发现 → 注册 Skill → 工具调用**”五步接入：

1) **准备运行环境**
- 安装 CLI：`npm install -g tuniu-cli`
- 配置 API Key：`export TUNIU_API_KEY=your_api_key`

2) **初始化工具能力**
- 执行：`tuniu schema --output json`
- 作用：让 Agent 获取最新工具列表、参数结构、必填项，用于意图路由和参数补全。

3) **开启动态集成能力（可选但推荐）**
- 执行：`tuniu discovery refresh`（刷新服务列表）
- 执行：`tuniu discovery status` / `tuniu discovery list`（查看发现状态与服务清单）
- 作用：当平台新增服务或工具时，Agent 能在不改代码的情况下更新可用能力。

4) **可选：注册 Skill**
- 执行：`tuniu skill install`
- 默认行为：仅安装到 `~/.agents/skills/tuniu-cli/`。
- 如需安装到指定 Agent / 多个 Agent：`tuniu skill install cursor` 或 `tuniu skill install --agent cursor,claude`
- 如需安装到全部内置支持的 Agent：`tuniu skill install --agent all`
- 说明：对于未内置适配的 Agent，请使用 `tuniu skill install --dir <path>` 安装到目标 Agent 的技能目录。

5) **运行时调用工具**

通过 Python subprocess 示例调用 CLI：

```python
import subprocess, json

result = subprocess.run(
    ["tuniu", "call", "ticket", "query_cheapest_tickets",
     "-a", '{"scenic_name": "中山陵"}', "--output", "json"],
    capture_output=True, text=True
)
data = json.loads(result.stdout)
```

在任意 AI Agent 聊天窗口（如 Claude 终端），也可直接输入自然语言指令，Agent 会自动执行对应的 shell 命令：

> "帮我用途牛命令行工具查这周六上海迪士尼的低价门票"

**Q8: 如何卸载？**

```bash
npm uninstall -g tuniu-cli
```

如需同时移除已安装的 Skill，请手动删除对应 Agent 目录下的 `tuniu-cli` 子目录。

## 贡献

## 许可证

[MIT](LICENSE)

## 联系我们

- Email: agent@tuniu.com
---

<p align="center">
  Made with ❤️ by Tuniu Team
</p>
