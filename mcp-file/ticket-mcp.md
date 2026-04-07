门票
概述
途牛门票 MCP 服务提供基于 MCP 协议的景点门票查询和在线预订功能，支持集成到 AI 助手、智能客服等应用中。

服务地址: https://openapi.tuniu.cn/mcp/ticket

核心特性:

🚀 无状态设计，无需维护会话
🔐 基于 API Key 认证
💾 智能缓存，提升响应速度
📦 完整的预订流程（查询→下单）
一、快速开始
1.1 获取认证凭证

访问 途牛开放平台 注册并创建应用，获取：

API Key: 应用密钥（用于 apiKey 请求头）
1.2 第一个 API 调用

查询南京中山陵门票：


curl -X POST "https://openapi.tuniu.cn/mcp/ticket" \
  -H "Content-Type: application/json" \
  -H "apiKey: YOUR_API_KEY" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "query_cheapest_tickets",
      "arguments": {
        "scenic_name": "南京中山陵"
      }
    }
  }'
响应解析：


const response = await fetch(...);
const result = await response.json();

// ⚠️ 重要：result.content[0].text 是 JSON 字符串，需要再次解析
const data = JSON.parse(result.result.content[0].text);
二、常用 Client 配置
2.1 Cursor IDE

配置路径：

Cursor Settings → Tools & MCP → 新增
配置示例：


{
  "mcpServers": {
    "tuniu-ticket": {
      "url": "https://openapi.tuniu.cn/mcp/ticket",
      "transport": "http",
      "headers": {
        "apiKey": "YOUR_API_KEY"
      }
    }
  }
}
使用方式：

在 Cursor Chat 中询问："南京中山陵门票多少钱？"
AI 会调用 MCP 工具并返回结果
2.2 OpenClaw

OpenClaw 配置： 从 clawhub 安装 skill，打开 terminal 运行以下命令


npx clawhub@latest install tuniu-ticket

sh-5.2# npx clawhub@latest install tuniu-ticket
✔ OK. Installed tuniu-ticket -> /root/.openclaw/workspace/skills/tuniu-ticket
安装完成后在聊天交互界面提供 apiKey 即可进行门票查询和预订

2.3 CoPaw

配置路径：

侧边栏：智能体 → MCP → 创建客户端
配置示例：


{
  "mcpServers": {
    "tuniu-ticket": {
      "url": "https://openapi.tuniu.cn/mcp/ticket",
      "transport": "http",
      "headers": {
        "apiKey": "YOUR_API_KEY"
      }
    }
  }
}
使用方式：

在 CoPaw 中询问："南京中山陵门票多少钱？"
2.4 LobsterAI IDE

配置路径：

LobsterAI IDE 左侧目录MCP → 自定义 → 新增
配置示例：


服务名称：
  途牛门票 MCP 服务
描述：
  途牛门票 MCP 服务提供基于 MCP 协议的景点门票查询和在线预订功能
传输类型：
  HTTP流式传输
URL：
  https://openapi.tuniu.cn/mcp/ticket
请求头：
  apiKey - YOUR_API_KEY
使用方式：

在 LobsterAI Chat 中询问："南京中山陵门票多少钱？"
AI 会调用 MCP 工具并返回结果
三、Tools 列表
3.1 query_cheapest_tickets（门票查询）

功能: 根据景点名称查询门票价格和票型信息。

参数:

参数	类型	必需	说明
scenic_name	string	✅	景点名称（如"南京中山陵"）
请求示例:


{
  "name": "query_cheapest_tickets",
  "arguments": {
    "scenic_name": "南京中山陵"
  }
}
响应字段:


{
  scenic_name: string;       // 景点名称
  tickets: [{
    productId: number;       // ⚠️ 下单时使用 product_id
    resId: string;          // ⚠️ 下单时使用 resource_id
    price: string;          // 价格（元）
    ticketType: string;     // 票型名称
    // ... 其他票型信息
  }]
}
3.2 create_ticket_order（创建订单）

功能: 创建门票预订订单。

前置条件: ⚠️ 必须先调用 query_cheapest_tickets 获取 productId 和 resId

参数:

参数	类型	必需	说明
product_id	number	✅	产品ID（来自 query_cheapest_tickets 的 productId）
resource_id	string	✅	资源ID（来自 query_cheapest_tickets 的 resId）
depart_date	string	✅	出游日期 YYYY-MM-DD
adult_num	number	✅	成人数
contact_name	string	✅	取票人姓名
contact_mobile	string	✅	取票人手机号
tourist_1_name	string	✅	出游人1姓名
tourist_1_mobile	string	✅	出游人1手机号
tourist_1_cert_type	string	✅	出游人1证件类型（如"身份证"）
tourist_1_cert_no	string	✅	出游人1证件号码
child_num	number	❌	儿童数（默认0）
contact_cert_type	string	❌	取票人证件类型
contact_cert_no	string	❌	取票人证件号码
tourist_2_name ~ tourist_5_name	string	❌	出游人2～5 姓名
tourist_2_mobile ~ tourist_5_mobile	string	❌	出游人2～5 手机号
tourist_2_cert_type ~ tourist_5_cert_type	string	❌	出游人2～5 证件类型
tourist_2_cert_no ~ tourist_5_cert_no	string	❌	出游人2～5 证件号码
出游人说明: 出游人总数应等于 adult_num + child_num，至少 1 位，最多 5 位。

请求示例:


{
  "name": "create_ticket_order",
  "arguments": {
    "product_id": 12345,
    "resource_id": "res001",
    "depart_date": "2026-03-18",
    "adult_num": 1,
    "contact_name": "张三",
    "contact_mobile": "13800138000",
    "tourist_1_name": "李四",
    "tourist_1_mobile": "13900139000",
    "tourist_1_cert_type": "身份证",
    "tourist_1_cert_no": "310101199001011234"
  }
}
请求头要求: 与其他接口相同，仅需要 apiKey 请求头。

响应字段:


{
  success: boolean;
  orderId: string;           // 订单号
  paymentUrl: string;        // 支付链接（https://m.tuniu.com/u/gt/order/{orderId}?orderType=75）
  message: string;           // 提示信息
}
重要提示: 下单成功后 必须提醒用户点击 paymentUrl 完成支付。

四、完整预订流程
4.1 流程图


查询门票 → 选择票型 → 创建订单 → 支付
   ↓           ↓           ↓
productId   resId      orderId
resource_id
4.2 代码示例


// 步骤1: 查询门票
const queryResult = await callTool('query_cheapest_tickets', {
  scenic_name: '南京中山陵',
});

const ticket = queryResult.tickets[0];

// 步骤2: 创建订单
const orderResult = await callTool('create_ticket_order', {
  product_id: ticket.productId,
  resource_id: ticket.resId,
  depart_date: '2026-03-18',
  adult_num: 1,
  contact_name: '张三',
  contact_mobile: '13800138000',
  tourist_1_name: '李四',
  tourist_1_mobile: '13900139000',
  tourist_1_cert_type: '身份证',
  tourist_1_cert_no: '310101199001011234',
});

console.log('订单号:', orderResult.orderId);
console.log('支付链接:', orderResult.paymentUrl);
// 必须提醒用户点击 paymentUrl 完成支付
