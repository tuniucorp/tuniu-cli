---
name: tuniu-cli
description: 途牛旅行统一助手（推荐优先使用）- 通过 tuniu CLI 统一调用机票、酒店、门票、火车票、邮轮、度假产品等旅行服务。适用于用户询问航班、酒店、景点门票、火车票、邮轮以及跟团游、自助游、自驾游等度假相关需求的场景。【优先级说明】当同时安装了 tuniu-flight/tuniu-hotel/tuniu-ticket/tuniu-train/tuniu-cruise 等单独服务 skill 时，请优先使用本 skill，它整合了所有服务能力且调用方式更简洁。
version: 1.0.0
metadata: {"openclaw": {"emoji": "🧳", "category": "travel", "tags": ["途牛", "旅行", "机票", "酒店", "门票", "火车票", "邮轮", "预订", "度假"], "priority": 100, "requires": {"bins": ["tuniu"]}, "env": {"TUNIU_API_KEY": {"type": "string", "description": "途牛开放平台 API key，用于 apiKey 请求头", "required": true}}}}
---

# 途牛旅行助手

当用户询问航班、酒店、景点门票、火车票、邮轮、度假产品（跟团/自助/自驾/当地游等）等旅行服务时，使用此 skill 通过 tuniu CLI 调用途牛服务。

## 运行环境要求

本 skill 通过 **shell exec** 执行 **tuniu CLI** 命令调用途牛服务。**运行环境必须安装 tuniu-cli**，否则无法调用服务。

### 安装 tuniu-cli

```bash
# npm 全局安装（推荐）
npm install -g tuniu-cli@latest

# 或使用 npx 临时调用
npx tuniu-cli --version
```

## 配置要求

### 必需配置

- **TUNIU_API_KEY**：途牛开放平台 API key，用于认证

用户需在 [途牛开放平台](https://open.tuniu.com/mcp) 注册并获取上述密钥。

```bash
export TUNIU_API_KEY=your_api_key
```

## 速查表

### 意图识别（用户说什么 → 用什么工具）

| 用户意图关键词 | server | 首选工具 | 必填参数 |
|---------------|--------|----------|----------|
| 航班/机票/飞机 | `flight` | `searchLowestPriceFlight` | `departureCityName`, `arrivalCityName`, `departureDate` |
| 酒店/住宿/民宿 | `hotel` | `tuniu_hotel_search` | `cityName` |
| 门票/景点门票 | `ticket` | `query_cheapest_tickets` | `scenic_name` |
| 火车票/高铁/动车 | `train` | `searchLowestPriceTrain` | `departureCityName`, `arrivalCityName`, `departureDate` |
| 邮轮/游轮 | `cruise` | `searchCruiseList` | `departsDateBegin`, `departsDateEnd` |
| 度假/跟团/自助游/自驾游/旅游线路 | `holiday` | `searchHolidayList` | `destinationName`（若传出游日期则 `departsDateBegin` 与 `departsDateEnd` 需成对） |

### 基本命令格式

```bash
tuniu call <server> <tool> -a '<JSON参数>'
```

| 参数 | 说明 |
|------|------|
| `server` | 服务名称：`ticket`、`hotel`、`flight`、`train`、`cruise`、`holiday` |
| `tool` | 工具名称，如 `query_cheapest_tickets`、`searchLowestPriceFlight` 等 |
| `--args` 或 `-a` | 工具输入参数，必须是合法的 JSON 字符串 |

**重要**：`--args` 的值必须是 JSON 格式，且用引号包裹。中文可直接写入，无需转义。无参数时用空对象：`-a '{}'`

### 服务工具链路

| 服务 | 完整流程（搜索→详情→下单） |
|------|---------------------------|
| `flight` | `searchLowestPriceFlight` → `multiCabinDetails` → `saveOrder` → `cancelOrder` |
| `hotel` | `tuniu_hotel_search` → `tuniu_hotel_detail` → `tuniu_hotel_create_order` |
| `ticket` | `query_cheapest_tickets` → `create_ticket_order` |
| `train` | `searchLowestPriceTrain` → `queryTrainDetail` → `bookTrain` → `cancelOrder` |
| `cruise` | `searchCruiseList` → `getCruiseProductDetail` → `getCruiseCabinAndRoom` → `saveCruiseOrder` |
| `holiday` | `searchHolidayList` → `getHolidayProductDetail` → `getHolidayBookingRequiredInfo`（可选，预订说明）→ `saveHolidayOrder` |

### 常用辅助命令

| 命令 | 用途 |
|------|------|
| `tuniu list` / `tuniu list <server>` | 列出服务/工具 |
| `tuniu help <server> <tool>` | 查看参数说明 |
| `tuniu schema --output json` | 获取完整 Schema |
| `tuniu discovery refresh && tuniu discovery list` | 检查新服务 |
| `tuniu call ... -d` | 调试模式 |

---

## 隐私与个人信息（PII）说明

预订功能会将用户提供的**个人信息**（联系人姓名、手机号、乘客姓名、证件号等）通过 tuniu CLI 发送至途牛远端服务，以完成订单创建。使用本 skill 即表示用户知晓并同意上述 PII 被发送到外部服务。请勿在日志或回复中暴露用户个人信息。

## 适用场景

- 机票搜索、舱位查询、机票预订
- 酒店搜索、详情查询、酒店预订
- 景点门票查询、门票预订
- 火车票车次查询、车次详情、火车票预订
- 邮轮产品搜索、团期查询、邮轮预订（兼容"游轮"说法）
- 度假产品搜索、团期价格日历、度假预订（兼容跟团、自助游、自驾游、当地游等表述）
- **动态服务发现**：当用户旅行需求超出上述服务范围时，通过 discovery 功能检查是否有新服务上线

## 动态服务发现（重要）

途牛 CLI 支持**动态发现**新服务。当用户提出的需求无法被当前已知服务满足时，应通过 discovery 命令检查是否有新服务上线。

### 服务发现状态

**服务发现默认开启**。可通过以下命令确认状态：

```bash
tuniu discovery status
```

若返回 `启用: 否`（服务发现关闭），才需手动开启：

```bash
export TUNIU_DISCOVERY_ENABLED=true
```

### 服务发现命令

| 命令 | 用途 |
|------|------|
| `tuniu discovery status` | 查看服务发现状态（是否启用、Discovery URL、缓存状态） |
| `tuniu discovery list` | 从 Discovery 获取当前可用服务列表（失败时自动回退静态配置/缓存） |
| `tuniu discovery refresh` | 强制刷新 Discovery 缓存，获取最新服务列表 |

### 使用场景

**场景 1：用户需求超出已知服务范围**

```
用户：帮我查一下签证办理
AI：当前已知服务中没有签证相关服务，让我检查是否有新服务上线...
执行：tuniu discovery refresh && tuniu discovery list
```

**场景 2：定期检查新服务**

```bash
# 刷新缓存获取最新服务列表
tuniu discovery refresh

# 查看当前所有可用服务
tuniu discovery list
```

**场景 3：工具调用失败时**

当 `tuniu call` 返回工具不存在错误（退出码 102）时，可能是服务已更新：

```bash
# 先刷新服务发现
tuniu discovery refresh

# 重新获取 schema
tuniu schema --output json

# 再次尝试调用
tuniu call <server> <tool> -a '<JSON>'
```

### 响应示例

**tuniu discovery status 输出**：
```json
服务发现状态:
  启用: 是
  URL: https://openapi.tuniu.cn/tour/mcp/discovery
  缓存存在: 是
  缓存状态: 已过期
  过期时间: 3/27/2026, 6:17:37 PM
  服务数量: 5
  刷新间隔: 86400 秒 (24 小时)
  请求超时: 10000 毫秒
```

**tuniu discovery list 输出**：
```json
{
  "services": [
    {"name": "hotel", "url": "https://openapi.tuniu.cn/mcp/hotel", "description": "酒店服务", "status": "health", "tags": ["travel", "booking"]},
    {"name": "ticket", "url": "https://openapi.tuniu.cn/mcp/ticket", "description": "门票服务", "status": "health", "tags": ["travel", "booking"]}
    // ... 其他服务格式相同
  ]
}
```

### 最佳实践

1. **初始化时**：执行 `tuniu discovery status` 确认服务发现状态（默认开启）
2. **遇到新需求时**：先执行 `tuniu discovery refresh` 刷新缓存，再 `tuniu discovery list` 查看最新服务
3. **获取新服务能力**：执行 `tuniu schema --output json` 获取最新工具定义
4. **降级处理**：如果 discovery 服务不可用，会自动回退到静态配置

## 各服务详细说明

### 1. 机票服务 (flight)

**触发词**：航班、机票、飞机、某地到某地航班、查机票、机票价格

#### 1.1 航班搜索 (searchLowestPriceFlight)

**支持 6 种查询模式**：
- **默认低价查询**：不传 searchType
- **TIME 时间范围查询**：searchType="TIME"，按出发/到达时间筛选
- **PRICE 价格区间查询**：searchType="PRICE"，按价格区间筛选
- **NEAR_GO 周边出发**：searchType="NEAR_GO"，查询出发地周边机场
- **NEAR_BACK 周边到达**：searchType="NEAR_BACK"，查询目的地周边机场
- **TRANSFER 中转查询**：searchType="TRANSFER"，查询中转航班

**必填参数**：`departureCityName`、`arrivalCityName`、`departureDate`（YYYY-MM-DD）

**翻页**：传相同城市日期参数 + `pageNum`（2=第二页，3=第三页…）

```bash
# 默认低价查询
tuniu call flight searchLowestPriceFlight -a '{"departureCityName":"北京","arrivalCityName":"上海","departureDate":"2026-03-15"}'

# TIME 模式：早班机
tuniu call flight searchLowestPriceFlight -a '{"departureCityName":"北京","arrivalCityName":"上海","departureDate":"2026-03-15","searchType":"TIME","departureTime":"06:00-10:00"}'

# 翻页查询
tuniu call flight searchLowestPriceFlight -a '{"departureCityName":"北京","arrivalCityName":"上海","departureDate":"2026-03-15","pageNum":2}'
```

#### 1.2 舱位详情查询 (multiCabinDetails)

**必填参数**：`departureCityName`、`arrivalCityName`、`departureDate`（YYYY-MM-DD）、`flightNo`

**返回**：`cabinPriceId`（下单必需）

```bash
tuniu call flight multiCabinDetails -a '{"departureCityName":"北京","arrivalCityName":"上海","departureDate":"2026-03-15","flightNo":"MU5101"}'
```

#### 1.3 创建订单 (saveOrder)

**前置条件**：必须先调用 `searchLowestPriceFlight` 和 `multiCabinDetails` 获取 `cabinPriceId`

**必填参数**：`departureCityName`、`arrivalCityName`、`departureDate`、`flightNo`、`cabinPriceId`、`tourists`、`contactTourist`

```bash
tuniu call flight saveOrder -a '{"departureCityName":"北京","arrivalCityName":"上海","departureDate":"2026-03-15","flightNo":"MU5101","cabinPriceId":"xxx","tourists":[{"name":"张三","idType":"身份证","idNumber":"310101199001011234","mobile":"13800138000"}],"contactTourist":{"name":"张三","mobile":"13800138000"}}'
```

#### 1.4 取消订单 (cancelOrder)

```bash
tuniu call flight cancelOrder -a '{"orderId":"订单号"}'
```

---

### 2. 酒店服务 (hotel)

**触发词**：酒店、住宿、民宿、某地酒店、入住、查酒店

#### 2.1 酒店搜索 (tuniu_hotel_search)

**必填参数**：`cityName`
**可选参数**：`checkIn`、`checkOut`（YYYY-MM-DD）、`keyword`、`prices`

**翻页**：传 `queryId`（首次搜索返回）和 `pageNum`

```bash
# 第一页
tuniu call hotel tuniu_hotel_search -a '{"cityName":"北京","checkIn":"2026-03-01","checkOut":"2026-03-03"}'

# 翻页（使用 queryId）
tuniu call hotel tuniu_hotel_search -a '{"queryId":"xxx","pageNum":2}'
```

#### 2.2 酒店详情 (tuniu_hotel_detail)

**必填参数**：`hotelId` 或 `hotelName` 二选一

```bash
tuniu call hotel tuniu_hotel_detail -a '{"hotelId":12345,"checkIn":"2026-03-01","checkOut":"2026-03-03"}'
```

#### 2.3 创建订单 (tuniu_hotel_create_order)

**前置条件**：必须先调用 `tuniu_hotel_detail` 获取 `preBookParam`

**必填参数**：`hotelId`、`roomId`、`preBookParam`、`checkInDate`、`checkOutDate`、`roomCount`、`roomGuests`、`contactName`、`contactPhone`

```bash
tuniu call hotel tuniu_hotel_create_order -a '{"hotelId":"xxx","roomId":"xxx","preBookParam":"xxx","checkInDate":"2026-03-01","checkOutDate":"2026-03-03","roomCount":1,"roomGuests":[{"guests":[{"firstName":"三","lastName":"张"}]}],"contactName":"张三","contactPhone":"13800138000"}'
```

---

### 3. 门票服务 (ticket)

**触发词**：门票、景点门票、某景点门票、门票价格、门票多少钱

#### 3.1 门票查询 (query_cheapest_tickets)

**必填参数**：`scenic_name`（景点名称）

**返回**：`productId`、`resId`（下单必需）

```bash
tuniu call ticket query_cheapest_tickets -a '{"scenic_name":"中山陵"}'
```

#### 3.2 创建订单 (create_ticket_order)

**前置条件**：必须先调用 `query_cheapest_tickets` 获取 `productId` 和 `resId`

**必填参数**：`product_id`、`resource_id`、`depart_date`、`adult_num`、`contact_name`、`contact_mobile`、`tourist_1_name`、`tourist_1_mobile`、`tourist_1_cert_type`、`tourist_1_cert_no`

```bash
tuniu call ticket create_ticket_order -a '{"product_id":12345,"resource_id":"res001","depart_date":"2026-04-01","adult_num":1,"contact_name":"张三","contact_mobile":"13800138000","tourist_1_name":"张三","tourist_1_mobile":"13800138000","tourist_1_cert_type":"身份证","tourist_1_cert_no":"310101199001011234"}'
```

---

### 4. 火车票服务 (train)

**触发词**：火车票、火车、车次、某站到某站火车、高铁、动车

#### 4.1 查询车次列表 (searchLowestPriceTrain)

**必填参数**：`departureCityName`、`arrivalCityName`、`departureDate`（yyyy-MM-dd）
**可选参数**：`departureTime`、`arrivalTime`（时间范围，如"08:00-12:00"）

**翻页**：传首次查询返回的 `queryId` 和 `pageNum`

```bash
# 首次查询
tuniu call train searchLowestPriceTrain -a '{"departureCityName":"南京","arrivalCityName":"上海","departureDate":"2026-03-20"}'

# 翻页
tuniu call train searchLowestPriceTrain -a '{"queryId":"xxx","pageNum":2}'
```

#### 4.2 查询车次详情 (queryTrainDetail)

**必填参数**：`departureStationName`、`arrivalStationName`、`departureDate`、`trainNum`

**返回**：`resId`、`price`、`departsDate`（下单必需）

```bash
tuniu call train queryTrainDetail -a '{"departureStationName":"南京南","arrivalStationName":"上海虹桥","departureDate":"2026-03-20","trainNum":"G203"}'
```

#### 4.3 预订下单 (bookTrain)

**前置条件**：必须先调用 `searchLowestPriceTrain` 和 `queryTrainDetail`

**必填参数**：`resources`、`adultTourists`、`contact`、`acceptStandingTicket`

```bash
tuniu call train bookTrain -a '{"acceptStandingTicket":false,"adultTourists":[{"name":"张三","psptId":"310101199001011234","psptType":1,"isStuDisabledArmyPolice":0,"tel":"13800138000"}],"contact":{"tel":"13800138000"},"resources":[{"resourceId":2121337089,"adultPrice":141.0,"departsDate":"2026-03-20"}]}'
```

#### 4.4 取消订单 (cancelOrder)

```bash
tuniu call train cancelOrder -a '{"orderId":"订单号"}'
```

---

### 5. 邮轮服务 (cruise)

**触发词**：邮轮、游轮、邮轮产品、游轮搜索、邮轮预订（兼容"游轮"说法）

#### 5.1 邮轮列表搜索 (searchCruiseList)

**必填参数**：`departsDateBegin`、`departsDateEnd`（YYYY-MM-DD）
**可选参数**：`cruiseLineName`（航线）、`cruiseBrand`（品牌）、`tourDay`（天数）、`pageNum`

**日期约束**：起始日期不得早于当天，结束日期不得早于起始日期

```bash
tuniu call cruise searchCruiseList -a '{"departsDateBegin":"2026-03-17","departsDateEnd":"2026-03-30"}'

# 按航线筛选
tuniu call cruise searchCruiseList -a '{"departsDateBegin":"2026-03-17","departsDateEnd":"2026-03-30","cruiseLineName":"长江三峡","cruiseBrand":"世纪邮轮"}'
```

#### 5.2 产品详情 (getCruiseProductDetail)

**所有参数必须从 searchCruiseList 返回结果中获取**

**必填参数**：`productId`、`departsDateBegin`、`departsDateEnd`、`departCityCode`（数组格式）、`classBrandParentId`、`proMode`

```bash
tuniu call cruise getCruiseProductDetail -a '{"productId":"321648365","departsDateBegin":"2026-02-10","departsDateEnd":"2026-02-14","departCityCode":[1602],"classBrandParentId":12,"proMode":1}'
```

#### 5.3 查询舱位房型 (getCruiseCabinAndRoom)

**必填参数**：`productId`、`departDate`（用户从团期列表选择的日期）

```bash
tuniu call cruise getCruiseCabinAndRoom -a '{"productId":"321648365","departDate":"2026-05-01"}'
```

#### 5.4 创建订单 (saveCruiseOrder)

**前置条件**：必须先调用 `getCruiseProductDetail` 和 `getCruiseCabinAndRoom`

**必填参数**：`productId`、`departureDate`、`departureCityName`、`duration`、`night`、`vendorId`、`selectRes`、`tourists`

```bash
tuniu call cruise saveCruiseOrder -a '{"productId":"321648365","departureDate":"2026-05-01","departureCityName":"上海","duration":5,"night":4,"vendorId":73197,"selectRes":[{"journeyId":91808486,"resourceId":2121750804}],"tourists":[{"name":"张三","idType":"身份证","idNumber":"310101199001011234","mobile":"13800138000"}]}'
```

---

### 6. 度假产品服务 (holiday)

**触发词**：度假、跟团、自助游、自驾游、旅游产品、当地游、线路、目的地度假（与门票/酒店等区分时优先用列表搜索）

#### 6.1 度假列表搜索 (searchHolidayList)

**必填参数**：`destinationName`（目的地城市名称，单个城市）
**可选参数**：`departsDateBegin`、`departsDateEnd`（成对出现，yyyy-MM-dd）、`departCityName`、`tourDay`、`queryTypeName`（`自驾游` / `自助游` / `跟团`）、`brandTypeName`、`conditions`、`lowPrice`、`highPrice`、`pageNum`

```bash
tuniu call holiday searchHolidayList -a '{"destinationName":"三亚","departsDateBegin":"2026-04-10","departsDateEnd":"2026-04-15"}'

# 指定上海出发、跟团
tuniu call holiday searchHolidayList -a '{"destinationName":"云南","departsDateBegin":"2026-04-10","departsDateEnd":"2026-04-20","departCityName":"上海","queryTypeName":"跟团"}'
```

#### 6.2 产品详情 (getHolidayProductDetail)

**前置条件**：必须先调用 `searchHolidayList`，**所有入参须从列表 `data.rows[]` 对应行原样取得**（含 `departCityCode` 数组、`classBrandId`→`classBrandParentId`、`proMode` 等）。

**必填参数**：`productId`、`departCityCode`（数组）、`classBrandParentId`、`proMode`；若列表行含 `departsDateBegin`/`departsDateEnd` 则需成对传入且与列表一致。

```bash
tuniu call holiday getHolidayProductDetail -a '{"productId":"321619424","departCityCode":[1602],"classBrandParentId":12,"proMode":1}'
```

#### 6.3 预订说明 (getHolidayBookingRequiredInfo)

无参数，返回预订需填信息的中文说明（stdout 可能为文本而非统一 JSON 结构，以实际输出为准）。

```bash
tuniu call holiday getHolidayBookingRequiredInfo -a '{}'
```

#### 6.4 创建订单 (saveHolidayOrder)

**前置条件**：必须先调用 `getHolidayProductDetail`；`departDate` 须来自详情中 `productPriceCalendar.rows[].departDate`；建议传入详情返回的 `traceId`。

**必填参数**：`productId`、`departDate`、`departCityName`、`duration`、`tourists`；`night` 可选（半日游可能为 0 或空）。

```bash
tuniu call holiday saveHolidayOrder -a '{"productId":"321619424","departDate":"2026-05-01","departCityName":"南京","duration":5,"night":4,"traceId":"<详情返回的traceId>","tourists":[{"name":"张三","idType":"身份证","idNumber":"310101199001011234","mobile":"13800138000"}]}'
```

---

## 响应处理

### 成功响应

stdout 输出 JSON 格式：

```json
{
  "success": true,
  "result": {...},
  "metadata": {...}
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "type": "ToolNotFoundError",
    "message": "工具不存在",
    "code": 102
  }
}
```

### 退出码含义

| 退出码 | 含义 | 处理建议 |
|--------|------|----------|
| 0 | 成功 | 解析 stdout JSON |
| 101 | 连接失败 | 重试或检查网络 |
| 102 | 工具不存在 | 运行 `tuniu list <server>` 校验 |
| 103 | 参数错误 | 运行 `tuniu help <server> <tool>` |
| 104 | 认证失败 | 检查 TUNIU_API_KEY |
| 105 | 超时 | 使用 `-t 60` 增加超时 |
| 108 | 未配置 API Key | 设置 TUNIU_API_KEY |
| 199 | 未知错误 | 使用 `-d` 调试模式 |

---

## 使用示例

以下示例中，所有参数均从**用户表述或上一轮结果**中解析并填入。

### 机票场景

**用户**：3月15号北京到上海的航班

**AI 执行**：
```bash
tuniu call flight searchLowestPriceFlight -a '{"departureCityName":"北京","arrivalCityName":"上海","departureDate":"2026-03-15"}'
```

**用户**：看一下 MU5101 这个航班的舱位

**AI 执行**：
```bash
tuniu call flight multiCabinDetails -a '{"departureCityName":"北京","arrivalCityName":"上海","departureDate":"2026-03-15","flightNo":"MU5101"}'
```

### 酒店场景

**用户**：北京3月1号入住一晚，有什么酒店？

**AI 执行**：
```bash
tuniu call hotel tuniu_hotel_search -a '{"cityName":"北京","checkIn":"2026-03-01","checkOut":"2026-03-02"}'
```

### 门票场景

**用户**：中山陵门票多少钱？

**AI 执行**：
```bash
tuniu call ticket query_cheapest_tickets -a '{"scenic_name":"中山陵"}'
```

### 火车票场景

**用户**：3月20号南京到上海的火车票

**AI 执行**：
```bash
tuniu call train searchLowestPriceTrain -a '{"departureCityName":"南京","arrivalCityName":"上海","departureDate":"2026-03-20"}'
```

### 邮轮场景

**用户**：查一下3月17到3月30的邮轮

**AI 执行**：
```bash
tuniu call cruise searchCruiseList -a '{"departsDateBegin":"2026-03-17","departsDateEnd":"2026-03-30"}'
```

### 度假场景

**用户**：4月中旬想去三亚有什么度假线路？

**AI 执行**：
```bash
tuniu call holiday searchHolidayList -a '{"destinationName":"三亚","departsDateBegin":"2026-04-10","departsDateEnd":"2026-04-20"}'
```

---

## 注意事项

1. **密钥安全**：不要在回复或日志中暴露 TUNIU_API_KEY
2. **PII 安全**：联系人姓名、手机号、乘客姓名、证件号仅在预订时发送至 MCP 服务，勿在日志或回复中暴露
3. **认证**：若遇认证错误（退出码 104、108），提示用户检查 TUNIU_API_KEY
4. **日期格式**：所有日期均为 YYYY-MM-dd 或 yyyy-MM-dd
5. **参数验证**：下单前必须先调用搜索/详情接口获取必需参数（如 cabinPriceId、productId、resId 等）
6. **翻页**：各服务翻页参数不同，注意区分
7. **支付提醒**：下单成功后必须提示用户点击支付链接完成支付
8. **调试模式**：遇到问题时使用 `-d` 参数查看详细请求/响应
9. **游轮兼容**：用户说"游轮"时等同于"邮轮"
10. **度假详情参数**：`getHolidayProductDetail` 的 `departCityCode` 等字段必须与 `searchHolidayList` 列表行一致，勿拆数组或自行拼参；`saveHolidayOrder` 的 `departDate` 必须来自详情团期日历中的可选日期