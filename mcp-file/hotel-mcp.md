# 酒店

## 概述

途牛酒店 MCP 服务提供基于 MCP 协议的酒店搜索、详情查询和在线预订功能，支持集成到 AI 助手、智能客服等应用中。

**服务地址**: https://openapi.tuniu.cn/mcp/hotel

**核心特性**:

- 🚀 无状态设计，无需维护会话
- 🔐 基于 API Key 认证
- 💾 智能缓存，提升响应速度
- 📦 完整的预订流程（搜索→详情→下单）

## 一、快速开始

### 1.1 获取认证凭证

访问 途牛开放平台 注册并创建应用，获取：

- **API Key**: 应用密钥（用于 apiKey 请求头）

### 1.2 测试连接

```bash
# 健康检查
curl -s "https://openapi.tuniu.cn/mcp/hotel/health" \
  -H "apiKey: YOUR_API_KEY"
```

预期返回：

```json
{
  "status": "healthy",
  "timestamp": "2026-02-11T10:30:00.000Z",
  "stateless": true
}
```

### 1.3 第一个 API 调用

搜索北京的酒店：

```bash
curl -X POST "https://openapi.tuniu.cn/mcp/hotel" \
  -H "Content-Type: application/json" \
  -H "apiKey: YOUR_API_KEY" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "tuniu_hotel_search",
      "arguments": {
        "cityName": "北京",
        "checkIn": "2026-03-01",
        "checkOut": "2026-03-03"
      }
    }
  }'
```

响应解析：

```javascript
const response = await fetch(...);
const result = await response.json();

// ⚠️ 重要：result.content[0].text 是 JSON 字符串，需要再次解析
const data = JSON.parse(result.result.content[0].text);

console.log('酒店列表:', data.hotels);
console.log('查询ID（用于翻页）:', data.queryId);
```

## 二、常用 Client 配置

### 2.1 Cursor IDE

**配置路径**：Cursor Settings → Tools & MCP → 新增

**配置示例**：

```json
{
  "mcpServers": {
    "tuniu-hotel": {
      "url": "https://openapi.tuniu.cn/mcp/hotel",
      "transport": "http",
      "headers": {
        "apiKey": "YOUR_API_KEY"
      }
    }
  }
}
```

**使用方式**：

- 在 Cursor Chat 中询问："查找上海浦东的酒店"
- AI 会调用 MCP 工具并返回结果

### 2.2 OpenClaw

**OpenClaw 配置**： 从 clawhub 安装 skill，打开 terminal 运行以下命令

```bash
npx clawhub@latest install tuniu-hotel

# sh-5.2# npx clawhub@latest install tuniu-hotel
# ✔ OK. Installed tuniu-hotel -> /root/.openclaw/workspace/skills/tuniu-hotel
```

安装完成后在聊天交互界面提供 apiKey 即可进行酒店搜索和预订

### 2.3 CoPaw

**配置路径**：侧边栏：智能体 → MCP → 创建客户端

**配置示例**：

```json
{
  "mcpServers": {
    "tuniu-hotel": {
      "url": "https://openapi.tuniu.cn/mcp/hotel",
      "transport": "http",
      "headers": {
        "apiKey": "YOUR_API_KEY"
      }
    }
  }
}
```

**使用方式**：在 CoPaw 中询问："查找上海浦东的酒店"

### 2.4 LobsterAI IDE

**配置路径**：LobsterAI IDE 左侧目录 MCP → 自定义 → 新增

**配置示例**：

| 字段 | 值 |
|------|------|
| 服务名称 | 途牛酒店 MCP 服务 |
| 描述 | 途牛酒店 MCP 服务提供基于 MCP 协议的酒店搜索、详情查询和在线预订功能 |
| 传输类型 | HTTP流式传输 |
| URL | `https://openapi.tuniu.cn/mcp/hotel` |
| 请求头 | apiKey - YOUR_API_KEY |

**使用方式**：

- 在 LobsterAI Chat 中询问："查找上海浦东的酒店"
- AI 会调用 MCP 工具并返回结果

## 三、Tools 列表

### 3.1 tuniu_hotel_search（酒店搜索）

**功能**: 根据城市、日期等条件搜索酒店，支持翻页。

**参数**:

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| cityName | string | ✅ 首页 | 城市名称（如"北京"） |
| checkIn | string | ⚠️ | 入住日期 YYYY-MM-DD（默认今天） |
| checkOut | string | ⚠️ | 离店日期 YYYY-MM-DD（默认明天） |
| keyword | string | ❌ | 关键词（酒店名、地标） |
| prices | string | ❌ | 价格区间（如"300-800"） |
| adultNum | number | ❌ | 成人数（默认2） |
| childNum | number | ❌ | 儿童数（默认0） |
| **翻页参数** | | | |
| queryId | string | ✅ 翻页 | 首次搜索返回的ID |
| pageNum | number | ✅ 翻页 | 页码（从2开始） |

**请求示例**:

```json
{
  "name": "tuniu_hotel_search",
  "arguments": {
    "cityName": "北京",
    "checkIn": "2026-03-01",
    "checkOut": "2026-03-03",
    "keyword": "三里屯",
    "prices": "300-800"
  }
}
```

**响应字段**:

```javascript
{
  success: boolean,
  queryId: string,           // 用于翻页
  totalPageNum: number,      // 总页数
  currentPageNum: number,    // 当前页
  hotels: [{
    hotelId: number,         // 酒店ID
    hotelName: string,       // 酒店名称
    starName: string,        // 星级
    address: string,         // 地址
    business: string,        // 商圈
    brandName: string,       // 品牌
    commentScore: number,    // 评分
    lowestPrice: string,     // 最低价格（元）
  }]
}
```

**翻页示例**:

```json
{
  "name": "tuniu_hotel_search",
  "arguments": {
    "queryId": "返回的queryId",
    "pageNum": 2
  }
}
```

### 3.2 tuniu_hotel_detail（酒店详情）

**功能**: 获取酒店详情、房型和报价信息。

**参数**:

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| hotelId | number | ⚠️ 二选一 | 酒店ID |
| hotelName | string | ⚠️ 二选一 | 酒店名称 |
| checkIn | string | ⚠️ | 入住日期 YYYY-MM-DD |
| checkOut | string | ⚠️ | 离店日期 YYYY-MM-DD |
| roomNum | number | ❌ | 房间数（默认1） |
| adultNum | number | ❌ | 成人数（默认2） |

**请求示例**:

```json
{
  "name": "tuniu_hotel_detail",
  "arguments": {
    "hotelId": 12345,
    "checkIn": "2026-03-01",
    "checkOut": "2026-03-03"
  }
}
```

**响应字段**:

```javascript
{
  hotelId: number,
  hotelName: string,
  starName: string,
  address: string,
  commentScore: number,
  roomTypes: [{
    roomTypeId: string,      // ⚠️ 下单时使用
    roomTypeName: string,
    bedType: string,
    maxOccupancy: number,
    roomSize: string,
    ratePlans: [{
      ratePlanName: string,
      rmbPrices: string,     // 价格（元）
      preBookParam: string,  // ⚠️ 下单必需参数（有效期30分钟）
      mealText: string,      // 餐食信息
      cancelDesc: string,    // 取消政策
      count: number,         // 剩余库存
    }]
  }]
}
```

> **重要提示**: preBookParam 是下单时的必需参数，有效期30分钟，超时需重新查询。

### 3.3 tuniu_hotel_create_order（创建订单）

**功能**: 创建酒店预订订单，系统会自动验价。

**前置条件**: ⚠️ 必须先调用 tuniu_hotel_detail 获取最新的 preBookParam

**参数**:

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| hotelId | string | ✅ | 酒店ID（字符串） |
| roomId | string | ✅ | 房型ID（来自详情的roomTypeId） |
| preBookParam | string | ✅ | 预订参数（来自详情的preBookParam） |
| checkInDate | string | ✅ | 入住日期 YYYY-MM-DD |
| checkOutDate | string | ✅ | 离店日期 YYYY-MM-DD |
| roomCount | number | ✅ | 房间数量 |
| roomGuests | array | ✅ | 入住人信息 |
| contactName | string | ✅ | 联系人姓名 |
| contactPhone | string | ✅ | 联系人电话 |
| contactEmail | string | ❌ | 联系人邮箱 |

**roomGuests 格式**:

```json
[
  {
    "guests": [
      {
        "firstName": "三",
        "lastName": "张"
      }
    ]
  }
]
```

**请求示例**:

```json
{
  "name": "tuniu_hotel_create_order",
  "arguments": {
    "hotelId": "12345",
    "roomId": "room001",
    "preBookParam": "eyJ0eXAiOiJKV1Qi...",
    "checkInDate": "2026-03-01",
    "checkOutDate": "2026-03-03",
    "roomCount": 1,
    "roomGuests": [
      {
        "guests": [
          {"firstName": "三", "lastName": "张"}
        ]
      }
    ],
    "contactName": "张三",
    "contactPhone": "13800138000"
  }
}
```

**请求头要求**: 与其他接口相同，仅需要 apiKey 请求头。

**响应字段**:

```javascript
{
  success: boolean,
  orderId: string,           // 订单号
  confirmationNumber: string, // 确认号
  paymentUrl: string,        // 支付链接（引导用户完成支付）
  checkInDate: string,
  checkOutDate: string,
  contactName: string,
  contactPhone: string,
}
```

## 四、完整预订流程

### 4.1 流程图

```
搜索酒店 → 选择酒店 → 查看详情 → 选择房型 → 创建订单 → 支付
   ↓           ↓           ↓           ↓           ↓
queryId    hotelId   roomTypeId  preBookParam  orderId
                                 (有效期30分钟)
```

### 4.2 代码示例

```javascript
// 步骤1: 搜索酒店
const searchResult = await callTool('tuniu_hotel_search', {
  cityName: '北京',
  checkIn: '2026-03-01',
  checkOut: '2026-03-03',
});

const hotelId = searchResult.hotels[0].hotelId;

// 步骤2: 查看详情
const detailResult = await callTool('tuniu_hotel_detail', {
  hotelId: hotelId,
  checkIn: '2026-03-01',
  checkOut: '2026-03-03',
});

const roomType = detailResult.roomTypes[0];
const ratePlan = roomType.ratePlans[0];

// 步骤3: 创建订单
const orderResult = await callTool('tuniu_hotel_create_order', {
  hotelId: String(hotelId),
  roomId: roomType.roomTypeId,
  preBookParam: ratePlan.preBookParam,
  checkInDate: '2026-03-01',
  checkOutDate: '2026-03-03',
  roomCount: 1,
  roomGuests: [
    { guests: [{ firstName: '三', lastName: '张' }] }
  ],
  contactName: '张三',
  contactPhone: '13800138000',
});

console.log('订单号:', orderResult.orderId);
console.log('支付链接:', orderResult.paymentUrl);
```

## 五、常见问题

**Q1: 是否需要先调用 initialize？**

A: 不需要。本服务采用无状态设计，可以直接调用工具。

**Q2: preBookParam 的有效期是多久？**

A: 30分钟。建议在下单前重新调用详情接口获取最新报价。

**Q3: 如何处理"报价信息未找到或已失效"错误？**

A: 说明 preBookParam 已过期，需要重新调用 tuniu_hotel_detail 获取最新的 preBookParam。

**Q4: 支持哪些日期格式？**

A: 仅支持 YYYY-MM-DD 格式（如 2026-03-01）。

**Q5: 如何翻页查询？**

A: 首次搜索返回 queryId，翻页时传入 queryId 和 pageNum（从2开始）。

**Q6: 如何处理认证错误？**

A: 检查 apiKey 请求头中的 API Key 是否正确。

**Q7: 支付流程是怎样的？**

A: 下单成功后会返回 paymentUrl，用户需访问该链接在途牛官网完成支付。
