机票
概述
途牛机票 MCP 服务提供基于 MCP 协议的国内航班搜索、舱位查询和在线预订功能，支持集成到 AI 助手、智能客服等应用中。

服务地址: https://openapi.tuniu.cn/mcp/flight

核心特性:

无状态设计，无需维护会话
基于 API Key 认证
智能缓存，提升响应速度
完整的预订流程（搜索→舱位→下单）
支持 6 种查询模式（低价、时间范围、价格区间、周边出发、周边到达、中转）
一、快速开始
1.1 获取认证凭证

访问 途牛开放平台 注册并创建应用，获取：

API Key: 应用密钥（用于 apiKey 请求头）
1.2 第一个 API 调用

搜索北京到上海的航班：


curl -X POST "https://openapi.tuniu.cn/mcp/flight" \
  -H "Content-Type: application/json" \
  -H "apiKey: YOUR_API_KEY" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "searchLowestPriceFlight",
      "arguments": {
        "departureCityName": "北京",
        "arrivalCityName": "上海",
        "departureDate": "2026-03-15"
      }
    }
  }'
响应解析：


const response = await fetch(...);
const result = await response.json();

// ⚠️ 重要：result.content[0].text 是 JSON 字符串，需要再次解析
const data = JSON.parse(result.result.content[0].text);

console.log('航班列表:', data.data);
二、常用 Client 配置
2.1 Cursor IDE

配置路径：

Cursor Settings → Tools → MCP → 新增
配置示例：


{
  "mcpServers": {
    "tuniu-flight": {
      "url": "https://openapi.tuniu.cn/mcp/flight",
      "transport": "http",
      "headers": {
        "apiKey": "YOUR_API_KEY"
      }
    }
  }
}
使用方式：

在 Cursor Chat 中询问："查询北京到上海的航班"
AI 会调用 MCP 工具并返回结果
2.2 OpenClaw

OpenClaw 配置： 从 clawhub 安装 skill，打开 terminal 运行以下命令


npx clawhub@latest install tuniu-flight

sh-5.2# npx clawhub@latest install tuniu-flight
✔ OK. Installed tuniu-flight -> /root/.openclaw/workspace/skills/tuniu-flight
安装完成后在聊天交互界面提供 apiKey 即可进行航班搜索和预订

2.3 CoPaw

配置路径：

侧边栏：智能体 → MCP → 创建客户端
配置示例：


{
  "mcpServers": {
    "tuniu-flight": {
      "url": "https://openapi.tuniu.cn/mcp/flight",
      "transport": "http",
      "headers": {
        "apiKey": "YOUR_API_KEY"
      }
    }
  }
}
使用方式：

在 CoPaw 中询问："查询北京到上海的航班"
2.4 LobsterAI IDE

配置路径：

LobsterAI IDE 左侧目录 MCP → 自定义 → 新增
配置示例：


服务名称：
  途牛机票 MCP 服务
描述：
  途牛机票 MCP 服务提供基于 MCP 协议的国内航班搜索、舱位查询和在线预订功能
传输类型：
  HTTP 流式传输
URL：
  https://openapi.tuniu.cn/mcp/flight
请求头：
  apiKey - YOUR_API_KEY
使用方式：

在 LobsterAI Chat 中询问："查询北京到上海的航班"
AI 会调用 MCP 工具并返回结果
三、Tools 列表
3.1 searchLowestPriceFlight（航班搜索）

功能: 根据出发城市、到达城市和日期搜索航班，支持 6 种查询模式，支持分页查询。

查询模式说明：

searchType	说明	额外参数
不传/空	默认低价查询	无
TIME	按出发/到达时间范围查询	departureTime 或 arrivalTime
PRICE	按价格区间查询	priceRange
NEAR_GO	周边机场出发查询	无
NEAR_BACK	周边机场到达查询	无
TRANSFER	中转航班查询	无
参数:

参数	类型	必需	说明
departureCityName	string	✅	出发城市名称
arrivalCityName	string	✅	到达城市名称
departureDate	string	✅	出发日期 YYYY-MM-DD
searchType	string	❌	查询模式：TIME/PRICE/NEAR_GO/NEAR_BACK/TRANSFER
departureTime	string	❌	出发时间范围，如"06:00-10:00"，仅 TIME 模式使用
arrivalTime	string	❌	到达时间范围，如"14:00-18:00"，仅 TIME 模式使用
priceRange	string	❌	价格区间，如"500-800"，仅 PRICE 模式使用
pageNum	number	❌	页码（分页时传递，从 2 开始）
请求示例:


// 默认低价查询
{
  "name": "searchLowestPriceFlight",
  "arguments": {
    "departureCityName": "北京",
    "arrivalCityName": "上海",
    "departureDate": "2026-03-15"
  }
}

// TIME 模式：按时间范围查询（早班机）
{
  "name": "searchLowestPriceFlight",
  "arguments": {
    "departureCityName": "北京",
    "arrivalCityName": "上海",
    "departureDate": "2026-03-15",
    "searchType": "TIME",
    "departureTime": "06:00-10:00"
  }
}

// PRICE 模式：按价格区间查询
{
  "name": "searchLowestPriceFlight",
  "arguments": {
    "departureCityName": "北京",
    "arrivalCityName": "上海",
    "departureDate": "2026-03-15",
    "searchType": "PRICE",
    "priceRange": "500-800"
  }
}

// NEAR_GO 模式：周边机场出发查询
{
  "name": "searchLowestPriceFlight",
  "arguments": {
    "departureCityName": "北京",
    "arrivalCityName": "上海",
    "departureDate": "2026-03-15",
    "searchType": "NEAR_GO"
  }
}

// NEAR_BACK 模式：周边机场到达查询
{
  "name": "searchLowestPriceFlight",
  "arguments": {
    "departureCityName": "北京",
    "arrivalCityName": "上海",
    "departureDate": "2026-03-15",
    "searchType": "NEAR_BACK"
  }
}

// TRANSFER 模式：中转航班查询
{
  "name": "searchLowestPriceFlight",
  "arguments": {
    "departureCityName": "北京",
    "arrivalCityName": "上海",
    "departureDate": "2026-03-15",
    "searchType": "TRANSFER"
  }
}

// 分页查询（第 2 页）
{
  "name": "searchLowestPriceFlight",
  "arguments": {
    "departureCityName": "北京",
    "arrivalCityName": "上海",
    "departureDate": "2026-03-15",
    "pageNum": 2
  }
}
重要提示: 分页查询时只需传递相同的城市日期参数和 pageNum，系统会自动获取查询上下文。

3.2 multiCabinDetails（舱位价格查询）

功能：查询指定航班的舱位价格详情，返回下单所需的关键字段。

前置条件：需先调用 searchLowestPriceFlight 搜索航班，系统会自动关联查询上下文。

参数:

参数	类型	必需	说明
departureCityName	string	✅	出发城市名称（从搜索结果获取）
arrivalCityName	string	✅	到达城市名称（从搜索结果获取）
departureDate	string	✅	出发日期 YYYY-MM-DD（从搜索结果获取）
flightNo	string	✅	航班号（从搜索结果获取）
请求示例:


{
  "name": "multiCabinDetails",
  "arguments": {
    "departureCityName": "北京",
    "arrivalCityName": "上海",
    "departureDate": "2026-03-15",
    "flightNo": "MU5101"
  }
}
响应字段:


{
  successCode: boolean;
  flightInfo: [{           // 航班详细信息
    // 航班相关信息
  }];
  cabinInfo: [{            // 舱位信息（下单必需）
    priceWithTax: string;     // 含税价格
    cabinClass: string;       // 舱等
    buyCondition: string;     // 购买条件
    refundChangeRule: string; // 退改签规则
    baggageInfo: string;      // 行李信息
    remainingSeats: string;   // 剩余座位数
    sourceId: string;         // 资源 ID（下单必需）
    vendorId: string;         // 供应商 ID（下单必需）
    cabinCodes: string;       // 舱位代码（下单必需）
  }]
}
重要提示：sourceId、vendorId、cabinCodes 是下单时的必需参数。

3.3 getBookingRequiredInfo（获取预订信息）

功能：获取机票预订所需填写的字段信息，下单前必须先调用此接口了解必填字段。

请求示例:


{
  "name": "getBookingRequiredInfo",
  "arguments": {}
}
响应：返回预订所需的字段说明列表。

3.4 saveOrder（创建订单）

功能：创建机票预订订单。

前置条件:

必须先调用 searchLowestPriceFlight 获取航班信息
必须调用 multiCabinDetails 获取 sourceId、vendorId、cabinCodes
建议先调用 getBookingRequiredInfo 了解必填字段
参数:

参数	类型	必需	说明
departureCityName	string	✅	出发城市名称（从搜索结果获取）
arrivalCityName	string	✅	到达城市名称（从搜索结果获取）
departureDate	string	✅	出发日期 YYYY-MM-DD（从搜索结果获取）
flightNo	string	✅	航班号（从搜索结果获取）
sourceId	string	✅	资源 ID（来自舱位详情）
vendorId	string	✅	供应商 ID（来自舱位详情）
cabinCodes	string	✅	舱位代码（来自舱位详情）
tourists	array	✅	乘机人信息列表
contactTourist	object	✅	联系人信息
tourists 格式:


[
  {
    "name": "张三",
    "firstname": "San",
    "lastname": "Zhang",
    "psptType": 1,
    "psptId": "310101199001011234",
    "sex": 1,
    "psptEndDate": "2030-01-01",
    "birthday": "1990-01-01",
    "touristType": 0,
    "tel": "13800138000",
    "intlCode": "86",
    "index": 0
  }
]
证件类型说明:

psptType	说明
1	身份证
2	因私护照
3	军官证
4	港澳通行证
7	台胞证
11	台湾通行证
12	驾驶证
乘客类型说明:

touristType	说明
0	成人
1	儿童
2	婴儿
contactTourist 格式:


{
  "name": "张三",
  "tel": "13800138000",
  "email": "zhangsan@example.com"
}
请求示例:


{
  "name": "saveOrder",
  "arguments": {
    "departureCityName": "北京",
    "arrivalCityName": "上海",
    "departureDate": "2026-03-15",
    "flightNo": "MU5101",
    "sourceId": "xxx",
    "vendorId": "xxx",
    "cabinCodes": "Y",
    "tourists": [
      {
        "name": "张三",
        "psptType": 1,
        "psptId": "310101199001011234",
        "sex": 1,
        "birthday": "1990-01-01",
        "touristType": 0,
        "tel": "13800138000",
        "index": 0
      }
    ],
    "contactTourist": {
      "name": "张三",
      "tel": "13800138000",
      "email": "zhangsan@example.com"
    }
  }
}
响应字段:


{
  successCode: boolean;
  orderId: string;           // 订单号
  orderStatus: number;       // 订单状态
  payAmount: number;         // 支付金额（分）
  payUrl: string;            // 支付链接
  createTime: string;        // 订单创建时间
}
重要提示：下单成功后 必须提醒用户点击 payUrl 完成支付。

四、完整预订流程
4.1 流程图


搜索航班 → 选择航班 → 查看舱位 → 选择舱位 → 创建订单 → 支付
   ↓           ↓           ↓           ↓           ↓
flightNo   flightNo   sourceId    cabinCodes   orderId
                      vendorId
4.2 代码示例


// 步骤 1: 搜索航班
const searchResult = await callTool('searchLowestPriceFlight', {
  departureCityName: '北京',
  arrivalCityName: '上海',
  departureDate: '2026-03-15',
});

const flight = searchResult.data[0];

// 步骤 2: 查看舱位详情（传入相同的城市和日期）
const cabinResult = await callTool('multiCabinDetails', {
  departureCityName: '北京',
  arrivalCityName: '上海',
  departureDate: '2026-03-15',
  flightNo: flight.flightNumber,
});

const cabin = cabinResult.cabinInfo[0];

// 步骤 3: 创建订单
const orderResult = await callTool('saveOrder', {
  departureCityName: '北京',
  arrivalCityName: '上海',
  departureDate: '2026-03-15',
  flightNo: flight.flightNumber,
  sourceId: cabin.sourceId,
  vendorId: cabin.vendorId,
  cabinCodes: cabin.cabinCodes,
  tourists: [
    {
      name: '张三',
      psptType: 1,
      psptId: '310101199001011234',
      sex: 1,
      birthday: '1990-01-01',
      touristType: 0,
      tel: '13800138000',
      index: 0
    }
  ],
  contactTourist: {
    name: '张三',
    tel: '13800138000',
    email: 'zhangsan@example.com'
  }
});

console.log('订单号:', orderResult.orderId);
console.log('支付链接:', orderResult.payUrl);
// 必须提醒用户点击 payUrl 完成支付
五、常见问题
Q1: 是否需要先调用 initialize？

A: 不需要。本服务采用无状态设计，可以直接调用工具。

Q2: sourceId、vendorId、cabinCodes 从哪里获取？

A: 需要先调用 multiCabinDetails 接口，从返回的 cabinInfo 中获取。

Q3: 如何分页查询航班？

A: 分页时传入相同的城市、日期参数和 pageNum（从 2 开始）即可，系统会自动关联查询上下文。

Q4: 有哪些查询模式可用？

A: 支持 6 种查询模式：

默认低价查询（不传 searchType）
TIME：按出发/到达时间范围查询
PRICE：按价格区间查询
NEAR_GO：周边机场出发查询
NEAR_BACK：周边机场到达查询
TRANSFER：中转航班查询
Q5: 支付流程是怎样的？

A: 下单成功后会返回 payUrl，用户需访问该链接在途牛官网完成支付。

Q6: 如何处理"舱位信息已失效"错误？

A: 说明缓存已过期，需要重新调用 multiCabinDetails 获取最新的舱位信息。