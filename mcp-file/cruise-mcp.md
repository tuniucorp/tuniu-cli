邮轮
概述
途牛邮轮 MCP 服务提供基于 MCP 协议的邮轮产品搜索、团期查询和在线预订功能，支持集成到 AI 助手、智能客服等应用中。

服务地址: https://openapi.tuniu.cn/mcp/cruise

核心特性:

🚀 无状态设计，无需维护会话
🔐 基于 API Key 认证
💾 智能缓存，提升响应速度
📦 完整的预订流程（搜索→详情→团期选择→下单）
🗓️ 团期价格日历，支持多出发日期选择
🌊 兼容"游轮"说法，用户可使用"邮轮"或"游轮"进行查询
一、快速开始
1.1 获取认证凭证
访问 途牛开放平台 注册并创建应用，获取：

API Key: 应用密钥（用于 apiKey 请求头）
1.2 第一个 API 调用
搜索未来 3 天的邮轮产品：


curl -X POST "https://openapi.tuniu.cn/mcp/cruise" \
  -H "Content-Type: application/json" \
  -H "apiKey: YOUR_API_KEY" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "searchCruiseList",
      "arguments": {
        "departsDateBegin": "2026-03-17",
        "departsDateEnd": "2026-03-20"
      }
    }
  }'
响应解析：


const response = await fetch(...);
const result = await response.json();

// ⚠️ 重要：result.content[0].text 是 JSON 字符串，需要再次解析
const data = JSON.parse(result.content[0].text);

console.log('邮轮列表:', data.data.rows);
console.log('总数:', data.data.count);
客户端配置（Cursor、OpenClaw、CoPaw 等）请参考 常用 Client 配置。

二、Tools 列表
2.1 searchCruiseList（邮轮列表搜索）
功能：根据出游日期范围搜索邮轮产品，支持按航线、品牌、天数等条件筛选，支持分页查询。

请求说明
参数表：

参数	类型	必需	说明
departsDateBegin	string	✅	出游日期范围起始，格式 YYYY-MM-DD，不能早于当前日期
departsDateEnd	string	✅	出游日期范围结束，格式 YYYY-MM-DD，不能早于 departsDateBegin
cruiseLineName	string	❌	邮轮航线名称，如"长江三峡"
cruiseBrand	string	❌	邮轮品牌名称，如"皇家加勒比"
tourDay	number	❌	行程天数
pageNum	number	❌	页码（从 1 开始，默认 1）
重要说明：

departsDateBegin 和 departsDateEnd 是查询条件的日期范围，表示"在此期间有出发班次的产品"
返回结果中每个产品都有自己的 departsDateBegin 和 departsDateEnd，这是产品级别的日期范围
用户说"游轮"时等同于"邮轮"，系统会自动兼容
响应说明
参数	类型	说明
success	boolean	是否成功
errorCode	number	错误码
msg	string	错误信息
data	object	查询结果数据
data 对象结构

参数	类型	说明
count	number	符合条件的产品总数
rows	array	当前页产品列表
data.rows 数组元素（关键字段）

参数	类型	说明
productId	string	产品 ID（⭐ 调用详情接口必需）
productName	string	产品名称
departsDateBegin	string	产品日期范围起始（⭐ 调用详情接口必需，内部字段）
departsDateEnd	string	产品日期范围结束（⭐ 调用详情接口必需，内部字段）
departCityCode	array	出发城市代码数组（⭐ 调用详情接口必需，必须原样传递）
departCityName	array	出发城市名称数组
classBrandId	number	品牌 ID（⭐ 调用详情接口时作为 classBrandParentId 传入，整型）
proMode	number	采购方式（⭐ 调用详情接口必需，整型）
price	number	起价（人民币元）
cruiseLineName	string	邮轮航线名称
cruiseBrand	string	邮轮品牌名称
ticketTypeName	string	船票类型
departurePortName	string	出发港口名称
tourDay	number	行程天数
satisfaction	number	满意度（百分比）
peopleNum	number	出游人数
picUrl	string	产品缩略图
isDirectSale	string	是否船司直营
customConditionName	array	产品标签
⚠️ 重要提示：

departsDateBegin、departsDateEnd、departCityCode、classBrandId、proMode 这 5 个字段是调用 getCruiseProductDetail 时的必需参数
departCityCode 是数组格式（如 [1602] 或 [1602, 1603]），必须原样传递，不得修改、不得提取单个元素
请求示例

// 查询未来 3 天的邮轮产品
{
  "name": "searchCruiseList",
  "arguments": {
    "departsDateBegin": "2026-03-17",
    "departsDateEnd": "2026-03-20"
  }
}

// 按航线和品牌筛选
{
  "name": "searchCruiseList",
  "arguments": {
    "departsDateBegin": "2026-03-17",
    "departsDateEnd": "2026-03-30",
    "cruiseLineName": "长江三峡",
    "cruiseBrand": "世纪邮轮"
  }
}

// 分页查询（第 2 页）
{
  "name": "searchCruiseList",
  "arguments": {
    "departsDateBegin": "2026-03-17",
    "departsDateEnd": "2026-03-20",
    "pageNum": 2
  }
}
响应示例

{
  "success": true,
  "errorCode": 0,
  "msg": "查询成功",
  "data": {
    "count": 22,
    "rows": [
      {
        "productId": "321648365",
        "productName": "[春节]<海洋光谱号上海-济州-上海4晚5天>上海登船2026，免签韩国",
        "departsDateBegin": "2026-02-10",
        "departsDateEnd": "2026-02-14",
        "departCityCode": [1602],
        "departCityName": ["上海"],
        "classBrandId": 12,
        "proMode": 1,
        "price": 3299,
        "cruiseLineName": "日韩航线",
        "cruiseBrand": "皇家加勒比",
        "ticketTypeName": "单船票",
        "departurePortName": "上海吴淞口国际邮轮港",
        "tourDay": 5,
        "satisfaction": 97,
        "peopleNum": 1286,
        "picUrl": "https://img1.tuniucdn.com/image/cruise/321648365.jpg",
        "isDirectSale": "航司直营",
        "customConditionName": ["亲子游", "美食"]
      }
    ]
  }
}
2.2 getCruiseProductDetail（产品详情查询）
功能：查询指定邮轮产品的详细信息，包含团期价格日历，返回下单所需的关键字段。

请求说明
前置条件：必须先调用 searchCruiseList 获取产品信息。

参数来源：所有参数必须从 searchCruiseList 返回的 data.rows[] 中获取，不可自行构造。

参数	类型	必需	说明	来源字段
productId	string	✅	产品 ID	data.rows[].productId
departsDateBegin	string	✅	产品日期范围起始，格式 YYYY-MM-DD	data.rows[].departsDateBegin
departsDateEnd	string	✅	产品日期范围结束，格式 YYYY-MM-DD	data.rows[].departsDateEnd
departCityCode	array	✅	出发城市代码数组，⚠️ 必须原样传递	data.rows[].departCityCode
classBrandParentId	number	✅	品牌父级 ID（整型）	data.rows[].classBrandId
proMode	number	✅	采购方式（整型）	data.rows[].proMode
⚠️ 重要提示：

departCityCode 必须传递数组格式（如 [1602]），不得提取单个元素，函数内部会自动取第一个元素使用
所有参数必须与列表查询返回的数据完全一致
响应说明
参数	类型	说明
success	boolean	是否成功
errorCode	number	错误码
msg	string	错误信息
data	object	产品详情数据
traceId	string	链路追踪 ID
data 对象关键字段

参数	类型	说明
productId	string	产品 ID（⭐ 下单必需）
productName	string	产品名称
departureCityName	string	出发城市名称（⭐ 下单必需）
duration	number	行程天数（⭐ 下单必需）
productNight	number	晚数（⭐ 下单时作为 night 参数）
productPriceCalendar	object	团期价格日历（⭐ 用户选择出发日期）
productPriceCalendar 对象结构

参数	类型	说明
count	number	可选团期总数
rows	array	团期列表
productPriceCalendar.rows 数组元素

参数	类型	说明
departDate	string	出发日期（⭐ 下单时作为 departDate 参数，用户必须选择）
tuniuPrice	number	成人价格（人民币元）
tuniuChildPrice	number	儿童价格（人民币元，为 0 时不支持儿童价）
bookCityCode	number	预订城市代码
departCityCode	number	出发城市代码
backCityCode	number	返回城市代码
⚠️ 团期选择说明：

productPriceCalendar.rows 包含所有可选的出发日期及对应价格
用户必须从中选择一个具体的 departDate（如 "2026-05-01"）用于下单
当 tuniuChildPrice 为 0 时，该团期不支持儿童价，不应向用户展示儿童价信息
下单前必须明确用户已选择了具体的团期
请求示例

// 从列表查询结果中获取参数
{
  "name": "getCruiseProductDetail",
  "arguments": {
    "productId": "321648365",
    "departsDateBegin": "2026-02-10",
    "departsDateEnd": "2026-02-14",
    "departCityCode": [1602],
    "classBrandParentId": 12,
    "proMode": 1
  }
}
响应示例

{
  "success": true,
  "errorCode": 0,
  "msg": "查询成功",
  "data": {
    "productId": "321648365",
    "productName": "[春节]<海洋光谱号上海-济州-上海4晚5天>上海登船2026，免签韩国",
    "departureCityName": "上海",
    "duration": 5,
    "productNight": 4,
    "productPriceCalendar": {
      "count": 8,
      "rows": [
        {
          "departDate": "2026-05-01",
          "tuniuPrice": 3299,
          "tuniuChildPrice": 2999,
          "bookCityCode": 1602,
          "departCityCode": 1602,
          "backCityCode": 1602
        },
        {
          "departDate": "2026-05-08",
          "tuniuPrice": 3499,
          "tuniuChildPrice": 3199,
          "bookCityCode": 1602,
          "departCityCode": 1602,
          "backCityCode": 1602
        },
        {
          "departDate": "2026-05-15",
          "tuniuPrice": 3699,
          "tuniuChildPrice": 0,
          "bookCityCode": 1602,
          "departCityCode": 1602,
          "backCityCode": 1602
        }
      ]
    }
  },
  "traceId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
重要提示：用户需要从 productPriceCalendar.rows 中选择一个 departDate 用于下单。

2.3 getCruiseBookingRequiredInfo（获取预订信息）
功能：获取邮轮预订所需填写的字段信息，下单前必须先调用此接口了解必填字段。

请求说明
无参数，arguments 传空对象即可。

响应说明
返回纯文本（非 JSON），内容位于 result.content[0].text，包含：

内容模块	说明
预订所需信息	乘客信息（姓名、证件类型、证件号码、乘客类型）、联系信息（姓名、手机、邮箱）
填写样例	身份证乘客、护照乘客、联系人信息的填写示例
注意事项	证件格式判断、儿童/婴儿出生日期等
预订须知	相关声明与协议链接
请求示例

{
  "name": "getCruiseBookingRequiredInfo",
  "arguments": {}
}
响应示例
返回预订所需的字段说明列表（文本格式）。

2.4 saveCruiseOrder（创建订单）
功能：创建邮轮预订订单。

请求说明
前置条件：

必须先调用 getCruiseProductDetail 获取产品详情
用户必须从团期价格日历中选择了具体的出发日期
建议先调用 getCruiseBookingRequiredInfo 了解必填字段
参数来源：

productId、departCityName、duration、night 必须从 getCruiseProductDetail 返回的 data 中获取
departDate 必须从 getCruiseProductDetail 返回的 data.productPriceCalendar.rows[].departDate 中选择
参数	类型	必需	说明	来源
productId	string	✅	产品 ID	data.productId
departDate	string	✅	出发日期，格式 YYYY-MM-DD	用户从 data.productPriceCalendar.rows[].departDate 中选择
departCityName	string	✅	出发城市名称	data.departureCityName
duration	number	✅	行程天数	data.duration
night	number	✅	晚数	data.productNight
tourists	array	✅	乘客信息列表	用户提供
contactTourist	object	❌	联系人信息	用户提供
traceId	string	❌	链路追踪 ID	getCruiseProductDetail 返回的 traceId
tourists 数组元素

参数	类型	说明
name	string	姓名（必填）
idType	string	证件类型（必填）：身份证、因私护照、户口簿、出生证明、军人证、台胞证、回乡证、港澳居民居住证、台湾居民居住证、外国人永久居留身份证
idNumber	string	证件号码（必填）
mobile	string	手机号（必填）
type	string	乘客类型（可选）：成人/儿童/婴儿，不填则根据生日自动判断
psptEndDate	string	证件有效期，格式 yyyy-MM-dd，非身份证必填（可选）
sex	number	性别，1 男 0 女 9 未知，非身份证必填（可选）
birthday	string	生日，格式 yyyy-MM-dd，非身份证必填（可选）
contactTourist 对象

参数	类型	说明
name	string	联系人姓名（可选，不填则使用第一个乘客姓名）
mobile	string	联系人手机号（可选，不填则使用第一个乘客电话）
email	string	联系人邮箱（可选）
响应说明
参数	类型	说明
success	boolean	是否成功
errorCode	number	错误码
msg	string	提示信息
data	object	订单数据
traceId	string	链路追踪 ID
data 对象

参数	类型	说明
orderId	string	订单号
请求示例

{
  "name": "saveCruiseOrder",
  "arguments": {
    "productId": "321648365",
    "departDate": "2026-05-01",
    "departCityName": "上海",
    "duration": 5,
    "night": 4,
    "tourists": [
      {
        "name": "张三",
        "idType": "身份证",
        "idNumber": "310101199001011234",
        "mobile": "13800138000"
      }
    ],
    "contactTourist": {
      "name": "张三",
      "mobile": "13800138000",
      "email": "zhangsan@example.com"
    },
    "traceId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  }
}
响应示例

{
  "success": true,
  "errorCode": 0,
  "msg": "下单成功",
  "data": {
    "orderId": "1260278419"
  },
  "traceId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
重要提示：下单成功后，用户需要联系客服或前往途牛官网完成支付。

三、完整预订流程
3.1 流程图

搜索邮轮 → 选择产品 → 查看详情 → 选择团期 → 创建订单
   ↓           ↓           ↓           ↓           ↓
产品列表     productId   团期日历    departDate   orderId
3.2 代码示例

// 步骤 1: 搜索邮轮列表
const searchResult = await callTool('searchCruiseList', {
  departsDateBegin: '2026-03-17',
  departsDateEnd: '2026-03-30'
});

// 选择第一个产品
const product = searchResult.data.rows[0];

// 步骤 2: 查看产品详情（必须原样传递参数）
const detailResult = await callTool('getCruiseProductDetail', {
  productId: product.productId,
  departsDateBegin: product.departsDateBegin,
  departsDateEnd: product.departsDateEnd,
  departCityCode: product.departCityCode,  // ⚠️ 必须原样传递数组
  classBrandParentId: product.classBrandId,
  proMode: product.proMode
});

// 步骤 3: 展示团期价格日历，让用户选择出发日期
console.log('可选团期：');
detailResult.data.productPriceCalendar.rows.forEach(row => {
  console.log(`${row.departDate}: 成人价 ¥${row.tuniuPrice}, 儿童价 ¥${row.tuniuChildPrice}`);
});

// 步骤 4: 用户选择团期后创建订单
const selectedDepartDate = '2026-05-01';  // 用户选择的出发日期

const orderResult = await callTool('saveCruiseOrder', {
  productId: detailResult.data.productId,
  departDate: selectedDepartDate,
  departCityName: detailResult.data.departureCityName,
  duration: detailResult.data.duration,
  night: detailResult.data.productNight,
  tourists: [
    {
      name: '张三',
      idType: '身份证',
      idNumber: '310101199001011234',
      mobile: '13800138000'
    }
  ],
  contactTourist: {
    name: '张三',
    mobile: '13800138000',
    email: 'zhangsan@example.com'
  },
  traceId: detailResult.traceId
});

console.log('订单号:', orderResult.data.orderId);
console.log('请联系客服或前往途牛官网完成支付');
3.3 关键参数说明
departCityCode 数组传递

// ✅ 正确：原样传递数组
{
  departCityCode: [1602]  // 或 [1602, 1603]
}

// ❌ 错误：提取了单个元素
{
  departCityCode: 1602
}

// ❌ 错误：转换为字符串
{
  departCityCode: "1602"
}
团期选择流程

// 1. 获取团期列表
const calendar = detailResult.data.productPriceCalendar;
console.log(`共有 ${calendar.count} 个团期可选`);

// 2. 遍历展示（过滤掉无效团期）
const validRows = calendar.rows.filter(row => 
  row.tuniuPrice > 0 && (row.tuniuChildPrice > 0 || row.tuniuPrice > 0)
);

validRows.forEach(row => {
  const childPriceInfo = row.tuniuChildPrice > 0 
    ? `儿童价 ¥${row.tuniuChildPrice}` 
    : '不支持儿童价';
  console.log(`${row.departDate}: 成人价 ¥${row.tuniuPrice}, ${childPriceInfo}`);
});

// 3. 等待用户选择
const userChoice = await getUserInput('请选择出发日期：');

// 4. 验证用户选择
const selectedRow = validRows.find(row => row.departDate === userChoice);
if (!selectedRow) {
  throw new Error('选择的日期不在可选范围内');
}

// 5. 使用选中的日期下单
const departDate = selectedRow.departDate;
四、常见问题
Q1: 是否需要先调用 initialize？
A: 不需要。本服务采用无状态设计，可以直接调用工具。

Q2: departCityCode 为什么必须传递数组？
A: departCityCode 在系统中是数组类型，可能包含多个出发城市代码。调用 getCruiseProductDetail 时必须原样传递 searchCruiseList 返回的数组值，函数内部会自动取第一个元素使用。不得手动提取或转换类型。

Q3: departsDateBegin/End 和 departDate 有什么区别？
A:

departsDateBegin/departsDateEnd：查询条件的日期范围，用于筛选"在此期间有班次的产品"
departDate：用户选择的具体出发日期，来自产品详情中的团期价格日历，用于下单
Q4: 如何处理团期选择？
A:

调用 getCruiseProductDetail 获取 productPriceCalendar.rows
遍历展示所有团期的 departDate 和价格信息
过滤掉价格为 0 的无效团期
当 tuniuChildPrice 为 0 时，不要展示儿童价
等待用户明确选择一个 departDate
将选中的 departDate 传入 saveCruiseOrder
Q5: 如何分页查询邮轮列表？
A: 分页时传入相同的筛选条件和 pageNum（从 2 开始）即可。首次查询返回的 data.count 是总数，可据此计算总页数。

Q6: traceId 有什么作用？
A: traceId 用于串联从产品查询到订单提交的完整流程，便于问题排查和日志追踪。建议将 getCruiseProductDetail 返回的 traceId 传入 saveCruiseOrder。

Q7: 用户说"游轮"时如何处理？
A: 系统已兼容"游轮"说法，用户说"游轮"等同于"邮轮"，所有工具都会正常响应，无需特殊处理。

Q8: 下单失败如何处理？
A:

检查参数是否从详情接口正确获取
确认用户选择的 departDate 在团期列表中
验证乘客信息格式是否正确
查看返回的 errorCode 和 msg 了解具体错误原因