# 度假产品

## 概述

途牛度假产品 MCP 服务提供基于 MCP 协议的度假产品搜索、团期查询和在线预订功能，支持集成到 AI 助手、智能客服等应用中。

**服务地址**: `https://openapi.tuniu.cn/mcp/holiday`

**核心特性**:

- 无状态设计，无需维护会话
- 基于 API Key 认证
- 智能缓存，提升响应速度
- 完整的预订流程（搜索 -> 详情 -> 团期选择 -> 下单）
- 团期价格日历，支持多出发日期选择
- 兼容“度假产品/旅游产品/跟团产品/自助产品/自驾产品/当地游产品/当地参团产品”等表述

## 一、快速开始

### 1.1 获取认证凭证

访问 <a target="_blank" href="/mcp/apikeys?title=API+Keys">途牛开放平台</a> 注册并创建应用，获取：

- **API Key**: 应用密钥（用于 `apiKey` 请求头）

### 1.2 第一个 API 调用

搜索“去三亚、未来 3 天”的度假产品：

```bash
curl -X POST "https://openapi.tuniu.cn/mcp/holiday" \
  -H "Content-Type: application/json" \
  -H "apiKey: YOUR_API_KEY" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "searchHolidayList",
      "arguments": {
        "destinationName": "三亚",
        "departsDateBegin": "2026-03-17",
        "departsDateEnd": "2026-03-20"
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

console.log("度假产品列表:", data.data.rows);
console.log("总数:", data.data.count);
```

客户端配置（Cursor、OpenClaw、CoPaw 等）请参考 [常用 Client 配置](/guide/client-config)。

---

## 二、Tools 列表

### 2.1 searchHolidayList（度假产品列表搜索）

功能：根据目的地搜索度假产品，支持日期范围、产品类型、品牌、价格区间等筛选，并支持分页查询。

#### 请求说明

参数表：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `destinationName` | string | ✅ | 目的地城市名称（到达城市），仅支持单个城市，如 `三亚` |
| `departsDateBegin` | string | ❌ | 出游日期筛选起始，格式 `yyyy-MM-dd`（与 `departsDateEnd` 成对出现） |
| `departsDateEnd` | string | ❌ | 出游日期筛选结束，格式 `yyyy-MM-dd` |
| `departCityName` | string | ❌ | 出发城市名称 |
| `tourDay` | number | ❌ | 行程天数 |
| `queryTypeName` | string | ❌ | 产品品类/线路类型，只支持：`自驾游` / `自助游` / `跟团` |
| `brandTypeName` | string | ❌ | 产品品牌，只支持枚举：`牛人专线` / `牛专` / `牛人严选` / `严选` / `乐开花爸妈游` / `瓜果亲子游` |
| `conditions` | string[] | ❌ | 产品标签名称数组，如 `["亲子游","美食"]` |
| `lowPrice` | number | ❌ | 最低价格（人民币元） |
| `highPrice` | number | ❌ | 最高价格（人民币元） |
| `pageNum` | number | ❌ | 页码（从 1 开始，默认 1） |

#### 重要提示

- `destinationName` 必填，不能为空
- `departsDateBegin`/`departsDateEnd`：若提供任意一个，则必须同时提供两个，并校验日期范围合法性
- `queryTypeName` 仅接受精确枚举：`自驾游`、`自助游`、`跟团`
- 返回结果中部分字段仅用于联动下游详情接口，不要向用户展示（见下文 data.rows 字段说明）

#### 响应说明

返回统一结构（示例）：

```json
{
  "success": true,
  "errorCode": 0,
  "msg": "查询成功",
  "data": {
    "count": 22,
    "rows": [
      {
        "productId": "321596028",
        "productName": "<郑州1晚2日自驾游+中原文化深度体验>",
        "isNewproduct": "新品",
        "classBrandId": 8,
        "proMode": 1,
        "tourDay": 2,
        "departsDateBegin": "2026-03-18",
        "departsDateEnd": "2026-03-26",
        "departCityName": ["南京"],
        "departCityCode": [1602],
        "price": 33.0,
        "satisfaction": 0,
        "peopleNum": 1,
        "picUrl": "https://m.tuniucdn.com/...",
        "customConditionName": ["一人出行", "历史文化"],
        "brandTypeName": "..."
      }
    ]
  }
}
```

data 结构：

| 字段 | 类型 | 说明 |
|------|------|------|
| `count` | number | 符合筛选条件的产品总数 |
| `rows` | array | 当前页产品列表 |

data.rows[] 字段说明：

| 字段名 | 类型 | 说明 | 是否展示给用户 |
|--------|------|------|----------------|
| `productId` | string | 产品 ID | ✅ |
| `productName` | string | 产品名称 | ✅ |
| `isNewproduct` | string | 是否新品 | ✅ |
| `departCityName` | array | 出发城市名称数组 | ✅ |
| `price` | number | 起价（人民币元） | ✅ |
| `tourDay` | number | 行程天数 | ✅ |
| `satisfaction` | number | 满意度/评分 | ✅ |
| `peopleNum` | number | 出游人数 | ✅ |
| `picUrl` | string | 产品缩略图 | ✅ |
| `customConditionName` | array | 产品标签 | ✅ |
| `brandTypeName` | string | 产品品牌名称 | ✅ |
| `departsDateBegin` | string | 内部字段（联动详情接口用） | ❌ |
| `departsDateEnd` | string | 内部字段（联动详情接口用） | ❌ |
| `departCityCode` | array | 内部字段（必须原样传递给详情接口） | ❌ |
| `classBrandId` | number | 内部字段（作为详情接口 classBrandParentId 传入） | ❌ |
| `proMode` | number | 内部字段（作为详情接口 proMode 传入） | ❌ |

#### 请求示例

```json
// 查询3天内去三亚的度假产品（假设当前日期为 2026-03-12）
{
  "destinationName": "三亚",
  "departsDateBegin": "2026-03-12",
  "departsDateEnd": "2026-03-14"
}

// 查询明天到后天去杭州的旅游产品，指定上海出发
{
  "destinationName": "杭州",
  "departsDateBegin": "2026-03-13",
  "departsDateEnd": "2026-03-14",
  "departCityName": "上海"
}

// 查询去云南的跟团产品
{
  "destinationName": "云南",
  "departsDateBegin": "2026-03-15",
  "departsDateEnd": "2026-03-20",
  "queryTypeName": "跟团"
}

// 分页查询
{
  "destinationName": "海南",
  "departsDateBegin": "2026-03-12",
  "departsDateEnd": "2026-03-14",
  "pageNum": 2
}
```

---

### 2.2 getHolidayProductDetail（产品详情查询）

功能：查询指定度假产品的详细信息，返回下单所需的关键字段与团期价格日历。

#### 请求说明

**前置条件**：必须先调用 `searchHolidayList` 获取产品列表，再从返回的某条 `data.rows[]` 中取参数调用本工具。

**参数来源**：所有入参必须从列表结果拿到，不可自行构造。

参数表：

| 参数 | 类型 | 必需 | 说明 | 来源字段 |
|------|------|------|------|----------|
| `productId` | string | ✅ | 产品 ID | `data.rows[].productId` |
| `departsDateBegin` | string | ❌ | 出游日期范围起始（可选：仅当列表行返回了该字段时才传；且需与 `departsDateEnd` 成对出现） | `data.rows[].departsDateBegin` |
| `departsDateEnd` | string | ❌ | 出游日期范围结束（可选：仅当列表行返回了该字段时才传；且需与 `departsDateBegin` 成对出现） | `data.rows[].departsDateEnd` |
| `departCityCode` | array | ✅ | 出发城市代码数组（必须原样传递） | `data.rows[].departCityCode` |
| `classBrandParentId` | number | ✅ | 品牌父级 ID | `data.rows[].classBrandId` |
| `proMode` | number | ✅ | 采购方式 | `data.rows[].proMode` |

#### 重要提示

- `departCityCode` 必须保持数组格式（如 `[1602]` 或 `[1602,1603]`），不要提取单个元素、不要改类型
- 传参必须与列表结果完全一致
- `departsDateBegin` / `departsDateEnd`：
  - 列表行缺失该字段时，无需传入
  - 若传入任意一个，则另一个也必须同时传入，并与列表行完全一致
- 团期价格日历：若 `productPriceCalendar.count=0` 或 `productPriceCalendar.rows` 为空，表示暂无可售团期，应明确告知用户并停止下单/团期选择
- 查询结果会被缓存 5 分钟

#### 响应说明

返回结构（示例）：

```json
{
  "success": true,
  "errorCode": 0,
  "msg": "",
  "traceId": "uuid-string",
  "data": {
    "productId": "321619424",
    "departureCityName": "南京",
    "duration": 5,
    "productNight": 4,
    "productPriceCalendar": {
      "count": 15,
      "rows": [
        {
          "departDate": "2026-05-01",
          "tuniuPrice": 2999.0,
          "tuniuChildPrice": 1999.0,
          "bookCityCode": 1602,
          "departCityCode": 1602,
          "backCityCode": 1602
        }
      ]
    }
  }
}
```

下单关键字段：

| 字段名 | 类型 | 说明 | 下单用途 |
|--------|------|------|----------|
| `productId` | string | 产品 ID | `saveHolidayOrder.productId` |
| `departureCityName` | string | 出发城市名称 | `saveHolidayOrder.departCityName` |
| `duration` | number | 行程天数 | `saveHolidayOrder.duration` |
| `productNight` | number 或 null | 晚数（半日游可能为 0 或空） | `saveHolidayOrder.night` |
| `productPriceCalendar` | object | 团期价格日历 | 选择 `departDate` |

团期价格日历字段（productPriceCalendar.rows[]）：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `departDate` | string | 出发日期（用户选择后用于下单） |
| `tuniuPrice` | number | 成人价格（人民币元） |
| `tuniuChildPrice` | number | 儿童价格（人民币元；为 0 表示不支持儿童价） |
| `bookCityCode` | number | 预订城市代码 |
| `departCityCode` | number | 出发城市代码 |
| `backCityCode` | number | 返回城市代码 |

价格展示规则：

| `tuniuPrice` | `tuniuChildPrice` | 展示规则 |
|------------|-----------------|----------|
| > 0 | = 0 | 仅展示成人价，不展示儿童价 |
| = 0 | > 0 | 将儿童价视为参考价，提醒以实际下单为准 |
| = 0 | = 0 | 过滤该团期，不向用户展示 |
| > 0 | > 0 | 同时展示成人价和儿童价 |

#### 行程概览展示（journeySummary，如存在）

- 若返回包含 `journeySummary`，应按 `journeySummary[].day` 逐条展示“第N天 + 标题（journeySummary[].title）”及当日行程内容。
- 遍历 `journeySummary[].moduleList`，根据 `moduleType` 提取对应展示内容（酒店：hotel，景点：scenic，餐饮：food，购物：shopping，活动：activity，提醒：reminder，航班：flight）。
- 在保证准确和完整的前提下解析出完整行程概览；文本中若含 HTML，应转为可读纯文本再展示（不要原样输出 HTML 标签）。
- `moduleType=activity`：优先展示 `description`（HTML 转纯文本）；可合并抵离港时间、活动说明（如有）。
- `moduleType=hotel`：展示 `hotelList[].title` 等住宿信息。
- `moduleType=food`：解析 `food.hasList`（早餐/午餐/晚餐/夜宵/下午茶，可能仅返回其中部分餐型）；生成对客文案时按统一规则解释含餐口径：
  - `has` 表示成人是否含餐，`hasChild` 表示儿童是否含餐；为空按 0；
  - `1/1`=成人、儿童已含；`0/0`=成人、儿童自理；`1/0`=成人已含、儿童自理；`0/1`=成人自理、儿童已含。
- `moduleType=scenic`：展示 `scenicList[].content`、`type`（如是否含门票）及图片链接（如有）。
- `moduleType=reminder`：展示 `remind.type` 与 `remind.content`（HTML 转纯文本）。
- `moduleType=shopping/flight`：按返回结构完整展示购物或航班关键信息；若字段为空可明确“未提供详细信息”。
- 未知 `moduleType`：保留原字段做兜底展示，不丢失行程信息。

#### 请求示例

```json
{
  "productId": "321619424",
  "departCityCode": [1602, 1603],
  "classBrandParentId": 12,
  "proMode": 1
}
```

如列表行返回了 `departsDateBegin/departsDateEnd`，请在请求中补充并一并传入（必须成对）。

---

### 2.3 getHolidayBookingRequiredInfo（获取预订所需信息）

功能：获取度假产品预订所需填写的标准化信息说明与合规提示文案。

#### 请求说明

无参数，`arguments` 传空对象即可。

#### 响应说明

返回一段标准化中文说明文本，内容位于 `result.content[0].text`（非 JSON），包含：

- 预订所需基础信息（乘客信息、联系信息）
- 填写示例
- 重要提示
- 合规与隐私说明（协议与隐私政策链接）

#### 请求示例

```json
{
  "name": "getHolidayBookingRequiredInfo",
  "arguments": {}
}
```

---

### 2.4 saveHolidayOrder（提交度假产品预订订单）

功能：创建度假产品预订订单。

#### 前置条件

- 必须先调用 `getHolidayProductDetail`
- 建议将 `getHolidayProductDetail` 返回的 `traceId` 传入本工具
- 关键参数必须从详情接口返回结果获取
- `departDate` 必须来自团期价格日历中的某个可选日期

#### 请求参数

| 参数 | 类型 | 必需 | 说明 | 来源 |
|------|------|------|------|------|
| `productId` | string | ✅ | 产品 ID | `getHolidayProductDetail.data.productId` |
| `departDate` | string | ✅ | 出发日期（团期选择） | `data.productPriceCalendar.rows[].departDate` |
| `departCityName` | string | ✅ | 出发城市名称 | `getHolidayProductDetail.data.departureCityName` |
| `duration` | number | ✅ | 行程天数 | `getHolidayProductDetail.data.duration` |
| `night` | number 或 null | ❌ | 晚数（允许为 0 或空；半日游可能为 0/空） | `getHolidayProductDetail.data.productNight` |
| `tourists` | list[dict] | ✅ | 乘客信息列表 | 用户提供 |
| `contactTourist` | dict | ❌ | 联系人信息（不填则使用第一个乘客姓名/电话） | 用户提供 |
| `traceId` | string | ❌ | 链路追踪 ID | 建议传入详情接口的 `traceId` |

`tourists`（乘客）字段说明：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 姓名 |
| `idType` | string | ✅ | 证件类型（如：`身份证`、`因私护照` 等） |
| `idNumber` | string | ✅ | 证件号码 |
| `mobile` | string | ✅ | 手机号 |
| `type` | string | ❌ | 乘客类型：`成人` / `儿童` / `婴儿`（不填则按生日自动判断） |
| `psptEndDate` | string | ❌ | 证件有效期，格式 `yyyy-MM-dd`（非身份证必填） |
| `sex` | number | ❌ | 性别：1-男 0-女 9-未知（非身份证必填/可选） |
| `birthday` | string | ❌ | 生日，格式 `yyyy-MM-dd`（非身份证必填/可选） |

`contactTourist`（联系人）字段说明：

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 联系人姓名（不填则使用第一个乘客姓名） |
| `mobile` | string | 联系人手机号（不填则使用第一个乘客电话/手机号） |
| `email` | string | 邮箱地址（选填） |

#### 响应说明

成功响应：

```json
{
  "success": true,
  "errorCode": 0,
  "msg": "下单成功",
  "data": {
    "orderId": "20260320123456789",
    "orderDetailUrl": "https://m.tuniu.com/u/gt/order/20260320123456789"
  },
  "traceId": "uuid-string"
}
```

失败响应：

```json
{
  "success": false,
  "errorCode": -1,
  "msg": "错误信息描述",
  "traceId": "uuid-string"
}
```

#### 请求示例

```json
{
  "productId": "321619424",
  "departDate": "2026-05-01",
  "departCityName": "南京",
  "duration": 5,
  "night": 4,
  "tourists": [
    {
      "name": "张三",
      "idType": "身份证",
      "idNumber": "110101199003075412",
      "mobile": "13800138000",
      "type": "成人"
    }
  ],
  "contactTourist": {
    "name": "张三",
    "mobile": "13800138000",
    "email": "zhangsan@example.com"
  },
  "traceId": "from-getHolidayProductDetail-traceId"
}
```

---

## 三、完整预订流程

### 3.1 流程图

```text
搜索度假产品 -> 查看产品详情 -> 选择团期 ->（建议查看预订信息）-> 创建订单
   ↓              ↓                 ↓                     ↓             ↓
产品列表       productId         团期日历            必填信息文案        orderId
```

### 3.2 代码示例

```javascript
// 步骤 1: 搜索度假产品
const searchResult = await callTool("searchHolidayList", {
  destinationName: "三亚",
  departsDateBegin: "2026-03-17",
  departsDateEnd: "2026-03-20",
});

// 选择第一个产品
const product = searchResult.data.rows[0];

// 步骤 2: 查看产品详情（参数必须原样从列表结果取）
const detailArgs = {
  productId: product.productId,
  departCityCode: product.departCityCode, // ⚠️ 必须原样传递数组
  classBrandParentId: product.classBrandId,
  proMode: product.proMode,
};
// departsDateBegin / departsDateEnd 为可选：仅当列表行返回了这两个字段时才传入
if (product.departsDateBegin && product.departsDateEnd) {
  detailArgs.departsDateBegin = product.departsDateBegin;
  detailArgs.departsDateEnd = product.departsDateEnd;
}
const detailResult = await callTool("getHolidayProductDetail", detailArgs);

// 步骤 3: 展示团期价格日历，并让用户选择出发日期
const calendar = detailResult.data.productPriceCalendar;
console.log(`共有 ${calendar.count} 个团期可选`);

calendar.rows.forEach(row => {
  // 仅展示逻辑示例：tuniuChildPrice=0 时不展示儿童价
  if (row.tuniuPrice > 0 && row.tuniuChildPrice === 0) {
    console.log(`${row.departDate}: 成人价 ¥${row.tuniuPrice}`);
  } else {
    console.log(
      `${row.departDate}: 成人价 ¥${row.tuniuPrice}, 儿童价 ¥${row.tuniuChildPrice}`
    );
  }
});

const selectedDepartDate = "2026-05-01"; // 用户选择的 departDate

// 步骤 4: 创建订单
const orderResult = await callTool("saveHolidayOrder", {
  productId: detailResult.data.productId,
  departDate: selectedDepartDate,
  departCityName: detailResult.data.departureCityName,
  duration: detailResult.data.duration,
  night: detailResult.data.productNight,
  tourists: [
    {
      name: "李四",
      idType: "身份证",
      idNumber: "310101199001011234",
      mobile: "13800138000",
      type: "成人",
    },
  ],
  contactTourist: {
    name: "张三",
    mobile: "13800138000",
    email: "zhangsan@example.com",
  },
  traceId: detailResult.traceId,
});

console.log("订单号:", orderResult.data.orderId);
console.log("订单详情链接:", orderResult.data.orderDetailUrl);
console.log("你也可以通过途牛 App 查看订单详情。");
```

---

## 四、常见问题

### Q1: 是否需要先调用 initialize？

A: 不需要。本服务采用无状态设计，可以直接调用工具。

### Q2: `destinationName` 为什么是必填？

A: `searchHolidayList` 的目的地筛选由 `destinationName` 完成。该参数不能为空，否则会返回参数校验错误。

### Q3: `departsDateBegin/departsDateEnd` 和 `departDate` 有什么区别？

A:

- `departsDateBegin/departsDateEnd`：用于筛选“在此期间有班次的产品”（列表查询条件）
- `departDate`：用于下单的具体团期出发日期（来自产品详情 `productPriceCalendar.rows[].departDate`）

### Q4: 团期选择时儿童价怎么处理？

A:

- 当 `tuniuChildPrice = 0` 时，该团期不支持儿童价：展示时仅展示成人价，不要展示儿童价
- 当成人/儿童价格均为 0 时，该团期视为无有效价格：不向用户展示

### Q5: `departCityCode` 为什么必须原样传递数组？

A: 下游详情接口的缓存 Key 和请求参数要求 `departCityCode` 保持与列表结果一致的数组格式（例如 `[1602]` 或 `[1602,1603]`）。不要提取单个元素或转换类型。

### Q6: `traceId` 有什么作用？

A: `traceId` 用于串联从产品查询到订单提交的完整流程，便于排查问题。建议将详情接口返回的 `traceId` 传入下单接口。

### Q7: 用户说“旅游产品/跟团产品/自助产品/自驾产品”怎么办？

A: 服务侧已兼容这些自然语言表述：用户说这些词语时会按“度假产品”业务语义触发同一套工具链。

### Q8: 下单失败如何处理？

A:

- 确认 `departDate` 来自 `getHolidayProductDetail.data.productPriceCalendar.rows[]` 的可选日期
- 确认 `tourists` 字段完整且证件类型/证件有效期/生日等符合校验要求
- 查看返回的 `errorCode` 和 `msg`，根据提示修正参数后重试